"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { guardarAdjuntoActo } from "@/lib/uploads";
import type { AdjuntoTipo, ExpedienteEstado, TipoActo } from "@prisma/client";

const ActoSchema = z.object({
  expedienteId: z.string().min(1),
  tipo: z.enum([
    "ACTA_RECEPCION",
    "NOTIFICACION",
    "INTIMACION",
    "CONSTATACION",
    "AMPLIACION",
    "DISPOSICION",
    "RESOLUCION",
    "CIERRE",
    "NOTA",
    "DESCARGO_PRESTADORA",
  ]),
  titulo: z.string().min(3).max(200),
  cuerpo: z.string().min(5).max(20000),
});

export async function agregarActo(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Sin sesión");

  const parsed = ActoSchema.safeParse({
    expedienteId: formData.get("expedienteId"),
    tipo: formData.get("tipo"),
    titulo: formData.get("titulo"),
    cuerpo: formData.get("cuerpo"),
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  const exp = await prisma.expediente.findUnique({
    where: { id: parsed.data.expedienteId },
  });
  if (!exp) throw new Error("Expediente inexistente");

  // Validar permisos por tipo de acto y rol
  const esEnte =
    session.user.rol === "GESTOR_ENTE" ||
    session.user.rol === "SUPER_ADMIN";
  const esOperadorEstaPrestadora =
    session.user.rol === "OPERADOR_PRESTADORA" &&
    session.user.prestadoraId === exp.prestadoraId;

  if (parsed.data.tipo === "DESCARGO_PRESTADORA") {
    if (!esOperadorEstaPrestadora) {
      throw new Error("El descargo solo lo puede labrar la prestadora");
    }
  } else {
    if (!esEnte) {
      throw new Error("Solo el Ente puede labrar este tipo de acto");
    }
  }

  // Creamos el acto primero para tener su id (necesario para los adjuntos).
  const acto = await prisma.actoAdministrativo.create({
    data: {
      expedienteId: parsed.data.expedienteId,
      tipo: parsed.data.tipo as TipoActo,
      titulo: parsed.data.titulo,
      cuerpo: parsed.data.cuerpo,
      autorId: session.user.id,
    },
  });

  // Adjuntos opcionales (fotos, videos, audios, documentos).
  const archivos = formData
    .getAll("archivos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of archivos) {
    try {
      const guardado = await guardarAdjuntoActo(acto.id, file);
      await prisma.actoAdjunto.create({
        data: {
          actoId: acto.id,
          tipo: guardado.tipo as AdjuntoTipo,
          url: guardado.url,
          nombre: guardado.nombre,
          mimeType: guardado.mimeType,
          bytes: guardado.bytes,
        },
      });
    } catch {
      // Un archivo inválido no debe tumbar el acto completo; se ignora.
    }
  }

  // Estado del expediente según el acto.
  const esCierre = parsed.data.tipo === "CIERRE";
  if (esCierre) {
    await prisma.expediente.update({
      where: { id: parsed.data.expedienteId },
      data: { estado: "RESUELTO", cerradoEn: new Date() },
    });
  } else if (exp.estado === "ABIERTO") {
    await prisma.expediente.update({
      where: { id: parsed.data.expedienteId },
      data: { estado: "EN_TRAMITE" },
    });
  }

  revalidatePath(`/admin/expediente/${parsed.data.expedienteId}`);
  revalidatePath(`/admin/expedientes`);
}

export async function notificarActo(formData: FormData) {
  const session = await auth();
  if (
    !session ||
    (session.user.rol !== "GESTOR_ENTE" && session.user.rol !== "SUPER_ADMIN")
  ) {
    throw new Error("Solo el Ente puede notificar");
  }

  const actoId = String(formData.get("actoId") ?? "");
  if (!actoId) throw new Error("Falta el acto");

  const acto = await prisma.actoAdministrativo.findUnique({
    where: { id: actoId },
    include: { expediente: { include: { prestadora: true } } },
  });
  if (!acto) throw new Error("Acto inexistente");
  if (acto.notificadoEn) throw new Error("Este acto ya fue notificado");

  await prisma.actoAdministrativo.update({
    where: { id: actoId },
    data: {
      notificadoEn: new Date(),
      notificadoA: acto.expediente.prestadora.razonSocial,
    },
  });

  revalidatePath(`/admin/expediente/${acto.expedienteId}`);
}

const MensajeSchema = z.object({
  expedienteId: z.string().min(1),
  canal: z.enum(["USUARIO", "PRESTADORA"]),
  cuerpo: z.string().min(1).max(4000),
});

export async function enviarMensajeExpediente(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Sin sesión");

  const parsed = MensajeSchema.safeParse({
    expedienteId: formData.get("expedienteId"),
    canal: formData.get("canal"),
    cuerpo: formData.get("cuerpo"),
  });
  if (!parsed.success) throw new Error("Mensaje inválido");

  const exp = await prisma.expediente.findUnique({
    where: { id: parsed.data.expedienteId },
  });
  if (!exp) throw new Error("Expediente inexistente");

  const esEnte =
    session.user.rol === "GESTOR_ENTE" || session.user.rol === "SUPER_ADMIN";
  const esOperadorEstaPrestadora =
    session.user.rol === "OPERADOR_PRESTADORA" &&
    session.user.prestadoraId === exp.prestadoraId;

  // El Ente escribe en ambos canales; la prestadora solo en el suyo.
  if (!esEnte) {
    if (!(esOperadorEstaPrestadora && parsed.data.canal === "PRESTADORA")) {
      throw new Error("Sin permiso para escribir en este canal");
    }
  }

  const nombre =
    session.user.name && session.user.name.trim().length > 0
      ? session.user.name
      : esEnte
        ? "ENCOSEP"
        : exp.prestadoraId
          ? "Prestadora"
          : "Usuario";

  await prisma.mensajeExpediente.create({
    data: {
      expedienteId: parsed.data.expedienteId,
      canal: parsed.data.canal,
      autorId: session.user.id,
      autorNombre: nombre,
      esEnte,
      cuerpo: parsed.data.cuerpo,
    },
  });

  revalidatePath(`/admin/expediente/${parsed.data.expedienteId}`);
}

const CambiarEstadoExpSchema = z.object({
  expedienteId: z.string().min(1),
  estado: z.enum(["ABIERTO", "EN_TRAMITE", "RESUELTO", "ARCHIVADO"]),
});

export async function cambiarEstadoExpediente(formData: FormData) {
  const session = await auth();
  if (
    !session ||
    (session.user.rol !== "GESTOR_ENTE" && session.user.rol !== "SUPER_ADMIN")
  ) {
    throw new Error("Sin permiso");
  }

  const parsed = CambiarEstadoExpSchema.safeParse({
    expedienteId: formData.get("expedienteId"),
    estado: formData.get("estado"),
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  const esCierre =
    parsed.data.estado === "RESUELTO" || parsed.data.estado === "ARCHIVADO";

  await prisma.expediente.update({
    where: { id: parsed.data.expedienteId },
    data: {
      estado: parsed.data.estado as ExpedienteEstado,
      cerradoEn: esCierre ? new Date() : null,
    },
  });

  revalidatePath(`/admin/expediente/${parsed.data.expedienteId}`);
  revalidatePath(`/admin/expedientes`);
}
