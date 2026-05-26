"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { enviarEmail, plantillaResetClave } from "@/lib/email";

const HORAS_VENCIMIENTO = 2;

const Schema = z.object({
  dni: z
    .string()
    .min(6)
    .max(12)
    .regex(/^\d+$/, "El DNI debe tener solo números"),
});

export type OlvideClaveState = {
  ok?: string;
  error?: string;
  dni?: string;
};

export async function solicitarReset(
  _prev: OlvideClaveState,
  formData: FormData,
): Promise<OlvideClaveState> {
  const dni = String(formData.get("dni") ?? "").replace(/[.\s]/g, "");
  const parsed = Schema.safeParse({ dni });
  if (!parsed.success) {
    return { error: "El DNI tiene un formato inválido.", dni };
  }

  const u = await prisma.usuario.findUnique({ where: { dni } });

  // Política: respondemos SIEMPRE con OK aunque el DNI no exista,
  // para no exponer si una persona está o no registrada.
  // Sólo enviamos email si el usuario existe Y tiene email cargado.
  if (u && u.email) {
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + HORAS_VENCIMIENTO * 60 * 60 * 1000);

    await prisma.usuario.update({
      where: { id: u.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });

    const base = process.env.AUTH_URL ?? "http://localhost:3000";
    const link = `${base}/restablecer-clave/${token}`;
    const { html, texto } = plantillaResetClave({
      nombre: u.nombre,
      link,
      expiraEnHoras: HORAS_VENCIMIENTO,
    });
    await enviarEmail({
      para: u.email,
      asunto: "Restablecer clave — Portal ENCOSEP",
      html,
      texto,
    });
  }

  return {
    ok: "Si el DNI corresponde a una cuenta con email registrado, te enviamos un link para restablecer la clave. Revisá tu casilla (y la carpeta de spam).",
    dni,
  };
}
