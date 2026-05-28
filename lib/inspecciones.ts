import type { EstadoInspeccion, TipoInspeccion } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const TIPO_INSPECCION_META: Record<
  TipoInspeccion,
  { label: string; descripcion: string }
> = {
  OFICIO: {
    label: "De oficio",
    descripcion: "Inspección de rutina o seguimiento general del servicio.",
  },
  DENUNCIA_VECINO: {
    label: "Por denuncia",
    descripcion: "Disparada por una denuncia o reclamo concreto de un vecino.",
  },
  SEGUIMIENTO_EXPEDIENTE: {
    label: "Seguimiento de expediente",
    descripcion: "Verifica el cumplimiento o avance de un expediente abierto.",
  },
  EVENTO_PUNTUAL: {
    label: "Evento puntual",
    descripcion:
      "Contingencia o evento extraordinario (corte masivo, deslizamiento, etc.).",
  },
};

export const ESTADO_INSPECCION_META: Record<
  EstadoInspeccion,
  { label: string; tone: "neutral" | "info" | "warning" | "success" | "danger" }
> = {
  BORRADOR: { label: "Borrador", tone: "warning" },
  PUBLICADA: { label: "Publicada", tone: "success" },
  ARCHIVADA: { label: "Archivada", tone: "neutral" },
};

/**
 * Genera el próximo código correlativo de inspección para el año dado.
 * Formato: INS-YYYY-NNN (ej: INS-2026-001). Es robusto frente a borrados:
 * usa el máximo `codigo` existente del año, no `count`.
 */
export async function siguienteCodigoInspeccion(anio: number): Promise<string> {
  const prefijo = `INS-${anio}-`;
  const ultima = await prisma.inspeccion.findFirst({
    where: { codigo: { startsWith: prefijo } },
    orderBy: { codigo: "desc" },
    select: { codigo: true },
  });
  let n = 1;
  if (ultima?.codigo) {
    const parte = ultima.codigo.slice(prefijo.length);
    const parsed = parseInt(parte, 10);
    if (Number.isFinite(parsed)) n = parsed + 1;
  }
  return `${prefijo}${String(n).padStart(3, "0")}`;
}
