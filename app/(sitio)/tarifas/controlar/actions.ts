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
  // No se pudo leer el consumo de luz (kWh): el cliente puede ofrecer
  // cargarlo a mano y reintentar con `consumoManual`.
  sinConsumo?: boolean;
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

  // Consumo cargado a mano (reintento tras avisar "no pudimos leerlo").
  const consumoManualTxt = String(formData.get("consumoManual") ?? "").trim();
  const consumoManual = consumoManualTxt ? Number(consumoManualTxt) : null;

  const cuadros = await cuadrosPublicados();
  const a = analizarFactura(texto, cuadros, consumoManual);

  return {
    ok: a.ok,
    mensaje: a.mensaje,
    texto,
    sinConsumo: a.extraida.consumoKwh == null,
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
