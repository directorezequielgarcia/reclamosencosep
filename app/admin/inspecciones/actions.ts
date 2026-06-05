"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeGestionarInspecciones } from "@/lib/admin";
import { siguienteCodigoInspeccion } from "@/lib/inspecciones";
import { EstadoInspeccion, TipoInspeccion } from "@prisma/client";

const CrearInspeccionSchema = z.object({
  servicioId: z.string().min(1, "Elegí el servicio inspeccionado"),
  tipo: z.nativeEnum(TipoInspeccion),
  fecha: z
    .string()
    .min(1, "Indicá la fecha de la inspección")
    .transform((s) => new Date(s)),
  titulo: z
    .string()
    .min(4, "El título debe tener al menos 4 caracteres")
    .max(200),
  // Observaciones opcional: la idea es poder crear una inspección rápida con
  // sólo título y después grabar audio dictado / sumar fotos desde el detalle.
  observaciones: z.string().max(20000).optional().or(z.literal("")),
  direccion: z.string().max(200).optional().or(z.literal("")),
  barrio: z.string().max(120).optional().or(z.literal("")),
  prestadoraId: z.string().optional().or(z.literal("")),
  expedienteId: z.string().optional().or(z.literal("")),
  lat: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((s) => (s && s.length ? parseFloat(s) : null)),
  lng: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((s) => (s && s.length ? parseFloat(s) : null)),
});

/** Alta de una inspección de campo. Queda en BORRADOR. */
export async function crearInspeccion(formData: FormData) {
  const session = await auth();
  if (!session || !puedeGestionarInspecciones(session.user.rol)) {
    throw new Error("No tenés permiso para cargar inspecciones");
  }

  const raw = {
    servicioId: String(formData.get("servicioId") ?? ""),
    tipo: formData.get("tipo"),
    fecha: String(formData.get("fecha") ?? ""),
    titulo: String(formData.get("titulo") ?? "").trim(),
    observaciones: String(formData.get("observaciones") ?? "").trim(),
    direccion: String(formData.get("direccion") ?? "").trim(),
    barrio: String(formData.get("barrio") ?? "").trim(),
    prestadoraId: String(formData.get("prestadoraId") ?? "").trim(),
    expedienteId: String(formData.get("expedienteId") ?? "").trim(),
    lat: String(formData.get("lat") ?? "").trim(),
    lng: String(formData.get("lng") ?? "").trim(),
  };

  const parsed = CrearInspeccionSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }
  const datos = parsed.data;

  if (Number.isNaN(datos.fecha.getTime())) {
    throw new Error("La fecha es inválida");
  }

  const anio = datos.fecha.getFullYear();
  const codigo = await siguienteCodigoInspeccion(anio);

  const insp = await prisma.inspeccion.create({
    data: {
      codigo,
      fecha: datos.fecha,
      inspectorId: session.user.id,
      servicioId: datos.servicioId,
      prestadoraId: datos.prestadoraId?.length ? datos.prestadoraId : null,
      expedienteId: datos.expedienteId?.length ? datos.expedienteId : null,
      tipo: datos.tipo,
      estado: "BORRADOR",
      titulo: datos.titulo,
      observaciones: datos.observaciones?.length ? datos.observaciones : "",
      direccion: datos.direccion?.length ? datos.direccion : null,
      barrio: datos.barrio?.length ? datos.barrio : null,
      lat: datos.lat,
      lng: datos.lng,
    },
  });

  revalidatePath("/admin/inspecciones");
  redirect(`/admin/inspecciones/${insp.id}`);
}

const ActualizarSchema = z.object({
  inspeccionId: z.string().min(1),
  titulo: z.string().min(4).max(200).optional(),
  observaciones: z.string().max(20000).optional(),
  direccion: z.string().max(200).optional().or(z.literal("")),
  barrio: z.string().max(120).optional().or(z.literal("")),
  transcripcionAudio: z.string().max(40000).optional().or(z.literal("")),
  lat: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((s) => (s && s.length ? parseFloat(s) : null)),
  lng: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((s) => (s && s.length ? parseFloat(s) : null)),
});

export async function actualizarInspeccion(formData: FormData) {
  const session = await auth();
  if (!session || !puedeGestionarInspecciones(session.user.rol)) {
    throw new Error("Sin permisos");
  }

  const parsed = ActualizarSchema.safeParse({
    inspeccionId: formData.get("inspeccionId"),
    titulo: formData.get("titulo") ?? undefined,
    observaciones: formData.get("observaciones") ?? undefined,
    direccion: formData.get("direccion") ?? "",
    barrio: formData.get("barrio") ?? "",
    transcripcionAudio: formData.get("transcripcionAudio") ?? "",
    lat: formData.get("lat") ?? "",
    lng: formData.get("lng") ?? "",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }
  const datos = parsed.data;

  const insp = await prisma.inspeccion.findUnique({
    where: { id: datos.inspeccionId },
  });
  if (!insp) throw new Error("Inspección no encontrada");
  if (insp.estado === "ARCHIVADA") {
    throw new Error("No se puede editar una inspección archivada");
  }

  await prisma.inspeccion.update({
    where: { id: insp.id },
    data: {
      titulo: datos.titulo ?? insp.titulo,
      observaciones: datos.observaciones ?? insp.observaciones,
      direccion:
        datos.direccion === undefined
          ? insp.direccion
          : datos.direccion?.length
            ? datos.direccion
            : null,
      barrio:
        datos.barrio === undefined
          ? insp.barrio
          : datos.barrio?.length
            ? datos.barrio
            : null,
      transcripcionAudio:
        datos.transcripcionAudio === undefined
          ? insp.transcripcionAudio
          : datos.transcripcionAudio?.length
            ? datos.transcripcionAudio
            : null,
      lat: datos.lat ?? insp.lat,
      lng: datos.lng ?? insp.lng,
    },
  });

  revalidatePath(`/admin/inspecciones/${insp.id}`);
  revalidatePath("/admin/inspecciones");
}

const CambiarEstadoSchema = z.object({
  inspeccionId: z.string().min(1),
  estado: z.nativeEnum(EstadoInspeccion),
});

export async function cambiarEstadoInspeccion(formData: FormData) {
  const session = await auth();
  if (!session || !puedeGestionarInspecciones(session.user.rol)) {
    throw new Error("Sin permisos");
  }

  const parsed = CambiarEstadoSchema.safeParse({
    inspeccionId: formData.get("inspeccionId"),
    estado: formData.get("estado"),
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  // Para pasar a PUBLICADA, la inspección debe estar vinculada a un expediente
  // o haber generado un reclamo (de oficio o existente). Sin vínculo no se
  // publica para "todo el equipo": el modelo es que las inspecciones se
  // ven a través del contenedor (reclamo o expediente) al que están atadas.
  if (parsed.data.estado === "PUBLICADA") {
    const insp = await prisma.inspeccion.findUnique({
      where: { id: parsed.data.inspeccionId },
      include: {
        _count: { select: { reclamos: true, reclamosOriginados: true } },
      },
    });
    if (!insp) throw new Error("Inspección no encontrada");
    const tieneVinculo =
      !!insp.expedienteId ||
      insp._count.reclamos > 0 ||
      insp._count.reclamosOriginados > 0;
    if (!tieneVinculo) {
      throw new Error(
        "Para publicar la inspección primero asocialá a un expediente o generá un reclamo de oficio desde el detalle.",
      );
    }
  }

  await prisma.inspeccion.update({
    where: { id: parsed.data.inspeccionId },
    data: { estado: parsed.data.estado },
  });

  revalidatePath(`/admin/inspecciones/${parsed.data.inspeccionId}`);
  revalidatePath("/admin/inspecciones");
}

/** Vincula la inspección a un expediente existente (o desvincula si vacío). */
const VincularExpedienteSchema = z.object({
  inspeccionId: z.string().min(1),
  expedienteId: z.string().optional(),
});

export async function vincularExpediente(formData: FormData) {
  const session = await auth();
  if (!session || !puedeGestionarInspecciones(session.user.rol)) {
    throw new Error("Sin permisos");
  }
  const parsed = VincularExpedienteSchema.safeParse({
    inspeccionId: formData.get("inspeccionId"),
    expedienteId: (formData.get("expedienteId") as string) || undefined,
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  await prisma.inspeccion.update({
    where: { id: parsed.data.inspeccionId },
    data: {
      expedienteId: parsed.data.expedienteId?.length
        ? parsed.data.expedienteId
        : null,
    },
  });

  revalidatePath(`/admin/inspecciones/${parsed.data.inspeccionId}`);
}

/**
 * Genera un reclamo de oficio desde una inspección. Hereda servicio,
 * prestadora y ubicación de la inspección. Queda en bandeja para que el
 * rol EXPEDIENTES (Yanina) decida si lo escala a expediente.
 *
 * El "denunciante" técnico es el propio inspector (no se pide a un vecino),
 * pero la marca origenOficio = true lo identifica como denuncia interna.
 */
const CrearReclamoOficioSchema = z.object({
  inspeccionId: z.string().min(1),
});

export async function crearReclamoOficio(formData: FormData) {
  const session = await auth();
  if (!session || !puedeGestionarInspecciones(session.user.rol)) {
    throw new Error("Sin permisos");
  }
  const parsed = CrearReclamoOficioSchema.safeParse({
    inspeccionId: formData.get("inspeccionId"),
  });
  if (!parsed.success) throw new Error("Falta inspeccionId");

  const insp = await prisma.inspeccion.findUnique({
    where: { id: parsed.data.inspeccionId },
    include: { servicio: true, prestadora: true },
  });
  if (!insp) throw new Error("Inspección no encontrada");

  // Código distintivo para reclamos de oficio: OFI-YYYY-NNN.
  const anio = new Date().getFullYear();
  const prefijo = `OFI-${anio}-`;
  const ultimo = await prisma.reclamo.findFirst({
    where: { codigo: { startsWith: prefijo } },
    orderBy: { codigo: "desc" },
    select: { codigo: true },
  });
  let n = 1;
  if (ultimo?.codigo) {
    const parteN = parseInt(ultimo.codigo.slice(prefijo.length), 10);
    if (Number.isFinite(parteN)) n = parteN + 1;
  }
  const codigo = `${prefijo}${String(n).padStart(3, "0")}`;

  await prisma.reclamo.create({
    data: {
      codigo,
      ciudadanoId: insp.inspectorId, // el inspector actúa como "denunciante" técnico
      origenOficio: true,
      inspeccionOrigenId: insp.id,
      servicioId: insp.servicioId,
      prestadoraId: insp.prestadoraId,
      titulo: `Reclamo de oficio — ${insp.titulo}`,
      descripcion:
        insp.observaciones && insp.observaciones.trim().length
          ? insp.observaciones
          : `Reclamo de oficio generado desde la inspección ${insp.codigo}. Revisar audio y fotos adjuntas en la inspección.`,
      direccion: insp.direccion ?? "S/D",
      barrio: insp.barrio,
      lat: insp.lat,
      lng: insp.lng,
      estado: "RECIBIDO",
      eventos: {
        create: {
          tipo: "CREACION",
          autorId: session.user.id,
          mensaje: `Reclamo de oficio iniciado desde la inspección ${insp.codigo}.`,
        },
      },
      // Vinculación M:N para que la inspección "muestre sus reclamos asociados".
      inspecciones: { connect: { id: insp.id } },
    },
  });

  revalidatePath(`/admin/inspecciones/${insp.id}`);
  revalidatePath("/admin/bandeja");
}
