"use server";

import { cuadrosPublicados } from "@/lib/tarifas-db";
import { analizarFactura, type AnalisisFactura } from "@/lib/factura-parse";
import type { TipoUsuario } from "@/lib/tarifas";
import {
  compararAnalisis,
  ordenarPorPeriodo,
  type ComparacionDosFacturas,
} from "@/lib/factura-comparar";

export type CompararState = {
  ok: boolean;
  mensaje?: string;
  // Textos ya extraídos en el navegador, para poder recalcular con datos
  // cargados a mano sin tener que volver a subir los archivos. Los slots 1 y
  // 2 son solo el orden en que el vecino subió los archivos — cuál es la
  // "anterior" y cuál la "actual" se detecta por período dentro de
  // `comparacion`, no por en qué casillero se subió.
  texto1?: string;
  texto2?: string;
  analisis1?: AnalisisFactura;
  analisis2?: AnalisisFactura;
  comparacion?: ComparacionDosFacturas;
  ordenDetectado?: boolean;
};

export async function compararFacturas(
  _prev: CompararState,
  formData: FormData,
): Promise<CompararState> {
  const texto1 = String(formData.get("textoOcr1") ?? "").trim();
  const texto2 = String(formData.get("textoOcr2") ?? "").trim();

  if (texto1.length < 40 || texto2.length < 40) {
    return {
      ok: false,
      mensaje:
        "No pudimos leer el texto de alguna de las dos facturas. Probá con una foto más nítida o con el PDF original.",
    };
  }

  const consumoManual1 = numOrNull(formData.get("consumoManual1"));
  const m2Manual1 = numOrNull(formData.get("m2Manual1"));
  const m3Manual1 = numOrNull(formData.get("m3Manual1"));
  const consumoManual2 = numOrNull(formData.get("consumoManual2"));
  const m2Manual2 = numOrNull(formData.get("m2Manual2"));
  const m3Manual2 = numOrNull(formData.get("m3Manual2"));

  const tipoManual1Txt = String(formData.get("tipoManual1") ?? "").trim();
  const tipoManual1 = tipoManual1Txt ? (tipoManual1Txt as TipoUsuario) : null;
  const tipoManual2Txt = String(formData.get("tipoManual2") ?? "").trim();
  const tipoManual2 = tipoManual2Txt ? (tipoManual2Txt as TipoUsuario) : null;

  const cuadros = await cuadrosPublicados();
  const analisis1 = analizarFactura(
    texto1,
    cuadros,
    consumoManual1,
    m2Manual1,
    m3Manual1,
    undefined,
    tipoManual1,
  );
  const analisis2 = analizarFactura(
    texto2,
    cuadros,
    consumoManual2,
    m2Manual2,
    m3Manual2,
    undefined,
    tipoManual2,
  );

  if (!analisis1.ok || !analisis2.ok) {
    return {
      ok: false,
      mensaje: !analisis1.ok
        ? `Primera factura: ${analisis1.mensaje ?? "no se pudo analizar."}`
        : `Segunda factura: ${analisis2.mensaje ?? "no se pudo analizar."}`,
      texto1,
      texto2,
      analisis1,
      analisis2,
    };
  }

  const { anterior, actual, detectado } = ordenarPorPeriodo(analisis1, analisis2);
  const comparacion = compararAnalisis(anterior, actual);

  return {
    ok: true,
    texto1,
    texto2,
    analisis1,
    analisis2,
    comparacion,
    ordenDetectado: detectado,
  };
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}
