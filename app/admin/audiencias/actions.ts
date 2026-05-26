"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { EstadoAudiencia, ModalidadAudiencia } from "@prisma/client";

const Schema = z.object({
  titulo: z.string().min(3).max(200),
  descripcion: z.string().min(5).max(5000),
  fecha: z.string().min(1),
  lugar: z.string().max(200).optional(),
  enlaceVirtual: z.string().url().optional().or(z.literal("")),
  modalidad: z.enum(["PRESENCIAL", "VIRTUAL", "HIBRIDA"]),
  capacidad: z.coerce.number().int().positive().optional(),
});

export async function crearAudiencia(formData: FormData) {
  const session = await auth();
  if (
    !session ||
    (session.user.rol !== "GESTOR_ENTE" && session.user.rol !== "SUPER_ADMIN")
  ) {
    throw new Error("Sin permiso");
  }

  const parsed = Schema.safeParse({
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    fecha: formData.get("fecha"),
    lugar: formData.get("lugar") || undefined,
    enlaceVirtual: formData.get("enlaceVirtual") || undefined,
    modalidad: formData.get("modalidad"),
    capacidad: formData.get("capacidad") || undefined,
  });
  if (!parsed.success) throw new Error("Datos inválidos");
  const d = parsed.data;

  const a = await prisma.audienciaPublica.create({
    data: {
      titulo: d.titulo,
      descripcion: d.descripcion,
      fecha: new Date(d.fecha),
      lugar: d.lugar ?? null,
      enlaceVirtual: d.enlaceVirtual || null,
      modalidad: d.modalidad as ModalidadAudiencia,
      capacidad: d.capacidad ?? null,
      estado: "ABIERTA_INSCRIPCION",
      autorId: session.user.id,
    },
  });
  revalidatePath("/admin/audiencias");
  revalidatePath("/audiencias");
  redirect(`/admin/audiencias/${a.id}`);
}

export async function cambiarEstadoAudiencia(formData: FormData) {
  const session = await auth();
  if (
    !session ||
    (session.user.rol !== "GESTOR_ENTE" && session.user.rol !== "SUPER_ADMIN")
  ) {
    throw new Error("Sin permiso");
  }
  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("estado") ?? "");
  if (!id || !estado) throw new Error("Datos inválidos");

  await prisma.audienciaPublica.update({
    where: { id },
    data: { estado: estado as EstadoAudiencia },
  });
  revalidatePath(`/admin/audiencias/${id}`);
  revalidatePath("/admin/audiencias");
  revalidatePath("/audiencias");
}

const InscripcionSchema = z.object({
  audienciaId: z.string().min(1),
  nombre: z.string().min(2).max(80),
  apellido: z.string().min(2).max(80),
  dni: z.string().min(6).max(15),
  email: z.string().email(),
  telefono: z.string().max(30).optional(),
  comentario: z.string().max(2000).optional(),
});

/** Acción pública: inscribirse a una audiencia. */
export async function inscribirseAudiencia(formData: FormData) {
  const parsed = InscripcionSchema.safeParse({
    audienciaId: formData.get("audienciaId"),
    nombre: formData.get("nombre"),
    apellido: formData.get("apellido"),
    dni: String(formData.get("dni") ?? "").replace(/\D/g, ""),
    email: formData.get("email"),
    telefono: formData.get("telefono") || undefined,
    comentario: formData.get("comentario") || undefined,
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  const aud = await prisma.audienciaPublica.findUnique({
    where: { id: parsed.data.audienciaId },
  });
  if (!aud) throw new Error("Audiencia inexistente");
  if (aud.estado !== "ABIERTA_INSCRIPCION" && aud.estado !== "PROGRAMADA") {
    throw new Error("La inscripción está cerrada para esta audiencia");
  }

  try {
    await prisma.inscripcionAudiencia.create({
      data: {
        audienciaId: parsed.data.audienciaId,
        nombre: parsed.data.nombre,
        apellido: parsed.data.apellido,
        dni: parsed.data.dni,
        email: parsed.data.email,
        telefono: parsed.data.telefono ?? null,
        comentario: parsed.data.comentario ?? null,
      },
    });
  } catch (e) {
    throw new Error("Ya estás inscripto en esta audiencia con ese DNI");
  }

  revalidatePath(`/audiencias/${parsed.data.audienciaId}`);
  revalidatePath(`/admin/audiencias/${parsed.data.audienciaId}`);
  redirect(`/audiencias/${parsed.data.audienciaId}?inscripto=1`);
}
