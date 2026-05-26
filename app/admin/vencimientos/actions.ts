"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { EstadoVencimiento, TipoDocumento } from "@prisma/client";

const Schema = z.object({
  prestadoraId: z.string().min(1),
  tipo: z.enum(["ANUAL", "MENSUAL", "CERTIFICACION", "CONTRATO", "OTRO"]),
  periodo: z.string().min(1).max(20),
  titulo: z.string().min(3).max(200),
  fechaLimite: z.string().min(1),
  observacion: z.string().max(1000).optional(),
});

export async function crearVencimiento(formData: FormData) {
  const session = await auth();
  if (
    !session ||
    (session.user.rol !== "GESTOR_ENTE" && session.user.rol !== "SUPER_ADMIN")
  ) {
    throw new Error("Sin permiso");
  }
  const parsed = Schema.safeParse({
    prestadoraId: formData.get("prestadoraId"),
    tipo: formData.get("tipo"),
    periodo: formData.get("periodo"),
    titulo: formData.get("titulo"),
    fechaLimite: formData.get("fechaLimite"),
    observacion: formData.get("observacion") || undefined,
  });
  if (!parsed.success) throw new Error("Datos inválidos");
  const d = parsed.data;

  await prisma.vencimiento.create({
    data: {
      prestadoraId: d.prestadoraId,
      tipo: d.tipo as TipoDocumento,
      periodo: d.periodo,
      titulo: d.titulo,
      fechaLimite: new Date(d.fechaLimite),
      observacion: d.observacion ?? null,
    },
  });
  revalidatePath("/admin/vencimientos");
}

export async function cambiarEstadoVencimiento(formData: FormData) {
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
  await prisma.vencimiento.update({
    where: { id },
    data: { estado: estado as EstadoVencimiento },
  });
  revalidatePath("/admin/vencimientos");
}
