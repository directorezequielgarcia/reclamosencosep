"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const DatosSchema = z.object({
  nombre: z.string().trim().min(2).max(60),
  apellido: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email("Email inválido").max(120),
  telefono: z.string().trim().max(30).optional().or(z.literal("")),
});

const ClaveSchema = z
  .object({
    actual: z.string().min(1, "Ingresá tu clave actual"),
    nueva: z.string().min(6, "La clave nueva debe tener al menos 6 caracteres").max(80),
    confirmar: z.string().min(1),
  })
  .refine((d) => d.nueva === d.confirmar, {
    message: "La nueva clave y la confirmación no coinciden",
    path: ["confirmar"],
  });

export type MiCuentaState = { ok?: string; error?: string };

export async function actualizarDatos(
  _prev: MiCuentaState,
  formData: FormData,
): Promise<MiCuentaState> {
  const session = await auth();
  if (!session) return { error: "Sin sesión" };

  const parsed = DatosSchema.safeParse({
    nombre: formData.get("nombre"),
    apellido: formData.get("apellido"),
    email: formData.get("email"),
    telefono: formData.get("telefono") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { nombre, apellido, email, telefono } = parsed.data;

  // Si cambió el email, chequear que no esté tomado por otro usuario
  const otro = await prisma.usuario.findFirst({
    where: { email, id: { not: session.user.id } },
  });
  if (otro) return { error: "Ese email ya está usado por otra cuenta." };

  await prisma.usuario.update({
    where: { id: session.user.id },
    data: {
      nombre,
      apellido,
      email,
      telefono: telefono?.trim() ? telefono.trim() : null,
    },
  });

  revalidatePath("/mi-cuenta");
  return { ok: "Datos actualizados." };
}

export async function cambiarClave(
  _prev: MiCuentaState,
  formData: FormData,
): Promise<MiCuentaState> {
  const session = await auth();
  if (!session) return { error: "Sin sesión" };

  const parsed = ClaveSchema.safeParse({
    actual: formData.get("actual"),
    nueva: formData.get("nueva"),
    confirmar: formData.get("confirmar"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const u = await prisma.usuario.findUnique({ where: { id: session.user.id } });
  if (!u) return { error: "Usuario no encontrado" };

  const ok = await bcrypt.compare(parsed.data.actual, u.passwordHash);
  if (!ok) return { error: "La clave actual no es correcta." };

  const nuevoHash = await bcrypt.hash(parsed.data.nueva, 10);
  await prisma.usuario.update({
    where: { id: session.user.id },
    data: { passwordHash: nuevoHash },
  });

  revalidatePath("/mi-cuenta");
  return { ok: "Clave actualizada. Usá la nueva la próxima vez que entres." };
}
