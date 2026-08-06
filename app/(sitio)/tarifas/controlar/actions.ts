"use server";

import { cuadrosPublicados } from "@/lib/tarifas-db";
import {
  analizarFactura,
  type FacturaExtraida,
  type FilaControl,
  type Proyeccion,
} from "@/lib/factura-parse";
import type { ComposicionCat } from "@/lib/tarifas";

export type ControlState = {
  ok: boolean;
  mensaje?: string;
  // Texto ya extraído en el navegador (PDF con texto, PDF escaneado por OCR,
  // o foto por OCR), para poder recalcular con un consumo cargado a mano sin
  // tener que volver a subir el archivo.
  texto?: string;
  // No se pudo leer el consumo de luz (kWh) y/o el dato de agua (m³ medida o
  // m² de superficie): el cliente puede ofrecer cargarlos a mano y reintentar
  // con `consumoManual` / `m2Manual` / `m3Manual`.
  sinConsumo?: boolean;
  sinAgua?: boolean;
  extraida?: FacturaExtraida;
  cuadroMatchNombre?: string | null;
  cuadroMatchEstado?: string | null;
  filas?: FilaControl[];
  checks?: { label: string; ok: boolean; detalle: string }[];
  proyecciones?: Proyeccion[];
  totalFacturado?: number | null;
  totalCuadro?: number | null;
  composicion?: Record<ComposicionCat, number> | null;
};

export async function controlarFactura(
  _prev: ControlState,
  formData: FormData,
): Promise<ControlState> {
  const texto = String(formData.get("textoOcr") ?? "").trim();
  if (texto.length < 40) {
    return {
      ok: false,
      mensaje:
        "No pudimos leer el texto de tu factura. Probá con una foto más nítida, bien enfocada y con buena luz.",
    };
  }

  // Datos cargados a mano (reintento tras avisar "no pudimos leerlo").
  const consumoManualTxt = String(formData.get("consumoManual") ?? "").trim();
  const consumoManual = consumoManualTxt ? Number(consumoManualTxt) : null;
  const m2ManualTxt = String(formData.get("m2Manual") ?? "").trim();
  const m2Manual = m2ManualTxt ? Number(m2ManualTxt) : null;
  const m3ManualTxt = String(formData.get("m3Manual") ?? "").trim();
  const m3Manual = m3ManualTxt ? Number(m3ManualTxt) : null;

  // Montos de conceptos corregidos a mano cuando el OCR leyó mal un número
  // (ej. pegó dos montos juntos) — "concepto_<campo>" en el FormData.
  const conceptosManual = conceptosManualDeFormData(formData);

  const cuadros = await cuadrosPublicados();
  const a = analizarFactura(texto, cuadros, consumoManual, m2Manual, m3Manual, conceptosManual);

  return {
    ok: a.ok,
    mensaje: a.mensaje,
    texto,
    sinConsumo: a.sinConsumo,
    sinAgua: a.sinAgua,
    extraida: a.extraida,
    cuadroMatchNombre: a.cuadroMatch?.nombre ?? null,
    cuadroMatchEstado: a.cuadroMatch?.estado ?? null,
    filas: a.filas,
    checks: a.checks,
    proyecciones: a.proyecciones,
    totalFacturado: a.totalFacturado,
    totalCuadro: a.totalCuadro,
    composicion: a.composicion,
  };
}

// Conceptos que se muestran en la tabla de control y se pueden corregir a
// mano cuando quedan marcados "⚠ revisar" por una lectura de OCR errónea.
const CAMPOS_CORREGIBLES = [
  "cargoFijo",
  "cargoVariable",
  "compra",
  "alumbrado",
  "agua",
  "cloacas",
] as const;

function conceptosManualDeFormData(
  formData: FormData,
): Partial<Record<(typeof CAMPOS_CORREGIBLES)[number], number>> {
  const out: Partial<Record<(typeof CAMPOS_CORREGIBLES)[number], number>> = {};
  for (const campo of CAMPOS_CORREGIBLES) {
    const txt = String(formData.get(`concepto_${campo}`) ?? "").trim();
    if (!txt) continue;
    const n = Number(txt.replace(",", "."));
    if (Number.isFinite(n) && n > 0) out[campo] = n;
  }
  return out;
}
