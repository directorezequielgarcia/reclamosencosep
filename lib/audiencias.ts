import type { EstadoAudiencia, ModalidadAudiencia } from "@prisma/client";

export const ESTADO_AUDIENCIA_META: Record<
  EstadoAudiencia,
  { label: string; tone: "neutral" | "info" | "warning" | "success" | "danger" }
> = {
  PROGRAMADA: { label: "Programada", tone: "neutral" },
  ABIERTA_INSCRIPCION: { label: "Inscripción abierta", tone: "info" },
  CERRADA_INSCRIPCION: { label: "Inscripción cerrada", tone: "warning" },
  REALIZADA: { label: "Realizada", tone: "success" },
  CANCELADA: { label: "Cancelada", tone: "danger" },
};

export const MODALIDAD_META: Record<
  ModalidadAudiencia,
  { label: string; icon: string }
> = {
  PRESENCIAL: { label: "Presencial", icon: "🏛️" },
  VIRTUAL: { label: "Virtual", icon: "💻" },
  HIBRIDA: { label: "Híbrida (presencial + virtual)", icon: "🔀" },
};

export function audienciaPermiteInscripcion(estado: EstadoAudiencia): boolean {
  return estado === "ABIERTA_INSCRIPCION" || estado === "PROGRAMADA";
}
