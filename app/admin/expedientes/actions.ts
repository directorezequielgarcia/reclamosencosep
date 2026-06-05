"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { siguienteNumero } from "@/lib/expedientes";

const AisladoSchema = z.object({
  tipoExpediente: z.string().min(1).max(60),
  asunto: z.string().min(3).max(200),
  prestadoraId: z.string().min(1),
  solicitadoPor: z.string().max(120).optional(),
  intervinientes: z.string().max(400).optional(),
});

/**
 * Crea un expediente que NO nace de un reclamo: por pedido de la Autoridad de
 * Aplicación, el Concejo, de oficio, una readecuación tarifaria, etc.
 */
export async function crearExpedienteAislado(formData: FormData) {
  const session = await auth();
  if (
    !session ||
    (session.user.rol !== "GESTOR_ENTE" && session.user.rol !== "SUPER_ADMIN")
  ) {
    throw new Error("Solo el Ente puede abrir expedientes");
  }

  const parsed = AisladoSchema.safeParse({
    tipoExpediente: formData.get("tipoExpediente"),
    asunto: formData.get("asunto"),
    prestadoraId: formData.get("prestadoraId"),
    solicitadoPor: formData.get("solicitadoPor") || undefined,
    intervinientes: formData.get("intervinientes") || undefined,
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  const prestadora = await prisma.prestadora.findUnique({
    where: { id: parsed.data.prestadoraId },
  });
  if (!prestadora) throw new Error("Prestadora inexistente");

  const existentes = await prisma.expediente.findMany({
    select: { numero: true },
  });
  const numero = siguienteNumero(existentes.map((e) => e.numero));

  const caratula = `${parsed.data.tipoExpediente} — ${prestadora.razonSocial} s/ ${parsed.data.asunto}`;
  const origen = parsed.data.solicitadoPor
    ? ` a pedido de ${parsed.data.solicitadoPor}`
    : "";

  const exp = await prisma.expediente.create({
    data: {
      numero,
      caratula,
      asunto: parsed.data.asunto,
      tipoExpediente: parsed.data.tipoExpediente,
      intervinientes: parsed.data.intervinientes ?? null,
      solicitadoPor: parsed.data.solicitadoPor ?? null,
      prestadoraId: parsed.data.prestadoraId,
      iniciadorId: session.user.id,
      actos: {
        create: {
          tipo: "CARATULACION",
          titulo: `Apertura del expediente ${numero}`,
          cuerpo:
            `Se da por iniciado el presente expediente${origen}. ` +
            `Objeto: ${parsed.data.asunto}. ` +
            `Prestadora involucrada: ${prestadora.razonSocial}.`,
          autorId: session.user.id,
          confirmadoEn: new Date(),
        },
      },
    },
  });

  revalidatePath("/admin/expedientes");
  redirect(`/admin/expediente/${exp.id}`);
}
