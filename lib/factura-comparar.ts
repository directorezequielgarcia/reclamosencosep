// Compara dos facturas SCPL ya analizadas (ver factura-parse.ts) y separa la
// variación total en motivo: consumo, tarifa, impuestos u otros conceptos no
// itemizados. Función pura (sin DB ni red) — reutiliza el `cuadroMatch` que
// `analizarFactura` ya calculó para cada factura por separado, así que no
// vuelve a adivinar con qué cuadro se facturó.

import type { AnalisisFactura, FacturaExtraida } from "./factura-parse";
import type { ModoAgua } from "./tarifas";

export type MotivoVariacion =
  | "consumo"
  | "tarifa"
  | "ambos"
  | "impuesto"
  | "sin_variacion"
  | "no_comparable";

export type FilaComparativa = {
  concepto: string;
  anterior: number | null;
  actual: number | null;
  diferencia: number | null;
  difPorc: number | null;
  motivo: MotivoVariacion;
  detalle: string;
};

export type ComparacionDosFacturas = {
  ok: boolean;
  mensaje?: string;
  filas: FilaComparativa[];
  totalAnterior: number | null;
  totalActual: number | null;
  variacionTotal: number | null;
  variacionPorc: number | null;
  // Buckets, ya reconciliados: si se conocen ambos totales, siempre suman
  // exactamente `variacionTotal` (lo no itemizado cae en `montoOtros`).
  montoConsumo: number;
  montoTarifa: number;
  montoImpuestos: number;
  montoOtros: number;
  pctConsumo: number;
  pctTarifa: number;
  pctImpuestos: number;
  pctOtros: number;
  mismoCuadro: boolean;
  cuadroAnteriorNombre: string;
  cuadroActualNombre: string;
  consumoAnteriorKwh: number | null;
  consumoActualKwh: number | null;
};

const EPS = 0.5; // diferencias menores a 50 centavos se consideran "sin variación"

/** Método Laspeyres: aísla el efecto tarifa aplicando el precio actual a la
 *  cantidad anterior; lo que resta hasta el monto actual es efecto cantidad. */
function decomponer(cantAnt: number, cantAct: number, montoAnt: number, montoAct: number) {
  const precioAnt = cantAnt > 0 ? montoAnt / cantAnt : 0;
  const precioAct = cantAct > 0 ? montoAct / cantAct : 0;
  const hipotetico = cantAnt * precioAct;
  return {
    precioAnt,
    precioAct,
    efectoTarifa: hipotetico - montoAnt,
    efectoConsumo: montoAct - hipotetico,
  };
}

function cantidadAgua(e: FacturaExtraida): number {
  return e.modoAgua === "MEDIDA" ? (e.m3Medido ?? 0) : (e.m2 ?? 0);
}

function unidadAgua(modo: ModoAgua): string {
  return modo === "MEDIDA" ? "m³" : "m²";
}

export function compararAnalisis(
  a: AnalisisFactura,
  b: AnalisisFactura,
): ComparacionDosFacturas {
  const vacio: ComparacionDosFacturas = {
    ok: false,
    filas: [],
    totalAnterior: a.totalFacturado ?? null,
    totalActual: b.totalFacturado ?? null,
    variacionTotal: null,
    variacionPorc: null,
    montoConsumo: 0,
    montoTarifa: 0,
    montoImpuestos: 0,
    montoOtros: 0,
    pctConsumo: 0,
    pctTarifa: 0,
    pctImpuestos: 0,
    pctOtros: 0,
    mismoCuadro: false,
    cuadroAnteriorNombre: a.cuadroMatch?.nombre ?? "—",
    cuadroActualNombre: b.cuadroMatch?.nombre ?? "—",
    consumoAnteriorKwh: a.extraida.consumoKwh,
    consumoActualKwh: b.extraida.consumoKwh,
  };

  if (!a.ok || !b.ok || !a.cuadroMatch || !b.cuadroMatch) {
    return {
      ...vacio,
      mensaje:
        (!a.ok ? a.mensaje : !b.ok ? b.mensaje : null) ??
        "No pudimos comparar las dos facturas con el cuadro tarifario.",
    };
  }

  const ea = a.extraida;
  const eb = b.extraida;
  const ca = a.cuadroMatch;
  const cb = b.cuadroMatch;
  const mismoCuadro = ca.id === cb.id;
  const kwhA = ea.consumoKwh ?? 0;
  const kwhB = eb.consumoKwh ?? 0;

  const filas: FilaComparativa[] = [];
  let montoConsumo = 0;
  let montoTarifa = 0;
  let montoImpuestos = 0;

  // ── Cargo Fijo Energía: escalonado por tramo de consumo, no lineal ──────
  {
    const cfA = ea.conceptos.cargoFijo;
    const cfB = eb.conceptos.cargoFijo;
    if (a.sinConsumo || b.sinConsumo || cfA == null || cfB == null) {
      filas.push({
        concepto: "Cargo Fijo Energía",
        anterior: cfA,
        actual: cfB,
        diferencia: null,
        difPorc: null,
        motivo: "no_comparable",
        detalle: "Falta el consumo de luz de alguna de las dos facturas.",
      });
    } else {
      const diff = cfB - cfA;
      if (Math.abs(diff) < EPS) {
        filas.push({ concepto: "Cargo Fijo Energía", anterior: cfA, actual: cfB, diferencia: diff, difPorc: 0, motivo: "sin_variacion", detalle: "Mismo tramo de consumo." });
      } else if (mismoCuadro) {
        montoConsumo += diff;
        filas.push({
          concepto: "Cargo Fijo Energía", anterior: cfA, actual: cfB, diferencia: diff,
          difPorc: cfA !== 0 ? (diff / cfA) * 100 : null, motivo: "consumo",
          detalle: `Cambio de categoría de consumo (${kwhA} → ${kwhB} kWh) dentro del mismo cuadro (${ca.nombre}). El Cargo Fijo de SCPL escala por consumo, no es un monto plano.`,
        });
      } else {
        montoTarifa += diff;
        filas.push({
          concepto: "Cargo Fijo Energía", anterior: cfA, actual: cfB, diferencia: diff,
          difPorc: cfA !== 0 ? (diff / cfA) * 100 : null, motivo: "ambos",
          detalle: `Cambió el cuadro tarifario (${ca.nombre} → ${cb.nombre}); puede mezclar cambio de tramo y de tarifa.`,
        });
      }
    }
  }

  // ── Cargo Variable y Compra de Energía: lineales por kWh ────────────────
  for (const [campo, label] of [
    ["cargoVariable", "Cargo Variable Energía"],
    ["compra", "Compra de Energía"],
  ] as const) {
    const montoA = ea.conceptos[campo];
    const montoB = eb.conceptos[campo];
    if (a.sinConsumo || b.sinConsumo || montoA == null || montoB == null) {
      filas.push({ concepto: label, anterior: montoA, actual: montoB, diferencia: null, difPorc: null, motivo: "no_comparable", detalle: "Falta el consumo de luz de alguna de las dos facturas." });
      continue;
    }
    const diff = montoB - montoA;
    if (Math.abs(diff) < EPS) {
      filas.push({ concepto: label, anterior: montoA, actual: montoB, diferencia: diff, difPorc: 0, motivo: "sin_variacion", detalle: "Sin variación." });
      continue;
    }
    const d = decomponer(kwhA, kwhB, montoA, montoB);
    const cambioPrecio = Math.abs(d.precioAct - d.precioAnt) > 0.01;
    montoConsumo += d.efectoConsumo;
    montoTarifa += d.efectoTarifa;
    filas.push({
      concepto: label, anterior: montoA, actual: montoB, diferencia: diff,
      difPorc: montoA !== 0 ? (diff / montoA) * 100 : null,
      motivo: cambioPrecio ? "ambos" : "consumo",
      detalle: cambioPrecio
        ? `Precio $/kWh: $${d.precioAnt.toFixed(4)} → $${d.precioAct.toFixed(4)}. Efecto tarifa: ${d.efectoTarifa.toFixed(2)} · Efecto consumo: ${d.efectoConsumo.toFixed(2)}.`
        : `Precio sin cambios ($${d.precioAnt.toFixed(4)}/kWh). Todo el aumento es por mayor consumo (${kwhA}→${kwhB} kWh).`,
    });
  }

  // ── Alumbrado Público: fijo, no depende del consumo del usuario ────────
  {
    const alA = ea.conceptos.alumbrado;
    const alB = eb.conceptos.alumbrado;
    if (alA != null || alB != null) {
      const diff = (alB ?? 0) - (alA ?? 0);
      const sinVar = Math.abs(diff) < EPS;
      filas.push({
        concepto: "Alumbrado Público", anterior: alA, actual: alB, diferencia: diff,
        difPorc: alA ? (diff / alA) * 100 : null,
        motivo: sinVar ? "sin_variacion" : "tarifa",
        detalle: sinVar ? "Cargo fijo mensual, no depende del consumo." : "Valor fijo actualizado por el cuadro tarifario.",
      });
      if (!sinVar) montoTarifa += diff;
    }
  }

  // ── Agua estimada/medida y Cloacas: lineales por m² o m³ ────────────────
  const modoCambio = ea.modoAgua !== eb.modoAgua;
  for (const [campo, label] of [
    ["agua", "Servicio de Agua"],
    ["cloacas", "Servicio de Cloacas"],
  ] as const) {
    const montoA = ea.conceptos[campo];
    const montoB = eb.conceptos[campo];
    if (a.sinAgua || b.sinAgua || montoA == null || montoB == null) {
      filas.push({ concepto: label, anterior: montoA, actual: montoB, diferencia: null, difPorc: null, motivo: "no_comparable", detalle: "Falta el dato de agua de alguna de las dos facturas." });
      continue;
    }
    const diff = montoB - montoA;
    if (Math.abs(diff) < EPS) {
      filas.push({ concepto: label, anterior: montoA, actual: montoB, diferencia: diff, difPorc: 0, motivo: "sin_variacion", detalle: `Misma superficie/consumo declarado (${cantidadAgua(ea)} ${unidadAgua(ea.modoAgua)}).` });
      continue;
    }
    if (modoCambio) {
      // No lineal comparable (pasó de estimada a medida o viceversa).
      montoTarifa += diff;
      filas.push({ concepto: label, anterior: montoA, actual: montoB, diferencia: diff, difPorc: montoA !== 0 ? (diff / montoA) * 100 : null, motivo: "ambos", detalle: `Cambió el modo de facturación de agua (${unidadAgua(ea.modoAgua)} → ${unidadAgua(eb.modoAgua)}).` });
      continue;
    }
    const cA = cantidadAgua(ea);
    const cB = cantidadAgua(eb);
    if (cA === cB){
      montoTarifa += diff;
      filas.push({ concepto: label, anterior: montoA, actual: montoB, diferencia: diff, difPorc: montoA !== 0 ? (diff / montoA) * 100 : null, motivo: "tarifa", detalle: `Misma superficie/consumo (${cA} ${unidadAgua(ea.modoAgua)}). El aumento es por actualización del cuadro tarifario de agua.` });
    } else {
      const d = decomponer(cA, cB, montoA, montoB);
      montoConsumo += d.efectoConsumo;
      montoTarifa += d.efectoTarifa;
      filas.push({ concepto: label, anterior: montoA, actual: montoB, diferencia: diff, difPorc: montoA !== 0 ? (diff / montoA) * 100 : null, motivo: "ambos", detalle: `${unidadAgua(ea.modoAgua)}: ${cA} → ${cB}. Efecto consumo: ${d.efectoConsumo.toFixed(2)} · Efecto tarifa: ${d.efectoTarifa.toFixed(2)}.` });
    }
  }

  // ── Impuestos y fondos: arrastre de la base, no consumo ni tarifa puros ─
  for (const [campo, label] of [
    ["iva", "IVA"],
    ["leyI26", "Ley Provincial I-26"],
    ["enre", "Tasa ENRE"],
    ["bomberos", "Fondo Bomberos / Varios"],
  ] as const) {
    const montoA = ea.conceptos[campo];
    const montoB = eb.conceptos[campo];
    if (montoA == null && montoB == null) continue;
    const diff = (montoB ?? 0) - (montoA ?? 0);
    const sinVar = Math.abs(diff) < EPS;
    montoImpuestos += diff;
    filas.push({
      concepto: label, anterior: montoA, actual: montoB, diferencia: diff,
      difPorc: montoA ? (diff / montoA) * 100 : null,
      motivo: sinVar ? "sin_variacion" : "impuesto",
      detalle: sinVar ? "Sin variación." : "Se mueve junto con la base gravada / el fondo, no es consumo ni tarifa de energía o agua.",
    });
  }

  // ── Totales y reconciliación ─────────────────────────────────────────
  const totalAnterior = a.totalFacturado;
  const totalActual = b.totalFacturado;
  const variacionTotal = totalAnterior != null && totalActual != null ? totalActual - totalAnterior : null;
  const variacionPorc = variacionTotal != null && totalAnterior ? (variacionTotal / totalAnterior) * 100 : null;

  // Lo no itemizado (subsidio, redondeos, conceptos sin regex propia) cae acá,
  // para que los 4 buckets siempre expliquen el 100% de la variación total.
  const montoOtros =
    variacionTotal != null ? variacionTotal - (montoConsumo + montoTarifa + montoImpuestos) : 0;

  const base = Math.abs(montoConsumo) + Math.abs(montoTarifa) + Math.abs(montoImpuestos) + Math.abs(montoOtros);
  const pctConsumo = base > 0 ? (Math.abs(montoConsumo) / base) * 100 : 0;
  const pctTarifa = base > 0 ? (Math.abs(montoTarifa) / base) * 100 : 0;
  const pctImpuestos = base > 0 ? (Math.abs(montoImpuestos) / base) * 100 : 0;
  const pctOtros = base > 0 ? (Math.abs(montoOtros) / base) * 100 : 0;

  return {
    ok: true,
    filas,
    totalAnterior,
    totalActual,
    variacionTotal,
    variacionPorc,
    montoConsumo,
    montoTarifa,
    montoImpuestos,
    montoOtros,
    pctConsumo,
    pctTarifa,
    pctImpuestos,
    pctOtros,
    mismoCuadro,
    cuadroAnteriorNombre: ca.nombre,
    cuadroActualNombre: cb.nombre,
    consumoAnteriorKwh: ea.consumoKwh,
    consumoActualKwh: eb.consumoKwh,
  };
}
