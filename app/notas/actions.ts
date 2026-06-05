"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { guardarAdjuntoActo } from "@/lib/uploads";
import {
  ambitoDeRol,
  esEnteRol,
  puedeVerNotas,
  siguienteNumeroNota,
  NOTA_AMBITO_LABEL,
} from "@/lib/notas";
import type { AdjuntoTipo, NotaAmbito } from "@prisma/client";

async function subirAdjuntosMensaje(mensajeId: string, formData: FormData) {
  const archivos = formData
    .getAll("archivos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of archivos) {
    try {
      const g = await guardarAdjuntoActo(mensajeId, file);
      await prisma.notaAdjunto.create({
        data: {
          mensajeId,
          tipo: g.tipo as AdjuntoTipo,
          url: g.url,
          nombre: g.nombre,
          mimeType: g.mimeType,
          bytes: g.bytes,
        },
      });
    } catch {
      // archivo inválido: se ignora
    }
  }
}

const CrearNotaSchema = z.object({
  asunto: z.string().min(3).max(200),
  ambito: z.enum([
    "AUTORIDAD_APLICACION",
    "CONCEJO_DELIBERANTE",
    "PEM",
    "PRESTADORA",
    "OTRO",
  ]),
  destinatario: z.string().max(160).optional(),
  cuerpo: z.string().min(1).max(8000),
});

export async function crearNota(formData: FormData) {
  const session = await auth();
  if (!session || !puedeVerNotas(session.user.rol)) {
    throw new Error("Sin permiso");
  }

  const esEnte = esEnteRol(session.user.rol);
  const ambitoPropio = ambitoDeRol(session.user.rol);

  const parsed = CrearNotaSchema.safeParse({
    asunto: formData.get("asunto"),
    // Si NO es del Ente, el ámbito es el suyo (le escribe al ENCOSEP).
    ambito: esEnte ? formData.get("ambito") : (ambitoPropio ?? "OTRO"),
    destinatario: formData.get("destinatario") || undefined,
    cuerpo: formData.get("cuerpo"),
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  const ambito = parsed.data.ambito as NotaAmbito;
  const destinatario = esEnte
    ? (parsed.data.destinatario ?? NOTA_AMBITO_LABEL[ambito])
    : "ENCOSEP";

  const existentes = await prisma.nota.findMany({ select: { numero: true } });
  const numero = siguienteNumeroNota(existentes.map((n) => n.numero));

  const nota = await prisma.nota.create({
    data: {
      numero,
      asunto: parsed.data.asunto,
      ambito,
      destinatario,
      estado: "ENVIADA",
      creadorId: session.user.id,
      mensajes: {
        create: {
          autorId: session.user.id,
          autorNombre: session.user.name ?? (esEnte ? "ENCOSEP" : "—"),
          delEnte: esEnte,
          cuerpo: parsed.data.cuerpo,
        },
      },
    },
    include: { mensajes: true },
  });

  await subirAdjuntosMensaje(nota.mensajes[0].id, formData);

  revalidatePath("/notas");
  redirect(`/notas/${nota.id}`);
}

export async function responderNota(formData: FormData) {
  const session = await auth();
  if (!session || !puedeVerNotas(session.user.rol)) {
    throw new Error("Sin permiso");
  }

  const notaId = String(formData.get("notaId") ?? "");
  const cuerpo = String(formData.get("cuerpo") ?? "").trim();
  if (!notaId || cuerpo.length === 0) throw new Error("Mensaje requerido");

  const nota = await prisma.nota.findUnique({ where: { id: notaId } });
  if (!nota) throw new Error("Nota inexistente");

  const esEnte = esEnteRol(session.user.rol);
  const ambitoPropio = ambitoDeRol(session.user.rol);
  // El Ente ve todo; la contraparte solo su ámbito.
  if (!esEnte && ambitoPropio !== nota.ambito) {
    throw new Error("Sin permiso sobre esta nota");
  }

  const msg = await prisma.notaMensaje.create({
    data: {
      notaId,
      autorId: session.user.id,
      autorNombre: session.user.name ?? (esEnte ? "ENCOSEP" : "—"),
      delEnte: esEnte,
      cuerpo,
    },
  });
  await subirAdjuntosMensaje(msg.id, formData);

  // Si responde la contraparte, la nota pasa a "Respondida".
  if (!esEnte && nota.estado === "ENVIADA") {
    await prisma.nota.update({
      where: { id: notaId },
      data: { estado: "RESPONDIDA" },
    });
  }

  revalidatePath(`/notas/${notaId}`);
}

export async function cambiarEstadoNota(formData: FormData) {
  const session = await auth();
  if (!session || !esEnteRol(session.user.rol)) {
    throw new Error("Solo el Ente puede cambiar el estado");
  }
  const notaId = String(formData.get("notaId") ?? "");
  const estado = String(formData.get("estado") ?? "");
  if (!["ENVIADA", "RESPONDIDA", "CERRADA"].includes(estado)) {
    throw new Error("Estado inválido");
  }
  await prisma.nota.update({
    where: { id: notaId },
    data: { estado: estado as "ENVIADA" | "RESPONDIDA" | "CERRADA" },
  });
  revalidatePath(`/notas/${notaId}`);
}
