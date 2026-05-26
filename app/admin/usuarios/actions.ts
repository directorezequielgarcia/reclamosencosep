"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function resetClaveADni(formData: FormData) {
  const session = await auth();
  if (
    !session ||
    (session.user.rol !== "SUPER_ADMIN" && session.user.rol !== "GESTOR_ENTE")
  ) {
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
  if (!session || session.user.rol !== "SUPER_ADMIN") {
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
