"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES_EDIT, TRANSICIONES } from "@/lib/admin";
import { siguienteNumero } from "@/lib/expedientes";
import type { ReclamoEstado } from "@prisma/client";

const CambiarEstadoSchema = z.object({
  reclamoId: z.string().min(1),
  estado: z.enum([
    "RECIBIDO",
    "EN_REVISION",
    "DERIVADO",
    "EN_PROCESO",
    "RESUELTO",
    "CERRADO_SIN_SOLUCION",
    "RECHAZADO",
  ]),
  mensaje: z.string().max(2000).optional(),
});

export async function cambiarEstado(formData: FormData) {
  const session = await auth();
  if (!session || !ROLES_EDIT.includes(session.user.rol)) {
    throw new Error("Sin permiso");
  }

  const parsed = CambiarEstadoSchema.safeParse({
    reclamoId: formData.get("reclamoId"),
    estado: formData.get("estado"),
    mensaje: formData.get("mensaje") || undefined,
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  const { reclamoId, estado, mensaje } = parsed.data;

  const actual = await prisma.reclamo.findUnique({
    where: { id: reclamoId },
  });
  if (!actual) throw new Error("Reclamo inexistente");

  // Operador de prestadora solo puede tocar reclamos asignados a su empresa
  if (
    session.user.rol === "OPERADOR_PRESTADORA" &&
    actual.prestadoraId !== session.user.prestadoraId
  ) {
    throw new Error("Sin permiso sobre este reclamo");
  }

  // Validar transición permitida
  if (!TRANSICIONES[actual.estado].includes(estado as ReclamoEstado)) {
    throw new Error(`No se puede pasar de ${actual.estado} a ${estado}`);
  }

  const esCierre =
    estado === "RESUELTO" ||
    estado === "CERRADO_SIN_SOLUCION" ||
    estado === "RECHAZADO";

  await prisma.$transaction([
    prisma.reclamo.update({
      where: { id: reclamoId },
      data: {
        estado: estado as ReclamoEstado,
        cerradoEn: esCierre ? new Date() : actual.cerradoEn,
      },
    }),
    prisma.reclamoEvento.create({
      data: {
        reclamoId,
        tipo: "CAMBIO_ESTADO",
        estadoNuevo: estado as ReclamoEstado,
        autorId: session.user.id,
        mensaje: mensaje ?? null,
      },
    }),
  ]);

  revalidatePath(`/admin/reclamo/${reclamoId}`);
  revalidatePath(`/admin/bandeja`);
  revalidatePath(`/admin`);
}

const ComentarSchema = z.object({
  reclamoId: z.string().min(1),
  mensaje: z.string().min(1).max(2000),
});

export async function agregarComentario(formData: FormData) {
  const session = await auth();
  if (!session || !ROLES_EDIT.includes(session.user.rol)) {
    throw new Error("Sin permiso");
  }

  const parsed = ComentarSchema.safeParse({
    reclamoId: formData.get("reclamoId"),
    mensaje: formData.get("mensaje"),
  });
  if (!parsed.success) throw new Error("Mensaje requerido");

  const reclamo = await prisma.reclamo.findUnique({
    where: { id: parsed.data.reclamoId },
  });
  if (!reclamo) throw new Error("Reclamo inexistente");

  if (
    session.user.rol === "OPERADOR_PRESTADORA" &&
    reclamo.prestadoraId !== session.user.prestadoraId
  ) {
    throw new Error("Sin permiso");
  }

  await prisma.reclamoEvento.create({
    data: {
      reclamoId: parsed.data.reclamoId,
      tipo: "COMENTARIO",
      autorId: session.user.id,
      mensaje: parsed.data.mensaje,
    },
  });

  revalidatePath(`/admin/reclamo/${parsed.data.reclamoId}`);
}

const ReasignarSchema = z.object({
  reclamoId: z.string().min(1),
  prestadoraId: z.string().min(1),
});

export async function reasignarPrestadora(formData: FormData) {
  const session = await auth();
  if (
    !session ||
    (session.user.rol !== "GESTOR_ENTE" && session.user.rol !== "SUPER_ADMIN")
  ) {
    throw new Error("Solo el Ente puede reasignar");
  }

  const parsed = ReasignarSchema.safeParse({
    reclamoId: formData.get("reclamoId"),
    prestadoraId: formData.get("prestadoraId"),
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  const prestadora = await prisma.prestadora.findUnique({
    where: { id: parsed.data.prestadoraId },
  });
  if (!prestadora) throw new Error("Prestadora inexistente");

  await prisma.$transaction([
    prisma.reclamo.update({
      where: { id: parsed.data.reclamoId },
      data: { prestadoraId: parsed.data.prestadoraId },
    }),
    prisma.reclamoEvento.create({
      data: {
        reclamoId: parsed.data.reclamoId,
        tipo: "ASIGNACION",
        autorId: session.user.id,
        mensaje: `Reasignado a ${prestadora.razonSocial}`,
      },
    }),
  ]);

  revalidatePath(`/admin/reclamo/${parsed.data.reclamoId}`);
}

const ElevarSchema = z.object({
  reclamoId: z.string().min(1),
  asunto: z.string().min(5).max(200),
  caratula: z.string().min(5).max(200).optional(),
});

export async function elevarAExpediente(formData: FormData) {
  const session = await auth();
  if (
    !session ||
    (session.user.rol !== "GESTOR_ENTE" && session.user.rol !== "SUPER_ADMIN")
  ) {
    throw new Error("Solo el Ente puede elevar a expediente");
  }

  const parsed = ElevarSchema.safeParse({
    reclamoId: formData.get("reclamoId"),
    asunto: formData.get("asunto"),
    caratula: formData.get("caratula") || undefined,
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  const reclamo = await prisma.reclamo.findUnique({
    where: { id: parsed.data.reclamoId },
    include: { prestadora: true, servicio: true },
  });
  if (!reclamo) throw new Error("Reclamo inexistente");
  if (!reclamo.prestadoraId || !reclamo.prestadora) {
    throw new Error("El reclamo no tiene prestadora asignada");
  }
  if (reclamo.expedienteId) {
    throw new Error("Este reclamo ya está en un expediente");
  }

  // Generar número consecutivo del año
  const existentes = await prisma.expediente.findMany({
    select: { numero: true },
  });
  const numero = siguienteNumero(existentes.map((e) => e.numero));

  const caratula =
    parsed.data.caratula ??
    `ENCOSEP c/ ${reclamo.prestadora.razonSocial} s/ ${reclamo.servicio.nombreCorto} — reclamo #${reclamo.codigo}`;

  const exp = await prisma.expediente.create({
    data: {
      numero,
      caratula,
      asunto: parsed.data.asunto,
      prestadoraId: reclamo.prestadoraId,
      iniciadorId: session.user.id,
      reclamos: { connect: { id: reclamo.id } },
      actos: {
        create: {
          tipo: "CARATULACION",
          titulo: `Apertura del expediente ${numero}`,
          cuerpo:
            `Se da por iniciado el presente expediente con motivo del reclamo ` +
            `#${reclamo.codigo} (${reclamo.titulo}) presentado por el ciudadano ` +
            `con domicilio en ${reclamo.direccion}. Se intima a la prestadora ` +
            `${reclamo.prestadora.razonSocial} a tomar conocimiento.`,
          autorId: session.user.id,
        },
      },
    },
  });

  await prisma.reclamoEvento.create({
    data: {
      reclamoId: reclamo.id,
      tipo: "NOTIFICACION",
      autorId: session.user.id,
      mensaje: `Elevado a expediente ${numero}`,
    },
  });

  revalidatePath(`/admin/reclamo/${reclamo.id}`);
  revalidatePath(`/admin/expedientes`);
  redirect(`/admin/expediente/${exp.id}`);
}
