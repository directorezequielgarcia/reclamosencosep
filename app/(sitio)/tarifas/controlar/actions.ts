"use server";

import pdfParse from "pdf-parse";
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
  // El PDF no traía texto (probable escaneo/imagen): el cliente debe
  // reintentar pasando el mismo PDF por OCR y reenviando por `textoOcr`.
  esEscaneado?: boolean;
  // Texto ya extraído (por pdf-parse u OCR), para poder recalcular con un
  // consumo cargado a mano sin tener que volver a subir el archivo.
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

const MAX = 15 * 1024 * 1024;

export async function controlarFactura(
  _prev: ControlState,
  formData: FormData,
): Promise<ControlState> {
  // Camino A: texto ya extraído en el navegador por OCR (foto).
  const textoOcr = String(formData.get("textoOcr") ?? "").trim();
  let texto = "";

  if (textoOcr.length >= 40) {
    texto = textoOcr;
  } else {
    // Camino B: PDF original (extracción server-side con pdf-parse).
    const file = formData.get("factura");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, mensaje: "Subí el PDF de tu factura o una foto." };
    }
    if (file.size > MAX) {
      return { ok: false, mensaje: "El archivo es muy grande (máx 15 MB)." };
    }
    if (file.type && file.type !== "application/pdf") {
      return {
        ok: false,
        mensaje:
          "Ese archivo no es un PDF. Si es una foto, usá la opción «Foto».",
      };
    }
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      const data = await pdfParse(buf);
      texto = data.text ?? "";
    } catch {
      return {
        ok: false,
        mensaje: "No pudimos leer el PDF. ¿Es el archivo original de la factura?",
      };
    }
    if (texto.trim().length < 40) {
      return {
        ok: false,
        esEscaneado: true,
        mensaje:
          "Este PDF parece ser una imagen escaneada (no trae texto). Lo estamos leyendo con reconocimiento óptico automáticamente…",
      };
    }
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
