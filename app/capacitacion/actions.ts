"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeGestionarCapacitacion } from "@/lib/capacitacion";

const CrearSchema = z.object({
  titulo: z.string().min(3).max(200),
  descripcion: z.string().min(3).max(2000),
  tipo: z.enum(["VIDEO", "IMAGEN", "GUIA"]),
  url: z.string().max(600).optional().or(z.literal("")),
  contenido: z.string().max(20000).optional().or(z.literal("")),
  modulo: z.string().max(80).optional().or(z.literal("")),
  audiencia: z.enum([
    "TODOS",
    "TEAM_ENCOSEP",
    "AUTORIDAD_APLICACION",
    "CONCEJO_DELIBERANTE",
    "PEM",
    "PRESTADORAS",
  ]),
  orden: z.coerce.number().int().min(0).max(999).optional(),
});

export async function crearCapacitacion(formData: FormData) {
  const session = await auth();
  if (!session || !puedeGestionarCapacitacion(session.user.rol)) {
    throw new Error("Sin permiso");
  }

  const parsed = CrearSchema.safeParse({
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    tipo: formData.get("tipo"),
    url: formData.get("url") || undefined,
    contenido: formData.get("contenido") || undefined,
    modulo: formData.get("modulo") || undefined,
    audiencia: formData.get("audiencia"),
    orden: formData.get("orden") || undefined,
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  await prisma.capacitacion.create({
    data: {
      titulo: parsed.data.titulo,
      descripcion: parsed.data.descripcion,
      tipo: parsed.data.tipo,
      url: parsed.data.url?.length ? parsed.data.url : null,
      contenido: parsed.data.contenido?.length ? parsed.data.contenido : null,
      modulo: parsed.data.modulo?.length ? parsed.data.modulo : null,
      audiencia: parsed.data.audiencia,
      orden: parsed.data.orden ?? 0,
      creadorId: session.user.id,
    },
  });

  revalidatePath("/capacitacion");
  redirect("/capacitacion");
}

export async function eliminarCapacitacion(formData: FormData) {
  const session = await auth();
  if (!session || !puedeGestionarCapacitacion(session.user.rol)) {
    throw new Error("Sin permiso");
  }
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta el id");
  await prisma.capacitacion.delete({ where: { id } });
  revalidatePath("/capacitacion");
}
