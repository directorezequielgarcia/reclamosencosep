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
  observaciones: z
    .string()
    .min(10, "Las observaciones deben tener al menos 10 caracteres")
    .max(20000),
  direccion: z.string().max(200).optional().or(z.literal("")),
  barrio: z.string().max(120).optional().or(z.literal("")),
  prestadoraId: z.string().optional().or(z.literal("")),
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
      tipo: datos.tipo,
      estado: "BORRADOR",
      titulo: datos.titulo,
      observaciones: datos.observaciones,
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
  observaciones: z.string().min(10).max(20000).optional(),
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

  await prisma.inspeccion.update({
    where: { id: parsed.data.inspeccionId },
    data: { estado: parsed.data.estado },
  });

  revalidatePath(`/admin/inspecciones/${parsed.data.inspeccionId}`);
  revalidatePath("/admin/inspecciones");
}
