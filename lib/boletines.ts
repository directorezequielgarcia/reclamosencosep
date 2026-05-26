import type { TipoBoletin } from "@prisma/client";

export const TIPO_BOLETIN_META: Record<
  TipoBoletin,
  { label: string; icon: string; color: string }
> = {
  BOLETIN_OFICIAL: { label: "Boletín Oficial", icon: "📜", color: "#1d3550" },
  COMUNICADO: { label: "Comunicado", icon: "📣", color: "#2b4a6b" },
  NOTA_PRENSA: { label: "Nota de prensa", icon: "📰", color: "#4ba8c2" },
  CLIPPING: { label: "Mención en medios", icon: "📎", color: "#e88a3c" },
};
