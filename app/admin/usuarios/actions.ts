"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { puedeGestionarUsuarios, esDireccion } from "@/lib/admin";
import { Rol } from "@prisma/client";

/** Genera una clave aleatoria de 10 caracteres alfanuméricos (sin caracteres
 *  ambiguos como 0/O/I/l/1) con guión cada 4 para facilitar la lectura
 *  y transmisión verbal. Ej: "k7m3-pqrs-tv". */
function generarClaveLegible(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  let s = "";
  for (let i = 0; i < 10; i++) s += chars[bytes[i] % chars.length];
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 10)}`;
}

/**
 * Genera una clave temporal aleatoria, la guarda hasheada en la DB, y la
 * devuelve en plaintext una sola vez al admin que la solicitó. El plaintext
 * NO se almacena en ningún lado — se le comunica al usuario por mensaje y
 * el usuario debe cambiarla en su primer ingreso desde /mi-cuenta.
 *
 * Esto es seguro porque:
 * - Las contraseñas en DB siguen siendo bcrypt (no se exponen las viejas).
 * - El plaintext aparece una vez en pantalla y luego se descarta.
 * - Solo lo pueden ejecutar roles con puedeGestionarUsuarios.
 */
export async function generarClaveTemporalUsuario(
  usuarioId: string,
): Promise<{ clave: string; usuario: string }> {
  const session = await auth();
  if (!session || !puedeGestionarUsuarios(session.user.rol)) {
    throw new Error("Sin permisos");
  }
  const u = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!u) throw new Error("Usuario no encontrado");

  const clave = generarClaveLegible();
  const passwordHash = await bcrypt.hash(clave, 10);
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  revalidatePath("/admin/usuarios");
  return { clave, usuario: `${u.nombre} ${u.apellido}` };
}

export async function resetClaveADni(formData: FormData) {
  const session = await auth();
  if (!session || !puedeGestionarUsuarios(session.user.rol)) {
    throw new Error("Sin permisos");
  }

  const usuarioId = String(formData.get("usuarioId") ?? "");
  if (!usuarioId) throw new Error("Falta usuarioId");

  const u = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!u) throw new Error("Usuario no encontrado");

  const passwordHash = await bcrypt.hash(u.dni, 10);
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  revalidatePath("/admin/usuarios");
}

export async function toggleActivo(formData: FormData) {
  const session = await auth();
  if (!session || !esDireccion(session.user.rol)) {
    throw new Error("Sin permisos");
  }
  const usuarioId = String(formData.get("usuarioId") ?? "");
  const u = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!u) throw new Error("Usuario no encontrado");
  if (u.id === session.user.id) throw new Error("No podés desactivar tu propia cuenta");
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { activo: !u.activo },
  });
  revalidatePath("/admin/usuarios");
}

const CrearUsuarioSchema = z.object({
  dni: z
    .string()
    .min(6, "DNI mínimo 6 dígitos")
    .max(12, "DNI máximo 12 dígitos")
    .regex(/^\d+$/, "Solo números"),
  nombre: z.string().min(2).max(80),
  apellido: z.string().min(2).max(80),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().max(40).optional().or(z.literal("")),
  rol: z.nativeEnum(Rol),
  prestadoraId: z.string().optional(),
  claveInicial: z.string().min(4).max(80).optional(),
});

/**
 * Alta de usuario desde el panel admin.
 * - DIRECTOR y SUPER_ADMIN pueden crear cualquier rol.
 * - GESTOR_ENTE puede crear roles operativos pero no DIRECTOR ni SUPER_ADMIN.
 * - Por defecto la clave es el propio DNI (el usuario debe cambiarla al ingresar).
 */
export async function crearUsuario(formData: FormData) {
  const session = await auth();
  if (!session || !puedeGestionarUsuarios(session.user.rol)) {
    throw new Error("Sin permisos");
  }

  const raw = {
    dni: String(formData.get("dni") ?? "").replace(/[.\s]/g, ""),
    nombre: String(formData.get("nombre") ?? "").trim(),
    apellido: String(formData.get("apellido") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    telefono: String(formData.get("telefono") ?? "").trim(),
    rol: formData.get("rol"),
    prestadoraId: String(formData.get("prestadoraId") ?? "").trim() || undefined,
    claveInicial: String(formData.get("claveInicial") ?? "").trim() || undefined,
  };

  const parsed = CrearUsuarioSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }
  const datos = parsed.data;

  // Solo direccion puede crear DIRECTOR o SUPER_ADMIN.
  if (
    (datos.rol === "DIRECTOR" || datos.rol === "SUPER_ADMIN") &&
    !esDireccion(session.user.rol)
  ) {
    throw new Error("Solo el Directorio puede crear roles maestros");
  }

  // OPERADOR_PRESTADORA requiere prestadoraId
  if (datos.rol === "OPERADOR_PRESTADORA" && !datos.prestadoraId) {
    throw new Error("Los operadores de prestadora necesitan una prestadora asignada");
  }

  const claveBase = datos.claveInicial?.length ? datos.claveInicial : datos.dni;
  const passwordHash = await bcrypt.hash(claveBase, 10);

  const yaExiste = await prisma.usuario.findUnique({ where: { dni: datos.dni } });
  if (yaExiste) throw new Error(`Ya existe un usuario con DNI ${datos.dni}`);

  await prisma.usuario.create({
    data: {
      dni: datos.dni,
      nombre: datos.nombre,
      apellido: datos.apellido,
      email: datos.email?.length ? datos.email : null,
      telefono: datos.telefono?.length ? datos.telefono : null,
      passwordHash,
      rol: datos.rol,
      prestadoraId:
        datos.rol === "OPERADOR_PRESTADORA" ? (datos.prestadoraId ?? null) : null,
    },
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}
