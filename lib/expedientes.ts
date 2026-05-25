import type { ExpedienteEstado, TipoActo } from "@prisma/client";

export const EXPEDIENTE_ESTADO_META: Record<
  ExpedienteEstado,
  { label: string; tone: "neutral" | "info" | "warning" | "success" }
> = {
  ABIERTO: { label: "Abierto", tone: "warning" },
  EN_TRAMITE: { label: "En trámite", tone: "info" },
  RESUELTO: { label: "Resuelto", tone: "success" },
  ARCHIVADO: { label: "Archivado", tone: "neutral" },
};

export const TIPO_ACTO_META: Record<
  TipoActo,
  { label: string; icon: string }
> = {
  CARATULACION: { label: "Caratulación", icon: "📁" },
  NOTIFICACION: { label: "Notificación", icon: "📨" },
  INTIMACION: { label: "Intimación", icon: "⚖️" },
  DESCARGO_PRESTADORA: { label: "Descargo de la prestadora", icon: "🛡️" },
  RESOLUCION: { label: "Resolución", icon: "📜" },
  CIERRE: { label: "Cierre", icon: "🔒" },
  NOTA: { label: "Nota interna", icon: "📝" },
};

// Tipos de acto que el Ente puede labrar
export const TIPOS_ACTO_ENTE: TipoActo[] = [
  "NOTIFICACION",
  "INTIMACION",
  "RESOLUCION",
  "CIERRE",
  "NOTA",
];

// Genera número del expediente: EXP-YYYY-NNN (incremental por año)
export function siguienteNumero(yaUsados: string[]): string {
  const year = new Date().getFullYear();
  const prefix = `EXP-${year}-`;
  const usados = yaUsados
    .filter((n) => n.startsWith(prefix))
    .map((n) => Number(n.slice(prefix.length)))
    .filter((n) => Number.isFinite(n));
  const next = (usados.length ? Math.max(...usados) : 0) + 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}
