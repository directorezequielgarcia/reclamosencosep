"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES_EDIT, TRANSICIONES } from "@/lib/admin";
import { siguienteNumero } from "@/lib/expedientes";
import { guardarFotoReclamo, validarUrlBlobDeVideo } from "@/lib/uploads";
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
  revalidatePath(`/admin/mesa-de-trabajo`);
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

  // Checkbox del panel: si está tildado, el comentario es una RESPUESTA visible
  // para el vecino; si no, queda como nota interna del equipo.
  const visibleVecino = formData.get("visibleVecino") === "on";

  await prisma.reclamoEvento.create({
    data: {
      reclamoId: parsed.data.reclamoId,
      tipo: "COMENTARIO",
      autorId: session.user.id,
      mensaje: parsed.data.mensaje,
      visibleVecino,
    },
  });

  revalidatePath(`/admin/reclamo/${parsed.data.reclamoId}`);
  // Si es visible, también refrescamos la vista del vecino.
  if (visibleVecino) revalidatePath(`/mis-reclamos/${reclamo.codigo}`);
}

// El Ente adjunta documentación (foto de una inspección, un PDF de
// respuesta, etc.) directamente en el reclamo. Queda visible para el vecino
// en su seguimiento, igual que cuando él mismo suma documentación.
export async function agregarAdjuntoAdmin(formData: FormData) {
  const session = await auth();
  if (!session || !ROLES_EDIT.includes(session.user.rol)) {
    throw new Error("Sin permiso");
  }

  const reclamoId = String(formData.get("reclamoId") ?? "");
  const reclamo = await prisma.reclamo.findUnique({ where: { id: reclamoId } });
  if (!reclamo) throw new Error("Reclamo inexistente");

  if (
    session.user.rol === "OPERADOR_PRESTADORA" &&
    reclamo.prestadoraId !== session.user.prestadoraId
  ) {
    throw new Error("Sin permiso sobre este reclamo");
  }

  const archivos = formData
    .getAll("archivo")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, 5);
  if (archivos.length === 0) throw new Error("Adjuntá al menos un archivo");

  const mensaje = String(formData.get("mensaje") ?? "").trim();

  let guardados = 0;
  for (const f of archivos) {
    try {
      const saved = await guardarFotoReclamo(reclamo.id, f);
      await prisma.adjunto.create({
        data: {
          reclamoId: reclamo.id,
          tipo: saved.mimeType === "application/pdf" ? "DOCUMENTO" : "FOTO",
          url: saved.url,
          mimeType: saved.mimeType,
          bytes: saved.bytes,
        },
      });
      guardados++;
    } catch (e) {
      console.error("adjunto admin rechazado:", (e as Error).message);
    }
  }
  if (guardados === 0) throw new Error("No se pudo guardar ningún archivo");

  await prisma.reclamoEvento.create({
    data: {
      reclamoId: reclamo.id,
      tipo: "ADJUNTO",
      autorId: session.user.id,
      mensaje:
        mensaje ||
        `El ENCOSEP agregó ${guardados} archivo${guardados === 1 ? "" : "s"}.`,
      visibleVecino: true,
    },
  });

  revalidatePath(`/admin/reclamo/${reclamo.id}`);
  revalidatePath(`/mis-reclamos/${reclamo.codigo}`);
  revalidatePath(`/admin/bandeja`);
}

const VideoAdminSchema = z.object({
  reclamoId: z.string().min(1),
  url: z.string().url(),
  mimeType: z.string().min(1),
  bytes: z.coerce.number().int().positive(),
});

// El video ya está subido a Vercel Blob (subida directa desde el navegador,
// ver SubirVideoReclamo) — acá solo registramos el Adjunto en la base.
export async function agregarVideoAdmin(formData: FormData) {
  const session = await auth();
  if (!session || !ROLES_EDIT.includes(session.user.rol)) {
    throw new Error("Sin permiso");
  }

  const parsed = VideoAdminSchema.safeParse({
    reclamoId: formData.get("reclamoId"),
    url: formData.get("url"),
    mimeType: formData.get("mimeType"),
    bytes: formData.get("bytes"),
  });
  if (!parsed.success) throw new Error("Datos de video inválidos");

  const reclamo = await prisma.reclamo.findUnique({
    where: { id: parsed.data.reclamoId },
  });
  if (!reclamo) throw new Error("Reclamo inexistente");
  if (
    session.user.rol === "OPERADOR_PRESTADORA" &&
    reclamo.prestadoraId !== session.user.prestadoraId
  ) {
    throw new Error("Sin permiso sobre este reclamo");
  }

  validarUrlBlobDeVideo(parsed.data.url, `reclamos/${reclamo.id}/videos/`);

  await prisma.adjunto.create({
    data: {
      reclamoId: reclamo.id,
      tipo: "VIDEO",
      url: parsed.data.url,
      mimeType: parsed.data.mimeType,
      bytes: parsed.data.bytes,
    },
  });
  await prisma.reclamoEvento.create({
    data: {
      reclamoId: reclamo.id,
      tipo: "ADJUNTO",
      autorId: session.user.id,
      mensaje: "El ENCOSEP agregó un video.",
      visibleVecino: true,
    },
  });

  revalidatePath(`/admin/reclamo/${reclamo.id}`);
  revalidatePath(`/mis-reclamos/${reclamo.codigo}`);
  revalidatePath(`/admin/bandeja`);
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
  tipoExpediente: z.string().max(60).optional(),
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
    tipoExpediente: formData.get("tipoExpediente") || undefined,
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  const reclamo = await prisma.reclamo.findUnique({
    where: { id: parsed.data.reclamoId },
    include: { prestadora: true, servicio: true, ciudadano: true },
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

  const tipoExpediente = parsed.data.tipoExpediente ?? "Reclamo individual";
  const reclamante = reclamo.origenOficio
    ? "ENCOSEP (de oficio)"
    : `${reclamo.ciudadano.nombre} ${reclamo.ciudadano.apellido}`;
  const intervinientes = `Reclamante: ${reclamante} · Prestadora: ${reclamo.prestadora.razonSocial}`;

  // Carátula enriquecida: Tipo — Reclamante c/ Prestadora s/ Objeto
  const caratula =
    parsed.data.caratula ??
    `${tipoExpediente} — ${reclamante} c/ ${reclamo.prestadora.razonSocial} s/ ${parsed.data.asunto}`;

  const exp = await prisma.expediente.create({
    data: {
      numero,
      caratula,
      asunto: parsed.data.asunto,
      tipoExpediente,
      intervinientes,
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
          confirmadoEn: new Date(),
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

  // Estado automático al elevar: el reclamo pasa a DERIVADO (igual se puede
  // cambiar a mano después).
  if (reclamo.estado !== "DERIVADO") {
    await prisma.reclamo.update({
      where: { id: reclamo.id },
      data: { estado: "DERIVADO" },
    });
  }

  // Arrastrar al expediente la conversación con el vecino (los comentarios
  // visibles del reclamo se convierten en el chat con el usuario del expediente).
  const comentarios = await prisma.reclamoEvento.findMany({
    where: { reclamoId: reclamo.id, tipo: "COMENTARIO", visibleVecino: true },
    orderBy: { createdAt: "asc" },
    include: { autor: true },
  });
  if (comentarios.length > 0) {
    await prisma.mensajeExpediente.createMany({
      data: comentarios.map((c) => ({
        expedienteId: exp.id,
        canal: "USUARIO" as const,
        autorId: c.autorId ?? session.user.id,
        autorNombre: c.autor ? `${c.autor.nombre} ${c.autor.apellido}` : "—",
        esEnte: c.autor ? c.autor.rol !== "CIUDADANO" : true,
        cuerpo: c.mensaje ?? "",
      })),
    });
  }

  revalidatePath(`/admin/reclamo/${reclamo.id}`);
  revalidatePath(`/admin/expedientes`);
  redirect(`/admin/expediente/${exp.id}`);
}
