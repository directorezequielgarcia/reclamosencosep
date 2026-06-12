"use server";

import pdfParse from "pdf-parse";
import { cuadrosPublicados } from "@/lib/tarifas-db";
import {
  analizarFactura,
  type FacturaExtraida,
  type FilaControl,
} from "@/lib/factura-parse";

export type ControlState = {
  ok: boolean;
  mensaje?: string;
  extraida?: FacturaExtraida;
  cuadroMatchNombre?: string | null;
  cuadroMatchEstado?: string | null;
  filas?: FilaControl[];
  checks?: { label: string; ok: boolean; detalle: string }[];
  totalFacturado?: number | null;
  totalCuadro?: number | null;
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
        mensaje:
          "El PDF no tiene texto (parece un escaneo). Probá con la opción «Foto» o subí el PDF original de la SCPL.",
      };
    }
  }

  const cuadros = await cuadrosPublicados();
  const a = analizarFactura(texto, cuadros);

  return {
    ok: a.ok,
    mensaje: a.mensaje,
    extraida: a.extraida,
    cuadroMatchNombre: a.cuadroMatch?.nombre ?? null,
    cuadroMatchEstado: a.cuadroMatch?.estado ?? null,
    filas: a.filas,
    checks: a.checks,
    totalFacturado: a.totalFacturado,
    totalCuadro: a.totalCuadro,
  };
}
