import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB por archivo
const ALLOWED_IMAGE = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

export type UploadedFile = {
  url: string;       // ruta pública servida por Next desde /public
  mimeType: string;
  bytes: number;
};

export async function guardarFotoReclamo(
  reclamoId: string,
  file: File,
): Promise<UploadedFile> {
  if (file.size === 0) throw new Error("Archivo vacío");
  if (file.size > MAX_BYTES) throw new Error("Imagen demasiado grande (máx 8 MB)");
  if (!ALLOWED_IMAGE.has(file.type)) {
    throw new Error(`Tipo de imagen no soportado: ${file.type}`);
  }

  const dir = path.join(UPLOAD_ROOT, "reclamos", reclamoId);
  await fs.mkdir(dir, { recursive: true });

  const ext = extFromMime(file.type);
  const name = `${randomUUID()}${ext}`;
  const dest = path.join(dir, name);

  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(dest, buf);

  return {
    url: `/uploads/reclamos/${reclamoId}/${name}`,
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
