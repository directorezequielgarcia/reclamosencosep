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
    "CONVOCATORIA_AUDIENCIA",
    "AUDIENCIA",
    "DICTAMEN",
    "DERIVACION",
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
  // Alcance: "SOLO" = solo esta etapa · "HASTA" = todo el expediente hasta acá.
  const alcance = formData.get("alcance") === "HASTA" ? "HASTA" : "SOLO";

  const acto = await prisma.actoAdministrativo.findUnique({
    where: { id: actoId },
    include: { expediente: { include: { prestadora: true } } },
  });
  if (!acto) throw new Error("Acto inexistente");

  const razon = acto.expediente.prestadora.razonSocial;
  const ahora = new Date();

  if (alcance === "HASTA") {
    // La prestadora ve el expediente completo hasta este acto (inclusive).
    await prisma.actoAdministrativo.updateMany({
      where: {
        expedienteId: acto.expedienteId,
        createdAt: { lte: acto.createdAt },
      },
      data: { visiblePrestadora: true },
    });
  } else {
    // Solo esta etapa.
    await prisma.actoAdministrativo.update({
      where: { id: actoId },
      data: { visiblePrestadora: true },
    });
  }

  // Sello de notificación en el acto comunicado.
  await prisma.actoAdministrativo.update({
    where: { id: actoId },
    data: {
      notificadoEn: ahora,
      notificadoA:
        alcance === "HASTA"
          ? `${razon} (expediente hasta esta foja)`
          : razon,
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

export async function eliminarActo(formData: FormData) {
  const session = await auth();
  if (
    !session ||
    (session.user.rol !== "GESTOR_ENTE" && session.user.rol !== "SUPER_ADMIN")
  ) {
    throw new Error("Solo el Ente puede eliminar un acto");
  }

  const actoId = String(formData.get("actoId") ?? "");
  if (!actoId) throw new Error("Falta el acto");

  const acto = await prisma.actoAdministrativo.findUnique({
    where: { id: actoId },
    select: { id: true, expedienteId: true },
  });
  if (!acto) throw new Error("Acto inexistente");

  // Los adjuntos se borran en cascada (onDelete: Cascade).
  await prisma.actoAdministrativo.delete({ where: { id: actoId } });

  revalidatePath(`/admin/expediente/${acto.expedienteId}`);
}

const CaratulaSchema = z.object({
  expedienteId: z.string().min(1),
  numero: z.string().min(1).max(40),
  tipoExpediente: z.string().min(1).max(60),
  asunto: z.string().min(3).max(200),
  caratula: z.string().min(3).max(300),
  intervinientes: z.string().max(400).optional(),
  prestadoraId: z.string().min(1),
});

export async function editarCaratula(formData: FormData) {
  const session = await auth();
  if (
    !session ||
    (session.user.rol !== "GESTOR_ENTE" && session.user.rol !== "SUPER_ADMIN")
  ) {
    throw new Error("Solo el Ente puede editar la carátula");
  }

  const parsed = CaratulaSchema.safeParse({
    expedienteId: formData.get("expedienteId"),
    numero: formData.get("numero"),
    tipoExpediente: formData.get("tipoExpediente"),
    asunto: formData.get("asunto"),
    caratula: formData.get("caratula"),
    intervinientes: formData.get("intervinientes") || undefined,
    prestadoraId: formData.get("prestadoraId"),
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  // El número de expediente debe seguir siendo único.
  const otro = await prisma.expediente.findFirst({
    where: {
      numero: parsed.data.numero,
      id: { not: parsed.data.expedienteId },
    },
    select: { id: true },
  });
  if (otro) throw new Error("Ya existe un expediente con ese número");

  // La prestadora debe existir.
  const prestadora = await prisma.prestadora.findUnique({
    where: { id: parsed.data.prestadoraId },
    select: { id: true },
  });
  if (!prestadora) throw new Error("Prestadora inexistente");

  await prisma.expediente.update({
    where: { id: parsed.data.expedienteId },
    data: {
      numero: parsed.data.numero,
      tipoExpediente: parsed.data.tipoExpediente,
      asunto: parsed.data.asunto,
      caratula: parsed.data.caratula,
      intervinientes: parsed.data.intervinientes ?? null,
      prestadoraId: parsed.data.prestadoraId,
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
