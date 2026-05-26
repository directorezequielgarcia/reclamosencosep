"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const Schema = z
  .object({
    token: z.string().min(10),
    nueva: z
      .string()
      .min(6, "La clave debe tener al menos 6 caracteres")
      .max(80),
    confirmar: z.string().min(1),
  })
  .refine((d) => d.nueva === d.confirmar, {
    message: "Las claves no coinciden",
    path: ["confirmar"],
  });

export type ResetState = { error?: string };

export async function fijarNuevaClave(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const parsed = Schema.safeParse({
    token: formData.get("token"),
    nueva: formData.get("nueva"),
    confirmar: formData.get("confirmar"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const u = await prisma.usuario.findUnique({
    where: { passwordResetToken: parsed.data.token },
  });
  if (!u || !u.passwordResetExpires || u.passwordResetExpires < new Date()) {
    return {
      error:
        "El link venció o no es válido. Volvé a pedir un nuevo email de recuperación.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.nueva, 10);
  await prisma.usuario.update({
    where: { id: u.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  redirect("/ingresar?reset=ok");
}
