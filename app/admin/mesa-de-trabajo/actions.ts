"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeGestionarReclamos } from "@/lib/admin";

// Marca como leídas todas las novedades pendientes de un reclamo, sin tener
// que entrar al detalle — pensado para operar rápido desde el tablero.
export async function marcarLeido(formData: FormData) {
  const session = await auth();
  if (!session || !puedeGestionarReclamos(session.user.rol)) {
    throw new Error("Sin permiso");
  }
  const reclamoId = String(formData.get("reclamoId") ?? "");
  if (!reclamoId) throw new Error("Reclamo inválido");

  await prisma.reclamoEvento.updateMany({
    where: { reclamoId, leidoEnte: false },
    data: { leidoEnte: true },
  });

  revalidatePath("/admin/mesa-de-trabajo");
  revalidatePath(`/admin/reclamo/${reclamoId}`);
  revalidatePath("/admin/bandeja");
}
