"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { guardarFotoBoletin } from "@/lib/uploads";
import type { TipoBoletin } from "@prisma/client";

const BoletinSchema = z.object({
  tipo: z.enum(["BOLETIN_OFICIAL", "COMUNICADO", "NOTA_PRENSA", "CLIPPING"]),
  numero: z.string().max(50).optional().nullable(),
  titulo: z.string().min(3).max(200),
  resumen: z.string().max(500).optional().nullable(),
  cuerpo: z.string().max(20000).optional().nullable(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  enlaceExterno: z.string().url().optional().or(z.literal("")),
  fuente: z.string().max(120).optional().nullable(),
  // Servicio al que refiere la novedad — opcional, define qué Zorrito la acompaña.
  servicio: z.enum(["RESIDUOS", "ENERGIA", "AGUA", "TRANSPORTE"]).optional().or(z.literal("")),
  fechaPublicacion: z.string().min(1),
  publicado: z.string().optional(),
});

export async function crearBoletin(formData: FormData) {
  const session = await auth();
  if (
    !session ||
    (session.user.rol !== "GESTOR_ENTE" && session.user.rol !== "SUPER_ADMIN")
  ) {
    throw new Error("Sin permiso");
  }

  const parsed = BoletinSchema.safeParse({
    tipo: formData.get("tipo"),
    numero: formData.get("numero") || undefined,
    titulo: formData.get("titulo"),
    resumen: formData.get("resumen") || undefined,
    cuerpo: formData.get("cuerpo") || undefined,
    videoUrl: formData.get("videoUrl") || undefined,
    enlaceExterno: formData.get("enlaceExterno") || undefined,
    fuente: formData.get("fuente") || undefined,
    servicio: formData.get("servicio") || undefined,
    fechaPublicacion: formData.get("fechaPublicacion"),
    publicado: formData.get("publicado") || undefined,
  });
  if (!parsed.success) throw new Error("Datos inválidos");
  const d = parsed.data;

  const boletin = await prisma.boletin.create({
    data: {
      tipo: d.tipo as TipoBoletin,
      numero: d.numero ?? null,
      titulo: d.titulo,
      resumen: d.resumen ?? null,
      cuerpo: d.cuerpo ?? null,
      videoUrl: d.videoUrl || null,
      enlaceExterno: d.enlaceExterno || null,
      fuente: d.fuente ?? null,
      servicio: d.servicio || null,
      fechaPublicacion: new Date(d.fechaPublicacion),
      publicado: d.publicado === "on" || d.publicado === "true",
      autorId: session.user.id,
    },
  });

  const foto = formData.get("foto");
  if (foto instanceof File && foto.size > 0) {
    const subida = await guardarFotoBoletin(boletin.id, foto);
    await prisma.boletin.update({
      where: { id: boletin.id },
      data: { fotoUrl: subida.url },
    });
  }

  revalidatePath("/admin/boletines");
  revalidatePath("/boletines");
  redirect("/admin/boletines");
}

export async function actualizarBoletin(formData: FormData) {
  const session = await auth();
  if (
    !session ||
    (session.user.rol !== "GESTOR_ENTE" && session.user.rol !== "SUPER_ADMIN")
  ) {
    throw new Error("Sin permiso");
  }
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta id");
  const existente = await prisma.boletin.findUnique({ where: { id } });
  if (!existente) throw new Error("No existe");

  const parsed = BoletinSchema.safeParse({
    tipo: formData.get("tipo"),
    numero: formData.get("numero") || undefined,
    titulo: formData.get("titulo"),
    resumen: formData.get("resumen") || undefined,
    cuerpo: formData.get("cuerpo") || undefined,
    videoUrl: formData.get("videoUrl") || undefined,
    enlaceExterno: formData.get("enlaceExterno") || undefined,
    fuente: formData.get("fuente") || undefined,
    servicio: formData.get("servicio") || undefined,
    fechaPublicacion: formData.get("fechaPublicacion"),
    publicado: formData.get("publicado") || undefined,
  });
  if (!parsed.success) throw new Error("Datos inválidos");
  const d = parsed.data;

  let fotoUrl = existente.fotoUrl;
  const foto = formData.get("foto");
  if (foto instanceof File && foto.size > 0) {
    const subida = await guardarFotoBoletin(id, foto);
    fotoUrl = subida.url;
  }

  await prisma.boletin.update({
    where: { id },
    data: {
      tipo: d.tipo as TipoBoletin,
      numero: d.numero ?? null,
      titulo: d.titulo,
      resumen: d.resumen ?? null,
      cuerpo: d.cuerpo ?? null,
      videoUrl: d.videoUrl || null,
      fotoUrl,
      enlaceExterno: d.enlaceExterno || null,
      fuente: d.fuente ?? null,
      servicio: d.servicio || null,
      fechaPublicacion: new Date(d.fechaPublicacion),
      publicado: d.publicado === "on" || d.publicado === "true",
    },
  });

  revalidatePath("/admin/boletines");
  revalidatePath("/boletines");
  redirect("/admin/boletines");
}

export async function alternarPublicado(formData: FormData) {
  const session = await auth();
  if (
    !session ||
    (session.user.rol !== "GESTOR_ENTE" && session.user.rol !== "SUPER_ADMIN")
  ) {
    throw new Error("Sin permiso");
  }
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta id");
  const b = await prisma.boletin.findUnique({ where: { id } });
  if (!b) throw new Error("No existe");
  await prisma.boletin.update({
    where: { id },
    data: { publicado: !b.publicado },
  });
  revalidatePath("/admin/boletines");
  revalidatePath("/boletines");
}

export async function borrarBoletin(formData: FormData) {
  const session = await auth();
  if (
    !session ||
    (session.user.rol !== "GESTOR_ENTE" && session.user.rol !== "SUPER_ADMIN")
  ) {
    throw new Error("Sin permiso");
  }
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta id");
  await prisma.boletin.delete({ where: { id } });
  revalidatePath("/admin/boletines");
  revalidatePath("/boletines");
}
