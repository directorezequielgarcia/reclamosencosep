import type { ServicioKind } from "@prisma/client";

export type SvcKey = "residuos" | "energia" | "agua" | "transporte";

// Situación puntual de Transporte: cambio de parada/lugar de levantamiento
// tras el recambio de prestadora PATAGONIA → SOL BUS. Dispara un mini-form
// estructurado en el wizard (ver reclamo/nuevo/wizard.tsx) en vez del
// textarea libre genérico.
export const TRANSPORTE_CAMBIO_PARADA_TITULO =
  "Cambio de parada o lugar de levantamiento (Sol Bus)";

export const MOTIVOS_CAMBIO_PARADA = [
  "Sin señalización",
  "Parada poco segura",
  "Lejos del lugar habitual / no es esquina de mayor circulación",
  "No hay garita",
];

export const SVC_META: Record<
  SvcKey,
  {
    kind: ServicioKind;
    label: string;
    short: string;
    ring: string;
    bg: string;
    sub: string;
    examples: string[];
  }
> = {
  residuos: {
    kind: "RESIDUOS",
    label: "Gestión de Residuos",
    short: "Residuos",
    ring: "var(--c-green)",
    bg: "var(--c-green)",
    sub: "basura · contenedores",
    examples: [
      "No pasó el camión recolector",
      "Contenedor roto o desbordado",
      "Basurales en la vía pública",
      "Residuos voluminosos sin retirar",
    ],
  },
  energia: {
    kind: "ENERGIA",
    label: "Electricidad e Iluminación",
    short: "Electricidad",
    ring: "var(--c-yellow)",
    bg: "var(--c-yellow)",
    sub: "cortes · postes",
    examples: [
      "Corte de luz en mi cuadra",
      "Luminaria apagada o titilante",
      "Cable caído o riesgo eléctrico",
      "Reiteración de cortes en el sector",
    ],
  },
  agua: {
    kind: "AGUA",
    label: "Agua y Saneamiento",
    short: "Agua y Saneamiento",
    ring: "var(--c-blue-l)",
    bg: "var(--c-blue-l)",
    sub: "cortes · pérdidas · cloacas",
    examples: [
      "No tengo agua",
      "Pérdida en la calle",
      "Baja presión",
      "Cloaca tapada o desborde",
    ],
  },
  transporte: {
    kind: "TRANSPORTE",
    label: "Transporte Público",
    short: "Transporte",
    ring: "var(--c-red)",
    bg: "var(--c-red)",
    sub: "líneas · paradas",
    examples: [
      "El colectivo no pasó",
      "Frecuencia irregular",
      "Mal estado de la unidad",
      "Cartel o parada dañada",
      TRANSPORTE_CAMBIO_PARADA_TITULO,
    ],
  },
};

export const SVC_ORDER: SvcKey[] = ["residuos", "energia", "agua", "transporte"];

export function svcFromKind(kind: ServicioKind): SvcKey {
  return kind.toLowerCase() as SvcKey;
}
