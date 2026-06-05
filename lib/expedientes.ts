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
  ACTA_RECEPCION: { label: "Acta de recepción", icon: "📋" },
  NOTIFICACION: { label: "Notificación", icon: "📨" },
  INTIMACION: { label: "Intimación", icon: "⚖️" },
  DESCARGO_PRESTADORA: { label: "Descargo de la prestadora", icon: "🛡️" },
  CONSTATACION: { label: "Acta de constatación", icon: "🔎" },
  AMPLIACION: { label: "Ampliación", icon: "➕" },
  DISPOSICION: { label: "Disposición", icon: "🖋️" },
  RESOLUCION: { label: "Resolución", icon: "📜" },
  CIERRE: { label: "Cierre", icon: "🔒" },
  NOTA: { label: "Nota interna", icon: "📝" },
};

// Guía breve por etapa: se muestra arriba de la mesa de trabajo para orientar
// qué corresponde hacer en cada acto del expediente.
export const GUIA_ETAPA: Record<TipoActo, string> = {
  CARATULACION:
    "Apertura del expediente: quedan fijados el tipo, las partes y el objeto.",
  ACTA_RECEPCION:
    "Dejá constancia de la pretensión, el reclamo y la documental aportada por el reclamante.",
  NOTIFICACION: "Comunicación formal a una de las partes.",
  INTIMACION:
    "Intimá a la prestadora a cumplir o regularizar dentro de un plazo.",
  DESCARGO_PRESTADORA:
    "Descargo o respuesta de la prestadora frente a lo actuado.",
  CONSTATACION:
    "Acta de constatación: dejá registro de lo verificado (inspección, hechos, estado del servicio).",
  AMPLIACION:
    "Ampliación: sumá nueva información, hechos o documental al expediente.",
  DISPOSICION:
    "Proveído simple: orden de trámite. Se pueden dictar varias a lo largo del expediente.",
  RESOLUCION:
    "Resolución fundada que decide la cuestión. Conviene notificarla a las partes.",
  CIERRE: "Cierre del expediente: dejá constancia del resultado.",
  NOTA: "Nota interna del equipo. No se notifica a las partes.",
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
