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

// Empresas de Transporte Urbano de Pasajeros vigentes desde el recambio del
// 1°/08/2026 (Sol Bus reemplazó a Patagonia Argentina en la mayor parte del
// sistema; Diadema adecúa recorridos puntuales bajo el Nuevo Pliego).
export const EMPRESAS_TRANSPORTE = [
  { value: "SOL_BUS", label: "Sol Bus" },
  { value: "DIADEMA", label: "Transporte Diadema" },
  { value: "NO_SABE", label: "No sé / no estoy seguro" },
] as const;

// Líneas de Sol Bus vigentes desde el 1°/09/2026 (Resolución 1.628/26, Anexo
// I) — mismo listado que app/(sitio)/areas-fiscalizadas/[svc]/page.tsx
// (AREAS.transporte.lineas). Mantener sincronizado si cambia el cuadro de
// líneas; la Etapa Inicial no incluye 10 ni 11.
export const LINEAS_SOL_BUS = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "9A",
  "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22",
] as const;

// Recorridos de Transporte Diadema (opera aparte de las líneas numeradas de
// Sol Bus) — según indicó el Directorio de ENCOSEP, no hay dataset público
// que los liste. Si cambian o se detecta un error, corregir acá.
export const LINEAS_DIADEMA = [
  "Diadema",
  "Astra",
  "Gesta de Malvinas",
  "Favaloro",
] as const;

export type EmpresaTransporte = (typeof EMPRESAS_TRANSPORTE)[number]["value"];

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
