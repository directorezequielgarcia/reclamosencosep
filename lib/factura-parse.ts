// Parser de facturas SCPL (texto extraído del PDF) + análisis de diferencias
// contra los cuadros tarifarios. Funciones puras (sin DB ni red).

import {
  calcularFactura,
  type ComposicionCat,
  type CuadroTarifario,
  type EntradaCalculo,
  type ModoAgua,
  type TipoUsuario,
} from "./tarifas";

/** Convierte "21,083.88" o "21.083,88" o "-11,543.21" a número. */
export function parseMonto(s: string | undefined | null): number | null {
  if (!s) return null;
  const limpio = s.trim().replace(/\s/g, "");
  const m = limpio.match(/^(-?)([\d.,]+)$/);
  if (!m) return null;
  const signo = m[1] === "-" ? -1 : 1;
  const cuerpo = m[2];
  const ultPunto = cuerpo.lastIndexOf(".");
  const ultComa = cuerpo.lastIndexOf(",");
  const dec = Math.max(ultPunto, ultComa);
  if (dec === -1) return signo * parseFloat(cuerpo);
  const ent = cuerpo.slice(0, dec).replace(/[.,]/g, "");
  const frac = cuerpo.slice(dec + 1).replace(/[.,]/g, "");
  return signo * parseFloat(`${ent}.${frac}`);
}

function buscar(text: string, re: RegExp): number | null {
  const m = text.match(re);
  return m ? parseMonto(m[1]) : null;
}

/** Suma valores no nulos; si todos son null, devuelve null (nada que sumar). */
function sumaONull(valores: (number | null)[]): number | null {
  const presentes = valores.filter((v): v is number => v != null);
  return presentes.length ? presentes.reduce((a, v) => a + v, 0) : null;
}

export type FacturaExtraida = {
  tipo: TipoUsuario;
  modoAgua: ModoAgua;
  consumoKwh: number | null;
  m2: number | null;
  m3Medido: number | null;
  mes: number;
  periodo: string | null;
  tieneCloacas: boolean;
  conSubsidio: boolean;
  conBomberos: boolean;
  conSepelios: boolean;
  conceptos: {
    cargoFijo: number | null;
    cargoVariable: number | null;
    compra: number | null;
    alumbrado: number | null;
    agua: number | null;
    cloacas: number | null;
    subsidio: number | null;
    iva: number | null;
    // Impuestos y fondos con monto propio en la factura (a diferencia de
    // conBomberos/conSepelios, que solo detectan si el concepto está
    // presente). Se usan en el comparador de dos facturas para no dejar
    // esos montos afuera del desglose.
    leyI26: number | null;
    enre: number | null;
    bomberos: number | null;
  };
  total: number | null;
};

/** Arma la entrada del motor de cálculo (calcularFactura) a partir de una
 *  factura ya extraída. Se usa tanto para comparar contra el cuadro que
 *  facturó como para proyectar la misma factura contra otro cuadro (ej. "si
 *  hubieras consumido lo mismo pero con la tarifa actual"). */
export function entradaDeFactura(e: FacturaExtraida): EntradaCalculo {
  return {
    tipo: e.tipo,
    kwh: e.consumoKwh ?? 0,
    modoAgua: e.modoAgua,
    m2: e.m2 ?? 0,
    m3Medido: e.m3Medido ?? 0,
    tieneCloacas: e.tieneCloacas,
    conSubsidioEnergia: e.conSubsidio,
    mes: e.mes,
    extras: {
      bomberos: e.conBomberos,
      sepelios: e.conSepelios,
      "sepelios-adic": e.conSepelios,
    },
  };
}

const TIPO_TEXTO: [RegExp, TipoUsuario][] = [
  [/RESIDENCIAL/i, "RESIDENCIAL"],
  [/COMERCIAL/i, "COMERCIAL"],
  [/OBRADOR/i, "OBRADOR"],
  [/ENTIDAD/i, "ENTIDAD_SIN_FINES"],
  [/OFICIAL/i, "ENTES_OFICIALES"],
  [/INDUSTRIA/i, "PEQUENA_INDUSTRIA"],
];

export function parseFacturaTexto(text: string): FacturaExtraida {
  // Tipo de usuario: la categoría aparece pegada a la etiqueta "Servicio
  // Eléctrico:", pero no siempre DESPUÉS. En el texto embebido de algunos PDF
  // (a diferencia del OCR de una foto, que sigue el orden visual) la
  // categoría se dibuja ANTES de la etiqueta — ej. "COMERCIAL GENERAL
  // Servicio Eléctrico:". Por eso buscamos en una ventana alrededor de la
  // etiqueta en vez de solo hacia adelante.
  const idxServicio = text.search(/Servicio El[eé]ctrico:/i);
  const ventanaServicio =
    idxServicio >= 0
      ? text.slice(Math.max(0, idxServicio - 60), idxServicio + 60)
      : text;
  let tipo: TipoUsuario = "RESIDENCIAL";
  for (const [re, t] of TIPO_TEXTO) if (re.test(ventanaServicio)) { tipo = t; break; }

  // Modo de agua.
  const modoAgua: ModoAgua = /AGUA\s+MEDIDA/i.test(text) ? "MEDIDA" : "ESTIMADA";

  // La factura tiene dos bloques de "TOTAL CONSUMO ..." (luz en kWh dentro de
  // "Servicio Eléctrico", agua en m³ dentro de "Servicios Sanitarios"). En
  // fotos/PDF escaneados el OCR a veces pierde el corte por "REACTIVA" y
  // termina leyendo el consumo de AGUA como si fuera el de luz (o viceversa),
  // así que acotamos cada búsqueda a su propia sección antes de buscar el
  // número, en vez de confiar solo en el corte interno.
  const idxSanitarios = text.search(/Servicios?\s+Sanitarios/i);
  const seccionElectrica =
    idxSanitarios >= 0 ? text.slice(0, idxSanitarios) : text;
  const seccionSanitaria = idxSanitarios >= 0 ? text.slice(idxSanitarios) : "";

  // Fila de lecturas del medidor: N° medidor, lectura actual (día mes año
  // valor), lectura anterior (día mes año valor) y el total del período. El
  // OCR de fotos/PDF-escaneados suele destrozar las ETIQUETAS ("TOTAL CONSUMO
  // ACTIVO" puede salir como "707A: Consumo ACTIVO"), pero la fila de números
  // en sí casi siempre sale limpia — así que la leemos directo en vez de
  // depender del título.
  const FILA_LECTURA =
    /\d{5,9}\s+\d{1,2}\s+\d{1,2}\s+\d{4}\s+(-?[\d.,]+\.\d{2})\s+\d{1,2}\s+\d{1,2}\s+\d{4}\s+(-?[\d.,]+\.\d{2})\s+(-?[\d.,]+\.\d{2})/;

  function totalDeFilaLectura(seccion: string): number | null {
    const m = seccion.match(FILA_LECTURA);
    return m ? parseMonto(m[3]) : null;
  }

  // Consumo eléctrico.
  let consumoKwh: number | null = totalDeFilaLectura(seccionElectrica);
  if (consumoKwh == null) {
    // Fallback: por si la fila de números no calzó pero la etiqueta sí
    // sobrevivió al OCR (ej. PDF con texto embebido, más prolijo).
    const mAct = seccionElectrica.match(
      /TOTAL CONSUMO ACTIVO([\s\S]*?)(REACTIVA|$)/i,
    );
    if (mAct) {
      const nums = mAct[1].match(/-?[\d.,]+\.\d{2}|-?\d+\.\d{2}/g);
      if (nums && nums.length) consumoKwh = parseMonto(nums[nums.length - 1]);
    }
  }
  // Última red de seguridad: si por algún motivo se coló una LECTURA (miles)
  // en vez del CONSUMO del período, mejor avisar que comparar contra un
  // consumo imposible.
  if (consumoKwh != null && (consumoKwh <= 0 || consumoKwh > 20000)) {
    consumoKwh = null;
  }

  // m² (superficie cubierta declarada).
  const m2 = buscar(text, /Cubierta Declarada M2:\s*([\d.,]+)/i);

  // m³ medido (si corresponde) — solo dentro de la sección sanitaria.
  let m3Medido: number | null = totalDeFilaLectura(seccionSanitaria);
  if (m3Medido == null) {
    const mMed = seccionSanitaria.match(
      /TOTAL CONSUMO MEDIDO([\s\S]*?)(CONSUMOS|SERVICIOS|$)/i,
    );
    if (mMed) {
      const nums = mMed[1].match(/-?\d+\.\d{2}/g);
      if (nums && nums.length) m3Medido = parseMonto(nums[nums.length - 1]);
    }
  }

  // Período (mes/año).
  let mes = 1;
  let periodo: string | null = null;
  const mPer = text.match(/(\d{1,2})\s*\/\s*(\d{2,4})\s*\n?\s*\d{2}\/\d{2}\/\d{2}/);
  if (mPer) {
    mes = Math.min(12, Math.max(1, parseInt(mPer[1], 10)));
    periodo = `${mPer[1]}/${mPer[2]}`;
  }

  const conceptos = {
    cargoFijo: buscar(text, /CARGO FIJO DE ENERGIA\s+([\d.,]+)/i),
    cargoVariable: buscar(text, /CARGO VARIABLE ENERGIA\s+([\d.,]+)/i),
    compra: buscar(text, /COMPRA ENERGIA\s+([\d.,]+)/i),
    alumbrado: buscar(text, /ALUMBRADO P[UÚ]BLICO\s+([\d.,]+)/i),
    agua: buscar(text, /SERVICIO AGUA[A-ZÁ ]*?\s+([\d.,]+)/i),
    cloacas: buscar(text, /SERVICIO CLOACAS\s+([\d.,]+)/i),
    subsidio: buscar(text, /SUBSIDIO ESTADO NACIONAL\s+(-?[\d.,]+)/i),
    iva: buscar(text, /I\.?\s?V\.?\s?A\.?\s+([\d.,]+)/i),
    leyI26: buscar(text, /LEY PROVINCIAL I-?26\s+([\d.,]+)/i),
    enre: buscar(text, /TASA ENRE[A-ZÁ.\s]*?\s+([\d.,]+)/i),
    bomberos: buscar(text, /BOMB[A-ZÁ.\s]*?VOLUNT[A-ZÁ.]*\s+([\d.,]+)/i),
  };

  // El TOTAL real está al final de la fila "vencimiento aprox. / período /
  // fecha de vencimiento / TOTAL" — ej. "06/08/26 4 / 2026 07/07/26
  // 137,305.96". Ojo: un ancla ingenua tipo "SUBTOTAL VARIOS <monto> <fecha>"
  // agarra por error el propio monto de SUBTOTAL VARIOS, porque la fecha de
  // vencimiento aproximado lo sigue de inmediato y calza con el patrón.
  const FILA_TOTAL =
    /\d{2}\/\d{2}\/\d{2}\s+\d{1,2}\s*\/\s*\d{4}\s+\d{2}\/\d{2}\/\d{2}\s+([\d.,]+)/;
  const total =
    buscar(text, FILA_TOTAL) ??
    sumaONull([
      buscar(text, /SUBTOTAL SERVICIOS\s+([\d.,]+)/i),
      buscar(text, /SUBTOTAL IMPUESTOS\s+([\d.,]+)/i),
      buscar(text, /SUBTOTAL VARIOS\s+([\d.,]+)/i),
    ]);

  return {
    tipo,
    modoAgua,
    consumoKwh,
    m2,
    m3Medido,
    mes,
    periodo,
    tieneCloacas: conceptos.cloacas != null && conceptos.cloacas > 0,
    conSubsidio: conceptos.subsidio != null && conceptos.subsidio !== 0,
    conBomberos: /BOMB/i.test(text),
    conSepelios: /SEPELIO/i.test(text),
    conceptos,
    total,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Análisis vs cuadros
// ─────────────────────────────────────────────────────────────────────────

export type FilaControl = {
  concepto: string;
  // A qué campo de `conceptos` corresponde esta fila (si tiene uno propio),
  // para poder ofrecer "corregilo a mano" cuando el OCR lee mal el monto.
  campo?: keyof FacturaExtraida["conceptos"];
  facturado: number | null;
  segunCuadro: number;
  difPorc: number | null;
  alerta: boolean;
  // No se pudo calcular "según cuadro" de forma confiable (ej. no se pudo
  // leer el consumo de luz en kWh). Mejor avisarlo que comparar contra $0.
  noComparable?: boolean;
};

export type Proyeccion = {
  nombre: string;
  estado: string | null;
  total: number;
  esMatch: boolean;
};

export type AnalisisFactura = {
  ok: boolean;
  mensaje?: string;
  extraida: FacturaExtraida;
  cuadroMatch: CuadroTarifario | null;
  filas: FilaControl[];
  checks: { label: string; ok: boolean; detalle: string }[];
  proyecciones: Proyeccion[];
  totalFacturado: number | null;
  totalCuadro: number | null;
  // Composición de la factura (por rubro) según el cuadro con el que matcheó,
  // para el gráfico de torta y el comprobante.
  composicion: Record<ComposicionCat, number> | null;
  // Qué datos no se pudieron leer de la factura y hacen falta a mano para
  // completar la comparación (frecuente en fotos/escaneos).
  sinConsumo: boolean;
  sinAgua: boolean;
};

const UMBRAL = 0.03; // 3% de tolerancia para marcar alerta

function difPorc(fact: number | null, calc: number): number | null {
  if (fact == null || calc === 0) return null;
  return (fact - calc) / calc;
}

export function analizarFactura(
  text: string,
  cuadros: CuadroTarifario[],
  // Datos cargados a mano por el usuario cuando no se pudieron leer de la
  // factura (frecuente en fotos/escaneos). Si vienen, pisan lo extraído.
  consumoManualKwh?: number | null,
  m2Manual?: number | null,
  m3MedidoManual?: number | null,
  // Montos de conceptos corregidos a mano (el OCR a veces lee mal un número,
  // ej. pega dos montos juntos). Pisan lo extraído para ese concepto puntual.
  conceptosManual?: Partial<Record<keyof FacturaExtraida["conceptos"], number>>,
): AnalisisFactura {
  const extraida = parseFacturaTexto(text);
  if (consumoManualKwh != null && consumoManualKwh > 0) {
    extraida.consumoKwh = consumoManualKwh;
  }
  if (m2Manual != null && m2Manual > 0) {
    extraida.m2 = m2Manual;
  }
  if (m3MedidoManual != null && m3MedidoManual > 0) {
    extraida.m3Medido = m3MedidoManual;
  }
  if (conceptosManual) {
    for (const [k, v] of Object.entries(conceptosManual)) {
      if (v != null && v > 0) {
        extraida.conceptos[k as keyof FacturaExtraida["conceptos"]] = v;
      }
    }
  }

  const sinConsumo = extraida.consumoKwh == null;
  const sinAgua =
    extraida.modoAgua === "MEDIDA"
      ? extraida.m3Medido == null || extraida.m3Medido <= 0
      : extraida.m2 == null || extraida.m2 <= 0;

  if (!cuadros.length) {
    return {
      ok: false,
      mensaje: "No hay cuadros tarifarios cargados.",
      extraida,
      cuadroMatch: null,
      filas: [],
      checks: [],
      proyecciones: [],
      totalFacturado: extraida.total,
      totalCuadro: null,
      composicion: null,
      sinConsumo,
      sinAgua,
    };
  }
  if (extraida.consumoKwh == null && extraida.conceptos.cargoFijo == null) {
    return {
      ok: false,
      mensaje:
        "No pudimos leer los datos de la factura. ¿Es el PDF original de la SCPL (no una foto ni un escaneo)?",
      extraida,
      cuadroMatch: null,
      filas: [],
      checks: [],
      proyecciones: [],
      totalFacturado: extraida.total,
      totalCuadro: null,
      composicion: null,
      sinConsumo,
      sinAgua,
    };
  }

  const entrada = () => entradaDeFactura(extraida);

  // Calculamos la factura para CADA cuadro con el mismo consumo y, además de
  // detectar con cuál te facturaron (menor error), proyectamos cómo quedaría
  // tu factura bajo cada cuadro (vigente, pedido, anterior).
  const c = extraida.conceptos;
  const facturados = [c.cargoFijo, c.cargoVariable, c.compra, c.agua, c.cloacas];
  const calculados = cuadros.map((cuadro) => {
    const res = calcularFactura(cuadro, entrada());
    const calc = [
      sumaLinea(res, "Cargo fijo de energía"),
      sumaLinea(res, "Cargo variable de energía"),
      sumaLinea(res, "Compra de energía"),
      sumaLinea(res, "Servicio de agua"),
      sumaLinea(res, "Servicio de cloacas"),
    ];
    let err = 0;
    let n = 0;
    for (let i = 0; i < facturados.length; i++) {
      const f = facturados[i];
      if (f != null && calc[i] > 0) {
        err += Math.abs((f - calc[i]) / calc[i]);
        n++;
      }
    }
    return { cuadro, res, err: n ? err / n : Infinity };
  });
  let mejor: (typeof calculados)[number] | null = null;
  for (const x of calculados) if (!mejor || x.err < mejor.err) mejor = x;

  if (!mejor) {
    return {
      ok: false,
      mensaje: "No se pudo comparar con ningún cuadro.",
      extraida,
      cuadroMatch: null,
      filas: [],
      checks: [],
      proyecciones: [],
      totalFacturado: extraida.total,
      totalCuadro: null,
      composicion: null,
      sinConsumo,
      sinAgua,
    };
  }

  const res = mejor.res;
  const fila = (
    concepto: string,
    fact: number | null,
    nombreLinea: string,
    campo: keyof FacturaExtraida["conceptos"],
  ): FilaControl => {
    const segun = sumaLinea(res, nombreLinea);
    const d = difPorc(fact, segun);
    return {
      concepto,
      campo,
      facturado: fact,
      segunCuadro: segun,
      difPorc: d,
      alerta: d != null && Math.abs(d) > UMBRAL,
    };
  };

  // Sin datos de consumo (luz o agua) los conceptos que dependen de ellos no
  // se pueden calcular según el cuadro: mejor avisar que comparar contra $0.
  const filaEnergia = (
    concepto: string,
    fact: number | null,
    nombreLinea: string,
    campo: keyof FacturaExtraida["conceptos"],
  ): FilaControl =>
    sinConsumo
      ? {
          concepto,
          campo,
          facturado: fact,
          segunCuadro: 0,
          difPorc: null,
          alerta: false,
          noComparable: true,
        }
      : fila(concepto, fact, nombreLinea, campo);

  const filaAgua = (
    concepto: string,
    fact: number | null,
    nombreLinea: string,
    campo: keyof FacturaExtraida["conceptos"],
  ): FilaControl =>
    sinAgua
      ? {
          concepto,
          campo,
          facturado: fact,
          segunCuadro: 0,
          difPorc: null,
          alerta: false,
          noComparable: true,
        }
      : fila(concepto, fact, nombreLinea, campo);

  const filas: FilaControl[] = [
    filaEnergia("Cargo fijo de energía", c.cargoFijo, "Cargo fijo de energía", "cargoFijo"),
    filaEnergia("Cargo variable de energía", c.cargoVariable, "Cargo variable de energía", "cargoVariable"),
    filaEnergia("Compra de energía", c.compra, "Compra de energía", "compra"),
    filaEnergia("Alumbrado público", c.alumbrado, "Alumbrado público", "alumbrado"),
    filaAgua("Servicio de agua", c.agua, "Servicio de agua", "agua"),
    filaAgua("Servicio de cloacas", c.cloacas, "Servicio de cloacas", "cloacas"),
  ].filter((f) => f.facturado != null || f.segunCuadro > 0);

  // Chequeos independientes del prorrateo.
  const checks: { label: string; ok: boolean; detalle: string }[] = [];
  if (sinConsumo) {
    checks.push({
      label: "Consumo de luz (kWh)",
      ok: false,
      detalle:
        "No pudimos leerlo de la factura (frecuente en fotos/escaneos). Cargá tus datos a mano si querés comparar los conceptos de energía eléctrica.",
    });
  }
  if (sinAgua) {
    checks.push({
      label:
        extraida.modoAgua === "MEDIDA"
          ? "Consumo de agua (m³)"
          : "Superficie cubierta (m²)",
      ok: false,
      detalle:
        "No pudimos leerlo de la factura (frecuente en fotos/escaneos). Cargá el dato a mano si querés comparar agua y cloacas.",
    });
  }
  if (c.agua != null && c.cloacas != null && c.agua > 0) {
    const ratio = c.cloacas / c.agua;
    const esperado = mejor.cuadro.cloacasPorc[extraida.tipo] ?? 0.5;
    const ok = Math.abs(ratio - esperado) < 0.02;
    checks.push({
      label: "Cloacas como % del agua",
      ok,
      detalle: `Facturado ${(ratio * 100).toFixed(1)}% · cuadro ${(esperado * 100).toFixed(0)}%`,
    });
  }
  if (c.cargoVariable != null && extraida.consumoKwh) {
    const cvUnit = c.cargoVariable / extraida.consumoKwh;
    const tramos = mejor.cuadro.energia[extraida.tipo];
    if (tramos) {
      const t = tramos.find((x) => extraida.consumoKwh! <= x.hasta) ?? tramos[tramos.length - 1];
      const ok = Math.abs(cvUnit - t.cgoVariable) / t.cgoVariable < UMBRAL;
      checks.push({
        label: "Cargo variable por kWh",
        ok,
        detalle: `Facturado $${cvUnit.toFixed(4)}/kWh · cuadro $${t.cgoVariable.toFixed(4)}/kWh`,
      });
    }
  }

  const proyecciones: Proyeccion[] = calculados.map((x) => ({
    nombre: x.cuadro.nombre,
    estado: x.cuadro.estado ?? null,
    total: x.res.total,
    esMatch: x.cuadro === mejor!.cuadro,
  }));

  return {
    ok: true,
    extraida,
    cuadroMatch: mejor.cuadro,
    filas,
    checks,
    proyecciones,
    totalFacturado: extraida.total,
    totalCuadro: res.total,
    composicion: res.composicion,
    sinConsumo,
    sinAgua,
  };
}

function sumaLinea(
  res: ReturnType<typeof calcularFactura>,
  nombre: string,
): number {
  return res.lineas
    .filter((l) => l.concepto.startsWith(nombre))
    .reduce((a, l) => a + l.monto, 0);
}
