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

const MAX_AUDIO_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED_AUDIO = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/wav",
  "audio/x-wav",
]);

/**
 * Guarda una foto vinculada a una inspección de campo.
 * Misma estrategia que guardarFotoReclamo: Blob si hay token, fs local sino.
 */
export async function guardarFotoInspeccion(
  inspeccionId: string,
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
    const key = `inspecciones/${inspeccionId}/fotos/${nombre}`;
    const blob = await put(key, file, {
      access: "public",
      contentType: file.type,
    });
    return { url: blob.url, mimeType: file.type, bytes: file.size };
  }

  const dir = path.join(UPLOAD_ROOT, "inspecciones", inspeccionId, "fotos");
  await fs.mkdir(dir, { recursive: true });
  const dest = path.join(dir, nombre);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(dest, buf);
  return {
    url: `/uploads/inspecciones/${inspeccionId}/fotos/${nombre}`,
    mimeType: file.type,
    bytes: file.size,
  };
}

/**
 * Guarda el audio dictado en campo de una inspección.
 * Un único archivo por inspección — un nuevo upload reemplaza el anterior.
 */
export async function guardarAudioInspeccion(
  inspeccionId: string,
  file: File,
): Promise<UploadedFile> {
  if (file.size === 0) throw new Error("Audio vacío");
  if (file.size > MAX_AUDIO_BYTES) {
    throw new Error(
      `Audio demasiado grande (máx ${MAX_AUDIO_BYTES / 1024 / 1024} MB)`,
    );
  }
  const mime = file.type || "audio/webm";
  if (!ALLOWED_AUDIO.has(mime)) {
    throw new Error(`Formato de audio no soportado: ${mime}`);
  }

  const ext = extAudioFromMime(mime);
  const nombre = `dictado-${Date.now()}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const key = `inspecciones/${inspeccionId}/audio/${nombre}`;
    const blob = await put(key, file, {
      access: "public",
      contentType: mime,
    });
    return { url: blob.url, mimeType: mime, bytes: file.size };
  }

  const dir = path.join(UPLOAD_ROOT, "inspecciones", inspeccionId, "audio");
  await fs.mkdir(dir, { recursive: true });
  const dest = path.join(dir, nombre);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(dest, buf);
  return {
    url: `/uploads/inspecciones/${inspeccionId}/audio/${nombre}`,
    mimeType: mime,
    bytes: file.size,
  };
}

function extAudioFromMime(mime: string): string {
  switch (mime) {
    case "audio/webm":
      return ".webm";
    case "audio/ogg":
      return ".ogg";
    case "audio/mpeg":
      return ".mp3";
    case "audio/mp4":
    case "audio/m4a":
    case "audio/x-m4a":
      return ".m4a";
    case "audio/wav":
    case "audio/x-wav":
      return ".wav";
    default:
      return "";
  }
}

const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
const ALLOWED_VIDEO = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/3gpp",
]);

export type AdjuntoKind = "FOTO" | "VIDEO" | "AUDIO" | "DOCUMENTO";

function clasificarAdjunto(mime: string): AdjuntoKind | null {
  if (ALLOWED_IMAGE.has(mime)) return "FOTO";
  if (ALLOWED_VIDEO.has(mime)) return "VIDEO";
  if (ALLOWED_AUDIO.has(mime)) return "AUDIO";
  if (ALLOWED_DOC.has(mime)) return "DOCUMENTO";
  return null;
}

/**
 * Guarda un adjunto de un acto administrativo (foto, video, audio o documento).
 * Clasifica el tipo según el MIME y aplica el límite de tamaño correspondiente.
 * Blob si hay token, fs local si no — misma estrategia que el resto.
 */
export async function guardarAdjuntoActo(
  actoId: string,
  file: File,
): Promise<UploadedFile & { tipo: AdjuntoKind; nombre: string }> {
  if (file.size === 0) throw new Error("Archivo vacío");
  const mime = file.type || "application/octet-stream";
  const tipo = clasificarAdjunto(mime);
  if (!tipo) throw new Error(`Tipo de archivo no soportado: ${mime}`);

  const limites: Record<AdjuntoKind, number> = {
    FOTO: MAX_BYTES,
    VIDEO: MAX_VIDEO_BYTES,
    AUDIO: MAX_AUDIO_BYTES,
    DOCUMENTO: MAX_DOC_BYTES,
  };
  if (file.size > limites[tipo]) {
    throw new Error(
      `Archivo demasiado grande (máx ${Math.round(limites[tipo] / 1024 / 1024)} MB)`,
    );
  }

  const punto = file.name.lastIndexOf(".");
  const ext = punto >= 0 ? file.name.slice(punto) : "";
  const nombreArchivo = `${randomUUID()}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const key = `actos/${actoId}/${nombreArchivo}`;
    const blob = await put(key, file, { access: "public", contentType: mime });
    return {
      url: blob.url,
      mimeType: mime,
      bytes: file.size,
      tipo,
      nombre: file.name,
    };
  }

  const dir = path.join(UPLOAD_ROOT, "actos", actoId);
  await fs.mkdir(dir, { recursive: true });
  const dest = path.join(dir, nombreArchivo);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(dest, buf);
  return {
    url: `/uploads/actos/${actoId}/${nombreArchivo}`,
    mimeType: mime,
    bytes: file.size,
    tipo,
    nombre: file.name,
  };
}
