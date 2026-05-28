"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { guardarDocumentoPrestadora } from "@/lib/uploads";
import { TRANSICIONES_DOC } from "@/lib/documentos";
import { puedeRevisarDocumentos, esDireccion } from "@/lib/admin";
import type { EstadoDocumento, TipoDocumento } from "@prisma/client";

const TipoEnum = z.enum([
  "ANUAL",
  "MENSUAL",
  "CERTIFICACION",
  "CONTRATO",
  "OTRO",
]);

const SubirSchema = z.object({
  tipo: TipoEnum,
  periodo: z.string().min(1).max(20),
  titulo: z.string().min(3).max(200),
  descripcion: z.string().max(2000).optional().nullable(),
  // prestadoraId solo para super_admin / gestor cuando suben a nombre de una prestadora
  prestadoraId: z.string().optional(),
});

/**
 * Subir un nuevo documento.
 * - OPERADOR_PRESTADORA: lo sube a nombre de su empresa
 * - GESTOR_ENTE / SUPER_ADMIN: puede indicar prestadoraId
 */
export async function subirDocumento(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Sin sesión");

  const file = formData.get("archivo");
  if (!(file instanceof File)) throw new Error("Falta archivo");

  const raw = {
    tipo: formData.get("tipo"),
    periodo: String(formData.get("periodo") ?? "").trim(),
    titulo: String(formData.get("titulo") ?? "").trim(),
    descripcion: (formData.get("descripcion") as string) || undefined,
    prestadoraId: (formData.get("prestadoraId") as string) || undefined,
  };

  const parsed = SubirSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Datos inválidos");
  const datos = parsed.data;

  // Determinar prestadora
  let prestadoraId: string | null = null;
  if (session.user.rol === "OPERADOR_PRESTADORA") {
    if (!session.user.prestadoraId) {
      throw new Error("Tu usuario no tiene prestadora asignada");
    }
    prestadoraId = session.user.prestadoraId;
  } else if (
    session.user.rol === "GESTOR_ENTE" ||
    session.user.rol === "COOPERATIVA_DOCS" ||
    esDireccion(session.user.rol)
  ) {
    // Adriana o Direccion suben documentación recibida por papel/email desde la Secretaría.
    if (!datos.prestadoraId) {
      throw new Error("Indicá la prestadora");
    }
    prestadoraId = datos.prestadoraId;
  } else {
    throw new Error("Sin permiso");
  }

  // Crear primero el registro (sin url) para tener el id que usaremos en el path
  const doc = await prisma.documento.create({
    data: {
      prestadoraId,
      tipo: datos.tipo as TipoDocumento,
      periodo: datos.periodo,
      titulo: datos.titulo,
      descripcion: datos.descripcion ?? null,
      archivoUrl: "",
      subidoPorId: session.user.id,
      estado: "PENDIENTE",
    },
  });

  // Subir archivo a Blob
  try {
    const saved = await guardarDocumentoPrestadora(prestadoraId, doc.id, file);
    await prisma.documento.update({
      where: { id: doc.id },
      data: {
        archivoUrl: saved.url,
        mimeType: saved.mimeType,
        bytes: saved.bytes,
      },
    });
  } catch (e) {
    // Si falla el upload, borrar el registro
    await prisma.documento.delete({ where: { id: doc.id } });
    throw e;
  }

  revalidatePath("/admin/documentacion");
  redirect(`/admin/documentacion/${doc.id}`);
}

const RevisarSchema = z.object({
  documentoId: z.string().min(1),
  estado: z.enum([
    "EN_REVISION",
    "ANALIZADO",
    "APROBADO",
    "OBSERVADO",
    "INCOMPLETO",
    "RECHAZADO",
  ]),
  comentario: z.string().max(2000).optional(),
});

/**
 * Revisar documento: cambiar estado del workflow.
 * Habilitado para Direccion, COOPERATIVA_DOCS (Adriana) y GESTOR_ENTE.
 */
export async function revisarDocumento(formData: FormData) {
  const session = await auth();
  if (!session || !puedeRevisarDocumentos(session.user.rol)) {
    throw new Error("No tenés permiso para revisar documentos");
  }

  const parsed = RevisarSchema.safeParse({
    documentoId: formData.get("documentoId"),
    estado: formData.get("estado"),
    comentario: formData.get("comentario") || undefined,
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  const doc = await prisma.documento.findUnique({
    where: { id: parsed.data.documentoId },
  });
  if (!doc) throw new Error("Documento inexistente");

  if (!TRANSICIONES_DOC[doc.estado].includes(parsed.data.estado as EstadoDocumento)) {
    throw new Error(`Transición ${doc.estado} → ${parsed.data.estado} no permitida`);
  }

  await prisma.documento.update({
    where: { id: doc.id },
    data: {
      estado: parsed.data.estado as EstadoDocumento,
      comentarioRevision: parsed.data.comentario ?? doc.comentarioRevision,
      revisorId: session.user.id,
      revisadoEn: new Date(),
    },
  });

  revalidatePath(`/admin/documentacion/${doc.id}`);
  revalidatePath(`/admin/documentacion`);
}
