"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { enviarEmail, plantillaBienvenida } from "@/lib/email";

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
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("El email no parece válido — revisá el formato")
    .max(120),
  password: z
    .string()
    .min(6, "La clave debe tener al menos 6 caracteres")
    .max(80),
});

export type CrearCuentaState = {
  error?: string;
  campos?: { dni?: string; nombre?: string; apellido?: string; email?: string };
};

export async function crearCuenta(
  _prev: CrearCuentaState,
  formData: FormData,
): Promise<CrearCuentaState> {
  const dni = String(formData.get("dni") ?? "").replace(/[.\s]/g, "");
  const nombre = String(formData.get("nombre") ?? "");
  const apellido = String(formData.get("apellido") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  const previo = { dni, nombre, apellido, email };

  if (password !== passwordConfirm) {
    return { error: "Las claves no coinciden.", campos: previo };
  }

  const parsed = RegistroSchema.safeParse({
    dni,
    nombre,
    apellido,
    email,
    password,
  });

  if (!parsed.success) {
    const primero = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { error: primero, campos: previo };
  }

  // Chequear que no exista ya el DNI o el email
  const existeDni = await prisma.usuario.findUnique({
    where: { dni: parsed.data.dni },
  });
  if (existeDni) {
    return {
      error:
        "Ya existe una cuenta con ese DNI. Si la clave la olvidaste, usá 'Olvidé mi clave'.",
      campos: previo,
    };
  }
  const existeEmail = await prisma.usuario.findUnique({
    where: { email: parsed.data.email },
  });
  if (existeEmail) {
    return {
      error: "Ese email ya está registrado en otra cuenta.",
      campos: previo,
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.usuario.create({
    data: {
      dni: parsed.data.dni,
      nombre: parsed.data.nombre,
      apellido: parsed.data.apellido,
      email: parsed.data.email,
      passwordHash,
      rol: "CIUDADANO",
    },
  });

  // Email de bienvenida (no crítico — si falla, no rompe el flujo)
  const base = process.env.AUTH_URL ?? "http://localhost:3000";
  const { html, texto } = plantillaBienvenida({
    nombre: parsed.data.nombre,
    dni: parsed.data.dni,
    link: `${base}/ingresar`,
  });
  await enviarEmail({
    para: parsed.data.email,
    asunto: "Bienvenido al Portal ENCOSEP",
    html,
    texto,
  });

  // Loguear automáticamente al recién creado y redirigir a /inicio
  await signIn("credentials", {
    dni: parsed.data.dni,
    password: parsed.data.password,
    redirectTo: "/inicio",
  });

  redirect("/inicio");
}
