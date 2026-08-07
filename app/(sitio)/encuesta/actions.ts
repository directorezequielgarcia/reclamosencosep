"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

const Schema = z.object({
  puntajeAgua: z.coerce.number().int().min(1).max(5).optional(),
  puntajeEnergia: z.coerce.number().int().min(1).max(5).optional(),
  puntajeResiduos: z.coerce.number().int().min(1).max(5).optional(),
  puntajeTransporte: z.coerce.number().int().min(1).max(5).optional(),
  responsabilidad: z.enum(["COMPARTIDA", "MCR", "PRESTADORA"]).optional(),
  comentario: z.string().max(2000).optional(),
  barrio: z.string().max(80).optional(),
  dni: z.string().max(20).optional(),
});

export async function enviarEncuesta(formData: FormData) {
  const raw = {
    puntajeAgua: formData.get("puntajeAgua") || undefined,
    puntajeEnergia: formData.get("puntajeEnergia") || undefined,
    puntajeResiduos: formData.get("puntajeResiduos") || undefined,
    puntajeTransporte: formData.get("puntajeTransporte") || undefined,
    responsabilidad: formData.get("responsabilidad") || undefined,
    comentario: formData.get("comentario") || undefined,
    barrio: formData.get("barrio") || undefined,
    dni: formData.get("dni") || undefined,
  };
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) throw new Error("Datos inválidos");
  const d = parsed.data;

  const dniHash = d.dni
    ? createHash("sha256").update(d.dni.replace(/\D/g, "")).digest("hex").slice(0, 32)
    : null;

  await prisma.encuestaServicios.create({
    data: {
      puntajeAgua: d.puntajeAgua ?? null,
      puntajeEnergia: d.puntajeEnergia ?? null,
      puntajeResiduos: d.puntajeResiduos ?? null,
      puntajeTransporte: d.puntajeTransporte ?? null,
      responsabilidad: d.responsabilidad ?? null,
      comentario: d.comentario ?? null,
      barrio: d.barrio ?? null,
      dniHash,
    },
  });

  revalidatePath("/indicadores");
  redirect("/encuesta?gracias=1");
}
