"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeVerAgenda } from "@/lib/admin";

const CrearSchema = z.object({
  texto: z.string().min(1).max(500),
  fechaLimite: z.string().optional(),
});

export async function crearAgendaItem(formData: FormData) {
  const session = await auth();
  if (!session || !puedeVerAgenda(session.user.rol)) {
    throw new Error("Sin permiso");
  }

  const parsed = CrearSchema.safeParse({
    texto: formData.get("texto"),
    fechaLimite: formData.get("fechaLimite") || undefined,
  });
  if (!parsed.success) throw new Error("Datos inválidos");
  const d = parsed.data;

  await prisma.agendaItem.create({
    data: {
      texto: d.texto,
      fechaLimite: d.fechaLimite ? new Date(`${d.fechaLimite}T00:00:00`) : null,
      autorId: session.user.id,
    },
  });
  revalidatePath("/admin/agenda");
}

export async function alternarCompletado(formData: FormData) {
  const session = await auth();
  if (!session || !puedeVerAgenda(session.user.rol)) {
    throw new Error("Sin permiso");
  }

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta id");
  const item = await prisma.agendaItem.findUnique({ where: { id } });
  if (!item) throw new Error("No existe");

  await prisma.agendaItem.update({
    where: { id },
    data: {
      completado: !item.completado,
      completadoEn: !item.completado ? new Date() : null,
    },
  });
  revalidatePath("/admin/agenda");
}

export async function borrarAgendaItem(formData: FormData) {
  const session = await auth();
  if (!session || !puedeVerAgenda(session.user.rol)) {
    throw new Error("Sin permiso");
  }
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta id");
  await prisma.agendaItem.delete({ where: { id } });
  revalidatePath("/admin/agenda");
}
