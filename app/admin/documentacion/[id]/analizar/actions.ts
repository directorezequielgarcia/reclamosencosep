"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { esDireccion, puedeRevisarDocumentos } from "@/lib/admin";
import {
  generarNotaCertificacion,
  servicioACertTipo,
  type ObservacionSeccion,
} from "@/lib/docx-certificacion";

// ─────────────────────────────────────────────
// Guardar observaciones (sin generar nota todavía)
// ─────────────────────────────────────────────

const GuardarSchema = z.object({
  documentoId: z.string().min(1),
  conclusionGeneral: z.string().max(5000).optional(),
  montoMaximo: z.string().max(200).optional(),
  notaNumero: z.string().max(50).optional(),
  // observaciones llega como JSON serializado
  observaciones: z.string().min(1),
});

export async function guardarAnalisis(formData: FormData) {
  const session = await auth();
  if (!session || !puedeRevisarDocumentos(session.user.rol)) {
    throw new Error("Sin permiso");
  }

  const raw = {
    documentoId: formData.get("documentoId"),
    conclusionGeneral: (formData.get("conclusionGeneral") as string) || undefined,
    montoMaximo: (formData.get("montoMaximo") as string) || undefined,
    notaNumero: (formData.get("notaNumero") as string) || undefined,
    observaciones: formData.get("observaciones"),
  };

  const parsed = GuardarSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Datos inválidos: " + JSON.stringify(parsed.error.issues));

  let observaciones: ObservacionSeccion[];
  try {
    observaciones = JSON.parse(parsed.data.observaciones);
  } catch {
    throw new Error("Formato de observaciones inválido");
  }

  await prisma.documento.update({
    where: { id: parsed.data.documentoId },
    data: {
      observaciones: observaciones as object[],
      conclusionGeneral: parsed.data.conclusionGeneral ?? null,
      montoMaximo: parsed.data.montoMaximo ?? null,
      notaNumero: parsed.data.notaNumero ?? null,
      estado: "EN_REVISION",
      revisorId: session.user.id,
      revisadoEn: new Date(),
    },
  });

  revalidatePath(`/admin/documentacion/${parsed.data.documentoId}`);
  revalidatePath(`/admin/documentacion/${parsed.data.documentoId}/analizar`);
}

// ─────────────────────────────────────────────
// Generar nota Word y marcar como ANALIZADO
// ─────────────────────────────────────────────

const GenerarSchema = z.object({
  documentoId: z.string().min(1),
  notaNumero: z.string().min(1).max(50),
  conclusionGeneral: z.string().max(5000).optional(),
  montoMaximo: z.string().max(200).optional(),
  observaciones: z.string().min(1),
});

export async function generarNota(formData: FormData) {
  const session = await auth();
  if (!session || !esDireccion(session.user.rol)) {
    throw new Error("Solo el Directorio puede emitir notas");
  }

  const raw = {
    documentoId: formData.get("documentoId"),
    notaNumero: formData.get("notaNumero"),
    conclusionGeneral: (formData.get("conclusionGeneral") as string) || undefined,
    montoMaximo: (formData.get("montoMaximo") as string) || undefined,
    observaciones: formData.get("observaciones"),
  };

  const parsed = GenerarSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Datos inválidos");

  let observaciones: ObservacionSeccion[];
  try {
    observaciones = JSON.parse(parsed.data.observaciones);
  } catch {
    throw new Error("Formato de observaciones inválido");
  }

  const doc = await prisma.documento.findUnique({
    where: { id: parsed.data.documentoId },
    include: { prestadora: { include: { servicios: true } } },
  });
  if (!doc) throw new Error("Documento inexistente");

  const tipoServicio = servicioACertTipo(doc.prestadora.servicios);

  const buffer = await generarNotaCertificacion({
    notaNumero: parsed.data.notaNumero,
    fecha: new Date(),
    prestadoraRazonSocial: doc.prestadora.razonSocial,
    periodo: doc.periodo,
    tipoServicio,
    observaciones,
    conclusionGeneral: parsed.data.conclusionGeneral ?? "",
    montoMaximo: parsed.data.montoMaximo,
  });

  // Subir docx: Vercel Blob si hay token, Neon DB si no
  let docxUrl: string;
  const filename = `nota-${parsed.data.notaNumero.replace("/", "-")}-${doc.id}.docx`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`notas/${filename}`, buffer, {
      access: "public",
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    docxUrl = blob.url;
  } else {
    await prisma.archivoBlob.upsert({
      where: { documentoId_tipo: { documentoId: doc.id, tipo: "nota" } },
      update: { contenido: buffer as unknown as Uint8Array<ArrayBuffer> },
      create: {
        documentoId: doc.id,
        tipo: "nota",
        contenido: buffer as unknown as Uint8Array<ArrayBuffer>,
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    });
    docxUrl = `/api/documentos/${doc.id}/nota`;
  }

  await prisma.documento.update({
    where: { id: doc.id },
    data: {
      observaciones: observaciones as object[],
      conclusionGeneral: parsed.data.conclusionGeneral ?? null,
      montoMaximo: parsed.data.montoMaximo ?? null,
      notaNumero: parsed.data.notaNumero,
      notaDocxUrl: docxUrl,
      notaEmitidaEn: new Date(),
      estado: "ANALIZADO",
      revisorId: session.user.id,
      revisadoEn: new Date(),
    },
  });

  revalidatePath(`/admin/documentacion/${doc.id}`);
  redirect(`/admin/documentacion/${doc.id}`);
}
