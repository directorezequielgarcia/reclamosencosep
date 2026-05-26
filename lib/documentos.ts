import type { TipoDocumento, EstadoDocumento } from "@prisma/client";

export const TIPO_DOC_META: Record<
  TipoDocumento,
  { label: string; icon: string; periodicidad: "anual" | "mensual" | "puntual" }
> = {
  ANUAL: { label: "Anual", icon: "📅", periodicidad: "anual" },
  MENSUAL: { label: "Mensual", icon: "🗓️", periodicidad: "mensual" },
  CERTIFICACION: { label: "Certificación técnica", icon: "🛡️", periodicidad: "puntual" },
  CONTRATO: { label: "Contrato / Addenda", icon: "📜", periodicidad: "puntual" },
  OTRO: { label: "Otro", icon: "📄", periodicidad: "puntual" },
};

export const ESTADO_DOC_META: Record<
  EstadoDocumento,
  { label: string; tone: "neutral" | "info" | "warning" | "success" | "danger" }
> = {
  PENDIENTE: { label: "Pendiente de revisión", tone: "warning" },
  EN_REVISION: { label: "En revisión", tone: "info" },
  APROBADO: { label: "Aprobado", tone: "success" },
  OBSERVADO: { label: "Observado", tone: "warning" },
  RECHAZADO: { label: "Rechazado", tone: "danger" },
};

// Transiciones permitidas
export const TRANSICIONES_DOC: Record<EstadoDocumento, EstadoDocumento[]> = {
  PENDIENTE: ["EN_REVISION", "APROBADO", "OBSERVADO", "RECHAZADO"],
  EN_REVISION: ["APROBADO", "OBSERVADO", "RECHAZADO"],
  APROBADO: [],
  OBSERVADO: ["APROBADO", "RECHAZADO"],
  RECHAZADO: [],
};

/** Formato amigable del campo `periodo` según tipo. */
export function periodoLabel(tipo: TipoDocumento, periodo: string): string {
  if (tipo === "MENSUAL" && /^\d{4}-\d{2}$/.test(periodo)) {
    const [a, m] = periodo.split("-");
    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    const idx = Math.max(0, Math.min(11, parseInt(m, 10) - 1));
    return `${meses[idx]} ${a}`;
  }
  if (tipo === "ANUAL" && /^\d{4}$/.test(periodo)) return `Año ${periodo}`;
  return periodo;
}
