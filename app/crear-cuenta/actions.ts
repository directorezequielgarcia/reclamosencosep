"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";

// Alta simplificada del reclamante: solo nombre + DNI.
// La contraseña inicial es el propio DNI; el email/teléfono se piden adentro
// como datos de contacto y la clave se puede cambiar en "Mi cuenta".
const RegistroSchema = z.object({
  dni: z
    .string()
    .min(7, "El DNI debe tener entre 7 y 11 dígitos")
    .max(11, "El DNI debe tener entre 7 y 11 dígitos")
    .regex(/^\d+$/, "El DNI debe contener solo números (sin puntos ni espacios)"),
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre es muy corto")
    .max(60, "El nombre es muy largo"),
  apellido: z
    .string()
    .trim()
    .min(2, "El apellido es muy corto")
    .max(60, "El apellido es muy largo"),
});

export type CrearCuentaState = {
  error?: string;
  campos?: { dni?: string; nombre?: string; apellido?: string };
};

export async function crearCuenta(
  _prev: CrearCuentaState,
  formData: FormData,
): Promise<CrearCuentaState> {
  const dni = String(formData.get("dni") ?? "").replace(/[.\s]/g, "");
  const nombre = String(formData.get("nombre") ?? "");
  const apellido = String(formData.get("apellido") ?? "");

  const previo = { dni, nombre, apellido };

  const parsed = RegistroSchema.safeParse({ dni, nombre, apellido });
  if (!parsed.success) {
    const primero = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { error: primero, campos: previo };
  }

  // No duplicar DNI (no se pierde ningún usuario existente: si ya está, avisamos)
  const existeDni = await prisma.usuario.findUnique({
    where: { dni: parsed.data.dni },
  });
  if (existeDni) {
    return {
      error:
        "Ya existe una cuenta con ese DNI. Ingresá con tu DNI, o usá 'Olvidé mi clave'.",
      campos: previo,
    };
  }

  // La contraseña inicial es el propio DNI (se puede cambiar luego en Mi cuenta).
  const passwordHash = await bcrypt.hash(parsed.data.dni, 10);

  await prisma.usuario.create({
    data: {
      dni: parsed.data.dni,
      nombre: parsed.data.nombre,
      apellido: parsed.data.apellido,
      passwordHash,
      rol: "CIUDADANO",
    },
  });

  // Loguear automáticamente (clave = DNI) y entrar.
  await signIn("credentials", {
    dni: parsed.data.dni,
    password: parsed.data.dni,
    redirectTo: "/inicio",
  });

  redirect("/inicio");
}
