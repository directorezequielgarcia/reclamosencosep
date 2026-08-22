"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeGestionarAuditorias } from "@/lib/admin";
import { guardarArchivoAuditoria } from "@/lib/uploads";

const AuditoriaSchema = z.object({
  titulo: z.string().min(3).max(200),
  prestadoraId: z.string().optional().or(z.literal("")),
  expediente: z.string().max(120).optional().nullable(),
  auditorResponsable: z.string().max(200).optional().nullable(),
  tipoAuditoria: z.string().max(500).optional().nullable(),
  periodoAuditado: z.string().max(120).optional().nullable(),
  fechaInforme: z.string().optional().or(z.literal("")),
  resumen: z.string().max(500).optional().nullable(),
  queEsAuditoria: z.string().max(4000).optional().nullable(),
  procedimientos: z.string().max(8000).optional().nullable(),
  alcance: z.string().max(8000).optional().nullable(),
  hallazgos: z.string().max(20000).optional().nullable(),
  conclusiones: z.string().max(8000).optional().nullable(),
  razonabilidad: z.string().max(20000).optional().nullable(),
  recomendaciones: z.string().max(8000).optional().nullable(),
  opinionEncosep: z.string().max(8000).optional().nullable(),
  fechaPublicacion: z.string().optional().or(z.literal("")),
  publicado: z.string().optional(),
});

async function requireSession() {
  const session = await auth();
  if (!session || !puedeGestionarAuditorias(session.user.rol)) {
    throw new Error("Sin permiso");
  }
  return session;
}

function leerFormulario(formData: FormData) {
  return AuditoriaSchema.safeParse({
    titulo: formData.get("titulo"),
    prestadoraId: formData.get("prestadoraId") || undefined,
    expediente: formData.get("expediente") || undefined,
    auditorResponsable: formData.get("auditorResponsable") || undefined,
    tipoAuditoria: formData.get("tipoAuditoria") || undefined,
    periodoAuditado: formData.get("periodoAuditado") || undefined,
    fechaInforme: formData.get("fechaInforme") || undefined,
    resumen: formData.get("resumen") || undefined,
    queEsAuditoria: formData.get("queEsAuditoria") || undefined,
    procedimientos: formData.get("procedimientos") || undefined,
    alcance: formData.get("alcance") || undefined,
    hallazgos: formData.get("hallazgos") || undefined,
    conclusiones: formData.get("conclusiones") || undefined,
    razonabilidad: formData.get("razonabilidad") || undefined,
    recomendaciones: formData.get("recomendaciones") || undefined,
    opinionEncosep: formData.get("opinionEncosep") || undefined,
    fechaPublicacion: formData.get("fechaPublicacion") || undefined,
    publicado: formData.get("publicado") || undefined,
  });
}

export async function crearAuditoria(formData: FormData) {
  const session = await requireSession();

  const parsed = leerFormulario(formData);
  if (!parsed.success) throw new Error("Datos inválidos");
  const d = parsed.data;

  const auditoria = await prisma.auditoria.create({
    data: {
      titulo: d.titulo,
      prestadoraId: d.prestadoraId || null,
      expediente: d.expediente ?? null,
      auditorResponsable: d.auditorResponsable ?? null,
      tipoAuditoria: d.tipoAuditoria ?? null,
      periodoAuditado: d.periodoAuditado ?? null,
      fechaInforme: d.fechaInforme ? new Date(d.fechaInforme) : null,
      resumen: d.resumen ?? null,
      queEsAuditoria: d.queEsAuditoria ?? null,
      procedimientos: d.procedimientos ?? null,
      alcance: d.alcance ?? null,
      hallazgos: d.hallazgos ?? null,
      conclusiones: d.conclusiones ?? null,
      razonabilidad: d.razonabilidad ?? null,
      recomendaciones: d.recomendaciones ?? null,
      opinionEncosep: d.opinionEncosep ?? null,
      fechaPublicacion: d.fechaPublicacion ? new Date(d.fechaPublicacion) : null,
      publicado: d.publicado === "on" || d.publicado === "true",
      autorId: session.user.id,
    },
  });

  const archivo = formData.get("archivo");
  if (archivo instanceof File && archivo.size > 0) {
    const subida = await guardarArchivoAuditoria(auditoria.id, archivo);
    await prisma.auditoria.update({
      where: { id: auditoria.id },
      data: { archivoUrl: subida.url },
    });
  }

  revalidatePath("/admin/auditorias");
  revalidatePath("/auditorias");
  redirect("/admin/auditorias");
}

export async function actualizarAuditoria(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta id");
  const existente = await prisma.auditoria.findUnique({ where: { id } });
  if (!existente) throw new Error("No existe");

  const parsed = leerFormulario(formData);
  if (!parsed.success) throw new Error("Datos inválidos");
  const d = parsed.data;

  let archivoUrl = existente.archivoUrl;
  const archivo = formData.get("archivo");
  if (archivo instanceof File && archivo.size > 0) {
    const subida = await guardarArchivoAuditoria(id, archivo);
    archivoUrl = subida.url;
  }

  await prisma.auditoria.update({
    where: { id },
    data: {
      titulo: d.titulo,
      prestadoraId: d.prestadoraId || null,
      expediente: d.expediente ?? null,
      auditorResponsable: d.auditorResponsable ?? null,
      tipoAuditoria: d.tipoAuditoria ?? null,
      periodoAuditado: d.periodoAuditado ?? null,
      fechaInforme: d.fechaInforme ? new Date(d.fechaInforme) : null,
      resumen: d.resumen ?? null,
      queEsAuditoria: d.queEsAuditoria ?? null,
      procedimientos: d.procedimientos ?? null,
      alcance: d.alcance ?? null,
      hallazgos: d.hallazgos ?? null,
      conclusiones: d.conclusiones ?? null,
      razonabilidad: d.razonabilidad ?? null,
      recomendaciones: d.recomendaciones ?? null,
      opinionEncosep: d.opinionEncosep ?? null,
      archivoUrl,
      fechaPublicacion: d.fechaPublicacion ? new Date(d.fechaPublicacion) : null,
      publicado: d.publicado === "on" || d.publicado === "true",
    },
  });

  revalidatePath("/admin/auditorias");
  revalidatePath("/auditorias");
  redirect("/admin/auditorias");
}

export async function alternarPublicadoAuditoria(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta id");
  const a = await prisma.auditoria.findUnique({ where: { id } });
  if (!a) throw new Error("No existe");
  await prisma.auditoria.update({
    where: { id },
    data: {
      publicado: !a.publicado,
      fechaPublicacion: !a.publicado && !a.fechaPublicacion ? new Date() : a.fechaPublicacion,
    },
  });
  revalidatePath("/admin/auditorias");
  revalidatePath("/auditorias");
}

export async function borrarAuditoria(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta id");
  await prisma.auditoria.delete({ where: { id } });
  revalidatePath("/admin/auditorias");
  revalidatePath("/auditorias");
}

export async function agregarDocumentoAuditoria(formData: FormData) {
  await requireSession();
  const auditoriaId = String(formData.get("auditoriaId") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const archivo = formData.get("archivo");
  if (!auditoriaId) throw new Error("Falta auditoriaId");
  if (!titulo) throw new Error("Falta título del documento");
  if (!(archivo instanceof File) || archivo.size === 0) {
    throw new Error("Falta el archivo");
  }

  const subida = await guardarArchivoAuditoria(auditoriaId, archivo);
  await prisma.auditoriaDocumento.create({
    data: {
      auditoriaId,
      titulo,
      url: subida.url,
      mimeType: subida.mimeType,
      bytes: subida.bytes,
    },
  });

  revalidatePath("/admin/auditorias");
  revalidatePath("/auditorias");
}

export async function borrarDocumentoAuditoria(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta id");
  await prisma.auditoriaDocumento.delete({ where: { id } });
  revalidatePath("/admin/auditorias");
  revalidatePath("/auditorias");
}
