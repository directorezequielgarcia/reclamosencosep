"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeGestionarReclamos } from "@/lib/admin";

// Nota interna del equipo sobre un vecino/operador: la ve todo el equipo
// con acceso a reclamos, nunca el usuario anotado.
export async function agregarAnotacion(formData: FormData) {
  const session = await auth();
  if (!session || !puedeGestionarReclamos(session.user.rol)) {
    throw new Error("Sin permiso");
  }

  const usuarioId = String(formData.get("usuarioId") ?? "");
  const cuerpo = String(formData.get("cuerpo") ?? "").trim();
  if (!usuarioId) throw new Error("Usuario inválido");
  if (!cuerpo) throw new Error("Escribí una anotación");

  await prisma.anotacionUsuario.create({
    data: { usuarioId, autorId: session.user.id, cuerpo },
  });

  revalidatePath(`/admin/usuarios/${usuarioId}`);
}
