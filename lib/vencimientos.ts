import type { EstadoVencimiento } from "@prisma/client";

export const ESTADO_VENC_META: Record<
  EstadoVencimiento,
  { label: string; tone: "neutral" | "info" | "warning" | "success" | "danger" }
> = {
  PENDIENTE: { label: "Pendiente", tone: "warning" },
  CUMPLIDO: { label: "Cumplido", tone: "success" },
  VENCIDO: { label: "Vencido", tone: "danger" },
  PRORROGADO: { label: "Prorrogado", tone: "info" },
  EXCEPTUADO: { label: "Exceptuado", tone: "neutral" },
};

/** Días hasta el vencimiento (negativo si ya pasó). */
export function diasHasta(fecha: Date): number {
  const ms = fecha.getTime() - new Date().getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
