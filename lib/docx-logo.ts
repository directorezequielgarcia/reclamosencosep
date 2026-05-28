/**
 * Carga el logo institucional del ENCOSEP desde public/imagenes para
 * embeberlo en la carátula de los documentos .docx generados por el portal.
 * Fallback silencioso (devuelve null) para no romper la descarga si el
 * archivo no está disponible en runtime.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

export async function cargarLogoBuffer(): Promise<Buffer | null> {
  try {
    const ruta = path.join(
      process.cwd(),
      "public",
      "imagenes",
      "logo-encosep.jpg",
    );
    return await fs.readFile(ruta);
  } catch {
    return null;
  }
}
