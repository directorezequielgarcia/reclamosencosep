"use server";

import { cuadrosPublicados } from "@/lib/tarifas-db";
import { analizarFactura, type AnalisisFactura } from "@/lib/factura-parse";
import { compararAnalisis, type ComparacionDosFacturas } from "@/lib/factura-comparar";

export type CompararState = {
  ok: boolean;
  mensaje?: string;
  // Textos ya extraídos en el navegador, para poder recalcular con datos
  // cargados a mano sin tener que volver a subir los archivos.
  textoA?: string;
  textoB?: string;
  analisisA?: AnalisisFactura;
  analisisB?: AnalisisFactura;
  comparacion?: ComparacionDosFacturas;
};

export async function compararFacturas(
  _prev: CompararState,
  formData: FormData,
): Promise<CompararState> {
  const textoA = String(formData.get("textoOcrA") ?? "").trim();
  const textoB = String(formData.get("textoOcrB") ?? "").trim();

  if (textoA.length < 40 || textoB.length < 40) {
    return {
      ok: false,
      mensaje:
        "No pudimos leer el texto de alguna de las dos facturas. Probá con una foto más nítida o con el PDF original.",
    };
  }

  const consumoManualA = numOrNull(formData.get("consumoManualA"));
  const m2ManualA = numOrNull(formData.get("m2ManualA"));
  const m3ManualA = numOrNull(formData.get("m3ManualA"));
  const consumoManualB = numOrNull(formData.get("consumoManualB"));
  const m2ManualB = numOrNull(formData.get("m2ManualB"));
  const m3ManualB = numOrNull(formData.get("m3ManualB"));

  const cuadros = await cuadrosPublicados();
  const analisisA = analizarFactura(textoA, cuadros, consumoManualA, m2ManualA, m3ManualA);
  const analisisB = analizarFactura(textoB, cuadros, consumoManualB, m2ManualB, m3ManualB);

  if (!analisisA.ok || !analisisB.ok) {
    return {
      ok: false,
      mensaje: !analisisA.ok
        ? `Factura anterior: ${analisisA.mensaje ?? "no se pudo analizar."}`
        : `Factura actual: ${analisisB.mensaje ?? "no se pudo analizar."}`,
      textoA,
      textoB,
      analisisA,
      analisisB,
    };
  }

  const comparacion = compararAnalisis(analisisA, analisisB);

  return { ok: true, textoA, textoB, analisisA, analisisB, comparacion };
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}
