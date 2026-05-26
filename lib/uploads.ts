import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB por archivo
const ALLOWED_IMAGE = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

export type UploadedFile = {
  url: string;
  mimeType: string;
  bytes: number;
};

const MAX_DOC_BYTES = 25 * 1024 * 1024; // 25 MB para documentos
const ALLOWED_DOC = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
]);

/**
 * Guarda un documento de prestadora (PDF u oficina). Sube a Vercel Blob si
 * BLOB_READ_WRITE_TOKEN está definido; si no, fallback a filesystem local.
 */
export async function guardarDocumentoPrestadora(
  prestadoraId: string,
  documentoId: string,
  file: File,
): Promise<UploadedFile> {
  if (file.size === 0) throw new Error("Archivo vacío");
  if (file.size > MAX_DOC_BYTES) {
    throw new Error(
      `Archivo demasiado grande (máx ${MAX_DOC_BYTES / 1024 / 1024} MB)`,
    );
  }
  if (file.type && !ALLOWED_DOC.has(file.type)) {
    throw new Error(`Tipo de archivo no soportado: ${file.type}`);
  }

  const ext = extDocFromMime(file.type);
  const nombre = `${documentoId}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const key = `documentos/${prestadoraId}/${nombre}`;
    const blob = await put(key, file, {
      access: "public",
      contentType: file.type || "application/octet-stream",
    });
    return { url: blob.url, mimeType: file.type, bytes: file.size };
  }

  const dir = path.join(UPLOAD_ROOT, "documentos", prestadoraId);
  await fs.mkdir(dir, { recursive: true });
  const dest = path.join(dir, nombre);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(dest, buf);
  return {
    url: `/uploads/documentos/${prestadoraId}/${nombre}`,
    mimeType: file.type,
    bytes: file.size,
  };
}

function extDocFromMime(mime: string): string {
  switch (mime) {
    case "application/pdf":
      return ".pdf";
    case "application/msword":
      return ".doc";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return ".docx";
    case "application/vnd.ms-excel":
      return ".xls";
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return ".xlsx";
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    default:
      return "";
  }
}

/**
 * Guarda una foto del reclamo.
 *
 * Estrategia:
 * - Si BLOB_READ_WRITE_TOKEN está definida (entorno Vercel con Blob
 *   conectado), sube a Vercel Blob — almacenamiento persistente vía CDN.
 * - Si no, fallback a filesystem local en /public/uploads/ — útil para
 *   desarrollo y para entornos sin Blob configurado.
 */
export async function guardarFotoReclamo(
  reclamoId: string,
  file: File,
): Promise<UploadedFile> {
  if (file.size === 0) throw new Error("Archivo vacío");
  if (file.size > MAX_BYTES) {
    throw new Error("Imagen demasiado grande (máx 8 MB)");
  }
  if (!ALLOWED_IMAGE.has(file.type)) {
    throw new Error(`Tipo de imagen no soportado: ${file.type}`);
  }

  const ext = extFromMime(file.type);
  const nombre = `${randomUUID()}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const key = `reclamos/${reclamoId}/${nombre}`;
    const blob = await put(key, file, {
      access: "public",
      contentType: file.type,
    });
    return {
      url: blob.url,
      mimeType: file.type,
      bytes: file.size,
    };
  }

  // Fallback: filesystem local
  const dir = path.join(UPLOAD_ROOT, "reclamos", reclamoId);
  await fs.mkdir(dir, { recursive: true });
  const dest = path.join(dir, nombre);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(dest, buf);
  return {
    url: `/uploads/reclamos/${reclamoId}/${nombre}`,
    mimeType: file.type,
    bytes: file.size,
  };
}

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/heic":
      return ".heic";
    default:
      return "";
  }
}
