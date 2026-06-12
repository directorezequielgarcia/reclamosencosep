// ─────────────────────────────────────────────────────────────────────────
// Cuadros tarifarios SCPL (Comodoro Rivadavia) + motor de cálculo de factura.
//
// Fuente: Exp. 014/2026 "Readecuación Tarifaria SCPL EE - AP - Agua y Cloacas",
// Dictamen N° 01/2026 EnCoSeP (01-06-2026), Boletín Oficial Municipal N° 058
// (04-06-2026). Anexos I a VI, aplicación a partir del 01 de febrero de 2026.
//
// Las funciones de este módulo son PURAS (sin DB, sin red): sirven tanto al
// componente cliente de la calculadora pública como a scripts del Ente.
// Si en el futuro los cuadros se cargan desde la base, basta con producir
// objetos `CuadroTarifario` con la misma forma y pasarlos a `calcularFactura`.
// ─────────────────────────────────────────────────────────────────────────

export type TipoUsuario =
  | "RESIDENCIAL"
  | "COMERCIAL"
  | "INDUSTRIAL"
  | "ENTES_OFICIALES";

export const TIPO_LABEL: Record<TipoUsuario, string> = {
  RESIDENCIAL: "Residencial",
  COMERCIAL: "Comercial",
  INDUSTRIAL: "Industrial",
  ENTES_OFICIALES: "Entes oficiales",
};

/** Un tramo de la escala de energía: válido hasta `hasta` kWh (inclusive). */
export type TramoEnergia = {
  hasta: number; // límite superior del tramo en kWh (Infinity = último)
  cargoFijo: number; // $/mes
  cgoVariable: number; // $/kWh
  energia: number; // $/kWh (compra de energía)
};

/** Un tramo de la escala de agua: válido hasta `hasta` m³ (inclusive). */
export type TramoAgua = {
  hasta: number; // límite superior del tramo en m³ (Infinity = último)
  cargoFijo: number; // $/mes
  cgoVariable: number; // $/m³
};

/** Concepto fijo / referencial que se suma al final (tasas, fondos, etc.). */
export type ConceptoExtra = {
  id: string;
  label: string;
  monto: number; // $ fijos mensuales
  opcional: boolean; // si true, el vecino decide si lo incluye (default según `pordefecto`)
  pordefecto: boolean; // valor inicial del check cuando es opcional
  gravadoIva: boolean; // si entra en la base de IVA
  nota?: string;
};

export type CuadroTarifario = {
  id: string;
  nombre: string;
  expediente: string;
  vigenteDesde: string; // ISO "2026-02-01"
  pdfUrl?: string;
  fuente: string;

  // Energía eléctrica (Anexo I — residencial). Otros tipos se podrán sumar.
  energia: Partial<Record<TipoUsuario, TramoEnergia[]>>;

  // Subsidio nacional a la energía (Anexo I).
  subsidioEnergia: {
    precioPorKwh: number; // $/kWh que se descuenta
    topeAlto: number; // kWh tope en meses "altos"
    topeBajo: number; // kWh tope en meses "bajos"
    mesesAlto: number[]; // 1-12
    mesesBajo: number[]; // 1-12
  };

  // Alumbrado público (Anexo III) — valor fijo mensual por tipo de usuario.
  alumbradoPublico: Record<TipoUsuario, number>;

  // Agua estimada (Anexo VI) — la que se factura por m² de superficie cubierta.
  aguaEstimada: Record<TipoUsuario, TramoAgua[]>;

  // Fórmula de consumo estimado: base + (m3Por10m2) por cada 10 m² cubiertos.
  aguaFormula: { baseM3: number; m3Por10m2: number };

  // Servicio de cloacas (Anexo V/VI): % sobre el costo del agua.
  cloacasPorc: Record<TipoUsuario, number>;

  // Impuestos
  iva: number; // ej 0.21

  // Tasas e impuestos + fondos/contribuciones (referenciales/opcionales).
  conceptosExtra: ConceptoExtra[];
};

// ─────────────────────────────────────────────────────────────────────────
// CUADRO VIGENTE — Readecuación feb-2026 (Exp. 014/2026)
// ─────────────────────────────────────────────────────────────────────────

const ENERGIA_RESIDENCIAL_FEB26: TramoEnergia[] = [
  { hasta: 150, cargoFijo: 12727.63, cgoVariable: 114.7647, energia: 146.2829 },
  { hasta: 250, cargoFijo: 24348.5, cgoVariable: 114.7647, energia: 146.2829 },
  { hasta: 400, cargoFijo: 33202.51, cgoVariable: 114.7647, energia: 146.2829 },
  { hasta: 700, cargoFijo: 44270.01, cgoVariable: 114.7647, energia: 146.2829 },
  { hasta: 1400, cargoFijo: 55337.51, cgoVariable: 114.7647, energia: 146.2829 },
  { hasta: 2500, cargoFijo: 66405.01, cgoVariable: 114.7647, energia: 146.2829 },
  { hasta: 4000, cargoFijo: 77472.51, cgoVariable: 172.147, energia: 146.2829 },
  { hasta: Infinity, cargoFijo: 88540.01, cgoVariable: 229.5293, energia: 146.2829 },
];

const AGUA_ESTIMADA_FEB26: Record<TipoUsuario, TramoAgua[]> = {
  RESIDENCIAL: [
    { hasta: 35, cargoFijo: 29961.41, cgoVariable: 1348.26 },
    { hasta: Infinity, cargoFijo: 32957.55, cgoVariable: 1747.75 },
  ],
  COMERCIAL: [
    { hasta: 35, cargoFijo: 39948.55, cgoVariable: 1398.2 },
    { hasta: Infinity, cargoFijo: 43943.4, cgoVariable: 1747.75 },
  ],
  INDUSTRIAL: [
    { hasta: 35, cargoFijo: 49935.69, cgoVariable: 1498.07 },
    { hasta: Infinity, cargoFijo: 59922.82, cgoVariable: 1847.62 },
  ],
  ENTES_OFICIALES: [
    { hasta: 35, cargoFijo: 49935.69, cgoVariable: 1498.07 },
    { hasta: Infinity, cargoFijo: 59922.82, cgoVariable: 1847.62 },
  ],
};

export const CUADRO_FEB_2026: CuadroTarifario = {
  id: "feb-2026",
  nombre: "Readecuación tarifaria — febrero 2026",
  expediente: "Exp. 014/2026",
  vigenteDesde: "2026-02-01",
  pdfUrl: "/tarifas/cuadro-tarifario-feb-2026.pdf",
  fuente:
    "Dictamen N° 01/2026 EnCoSeP — Boletín Oficial Municipal N° 058 (04/06/2026). Anexos I a VI.",
  energia: { RESIDENCIAL: ENERGIA_RESIDENCIAL_FEB26 },
  subsidioEnergia: {
    precioPorKwh: 92.121,
    topeAlto: 300,
    topeBajo: 150,
    mesesAlto: [1, 2, 5, 6, 8, 12],
    mesesBajo: [3, 4, 9, 10, 11],
  },
  alumbradoPublico: {
    RESIDENCIAL: 8616.37,
    COMERCIAL: 25849.12,
    INDUSTRIAL: 77547.36,
    ENTES_OFICIALES: 103396.47,
  },
  aguaEstimada: AGUA_ESTIMADA_FEB26,
  aguaFormula: { baseM3: 5, m3Por10m2: 2 },
  cloacasPorc: {
    RESIDENCIAL: 0.5,
    COMERCIAL: 0.5,
    INDUSTRIAL: 0.5,
    ENTES_OFICIALES: 0.5,
  },
  iva: 0.21,
  conceptosExtra: [
    {
      id: "ley-i26",
      label: "Ley Provincial I-26",
      monto: 5460.84,
      opcional: false,
      pordefecto: true,
      gravadoIva: false,
      nota: "Tasa provincial. Valor de referencia.",
    },
    {
      id: "enre",
      label: "Tasa ENRE S.P. Chubut",
      monto: 1396.45,
      opcional: false,
      pordefecto: true,
      gravadoIva: false,
      nota: "Tasa de fiscalización provincial. Valor de referencia.",
    },
    {
      id: "bomberos",
      label: "Fondo Ayuda Bomberos Voluntarios",
      monto: 4658.0,
      opcional: true,
      pordefecto: true,
      gravadoIva: false,
    },
    {
      id: "sepelios",
      label: "Servicio Solidario de Sepelios",
      monto: 14957.0,
      opcional: true,
      pordefecto: false,
      gravadoIva: false,
      nota: "Adhesión opcional.",
    },
    {
      id: "sepelios-adic",
      label: "Adicional Servicio de Sepelios",
      monto: 14958.0,
      opcional: true,
      pordefecto: false,
      gravadoIva: false,
      nota: "Adhesión opcional.",
    },
  ],
};

/** Todos los cuadros conocidos, del más nuevo al más viejo. */
export const CUADROS: CuadroTarifario[] = [CUADRO_FEB_2026];

export function cuadroVigente(fecha = new Date()): CuadroTarifario {
  const iso = fecha.toISOString().slice(0, 10);
  const vigentes = CUADROS.filter((c) => c.vigenteDesde <= iso).sort((a, b) =>
    a.vigenteDesde < b.vigenteDesde ? 1 : -1,
  );
  return vigentes[0] ?? CUADROS[0];
}

// ─────────────────────────────────────────────────────────────────────────
// Motor de cálculo
// ─────────────────────────────────────────────────────────────────────────

export type EntradaCalculo = {
  tipo: TipoUsuario;
  kwh: number; // consumo eléctrico del período
  m2: number; // superficie cubierta declarada
  tieneCloacas: boolean;
  conSubsidioEnergia: boolean;
  mes: number; // 1-12 (para el tope del subsidio)
  extras: Record<string, boolean>; // id de ConceptoExtra -> incluido
};

export type GrupoLinea = "ENERGIA" | "AGUA" | "CLOACAS" | "IMPUESTOS" | "OTROS";

export type LineaFactura = {
  concepto: string;
  monto: number;
  grupo: GrupoLinea;
  detalle?: string;
};

export type ResultadoCalculo = {
  lineas: LineaFactura[];
  consumoAguaM3: number;
  tramoEnergia: TramoEnergia | null;
  tramoAgua: TramoAgua | null;
  subtotalServicios: number; // energía + alumbrado + agua + cloacas (regulado)
  iva: number;
  otrosConceptos: number;
  total: number;
};

function tramoEnergiaPara(tramos: TramoEnergia[], kwh: number): TramoEnergia {
  return tramos.find((t) => kwh <= t.hasta) ?? tramos[tramos.length - 1];
}

function tramoAguaPara(tramos: TramoAgua[], m3: number): TramoAgua {
  return tramos.find((t) => m3 <= t.hasta) ?? tramos[tramos.length - 1];
}

/** Consumo estimado de agua en m³ a partir de la superficie cubierta. */
export function consumoAguaEstimado(
  cuadro: CuadroTarifario,
  m2: number,
): number {
  const { baseM3, m3Por10m2 } = cuadro.aguaFormula;
  return baseM3 + (m3Por10m2 * m2) / 10;
}

export function calcularFactura(
  cuadro: CuadroTarifario,
  e: EntradaCalculo,
): ResultadoCalculo {
  const lineas: LineaFactura[] = [];
  let baseIva = 0;

  // ── Energía ──────────────────────────────────────────────────────────
  const tramosEnergia = cuadro.energia[e.tipo] ?? cuadro.energia.RESIDENCIAL ?? [];
  let tramoEnergia: TramoEnergia | null = null;
  if (tramosEnergia.length && e.kwh > 0) {
    const t = tramoEnergiaPara(tramosEnergia, e.kwh);
    tramoEnergia = t;
    const cargoFijo = t.cargoFijo;
    const cargoVariable = t.cgoVariable * e.kwh;
    const compra = t.energia * e.kwh;
    lineas.push({
      grupo: "ENERGIA",
      concepto: "Cargo fijo de energía",
      monto: cargoFijo,
      detalle: `Escala hasta ${isFinite(t.hasta) ? t.hasta + " kWh" : "máx."}`,
    });
    lineas.push({
      grupo: "ENERGIA",
      concepto: "Cargo variable de energía",
      monto: cargoVariable,
      detalle: `${e.kwh} kWh × $${t.cgoVariable.toLocaleString("es-AR")}`,
    });
    lineas.push({
      grupo: "ENERGIA",
      concepto: "Compra de energía",
      monto: compra,
      detalle: `${e.kwh} kWh × $${t.energia.toLocaleString("es-AR")}`,
    });
    baseIva += cargoFijo + cargoVariable + compra;

    // Subsidio nacional (resta)
    if (e.conSubsidioEnergia) {
      const s = cuadro.subsidioEnergia;
      const tope = s.mesesAlto.includes(e.mes)
        ? s.topeAlto
        : s.mesesBajo.includes(e.mes)
          ? s.topeBajo
          : s.topeAlto;
      const kwhSub = Math.min(e.kwh, tope);
      const subsidio = -(kwhSub * s.precioPorKwh);
      lineas.push({
        grupo: "ENERGIA",
        concepto: "Subsidio Estado Nacional",
        monto: subsidio,
        detalle: `${kwhSub} kWh × -$${s.precioPorKwh.toLocaleString("es-AR")}`,
      });
      baseIva += subsidio;
    }

    // Alumbrado público (Anexo III) — fijo por tipo
    const alumbrado = cuadro.alumbradoPublico[e.tipo] ?? 0;
    if (alumbrado) {
      lineas.push({
        grupo: "ENERGIA",
        concepto: "Alumbrado público",
        monto: alumbrado,
      });
      baseIva += alumbrado;
    }
  }

  // ── Agua estimada ────────────────────────────────────────────────────
  const consumoAguaM3 = consumoAguaEstimado(cuadro, e.m2);
  const tramosAgua = cuadro.aguaEstimada[e.tipo] ?? cuadro.aguaEstimada.RESIDENCIAL;
  let tramoAgua: TramoAgua | null = null;
  let costoAgua = 0;
  if (tramosAgua && e.m2 > 0) {
    const t = tramoAguaPara(tramosAgua, consumoAguaM3);
    tramoAgua = t;
    costoAgua = t.cargoFijo + t.cgoVariable * consumoAguaM3;
    lineas.push({
      grupo: "AGUA",
      concepto: "Servicio de agua (estimada)",
      monto: costoAgua,
      detalle: `${consumoAguaM3.toFixed(1)} m³ estimados · CF $${t.cargoFijo.toLocaleString(
        "es-AR",
      )} + ${consumoAguaM3.toFixed(1)} × $${t.cgoVariable.toLocaleString("es-AR")}`,
    });
    baseIva += costoAgua;
  }

  // ── Cloacas ──────────────────────────────────────────────────────────
  if (e.tieneCloacas && costoAgua > 0) {
    const porc = cuadro.cloacasPorc[e.tipo] ?? 0.5;
    const cloacas = costoAgua * porc;
    lineas.push({
      grupo: "CLOACAS",
      concepto: "Servicio de cloacas",
      monto: cloacas,
      detalle: `${(porc * 100).toFixed(0)}% del servicio de agua`,
    });
    baseIva += cloacas;
  }

  const subtotalServicios = lineas.reduce((a, l) => a + l.monto, 0);

  // ── IVA ──────────────────────────────────────────────────────────────
  const iva = baseIva * cuadro.iva;
  if (iva) {
    lineas.push({
      grupo: "IMPUESTOS",
      concepto: `IVA (${(cuadro.iva * 100).toFixed(0)}%)`,
      monto: iva,
      detalle: "Sobre la base gravada de servicios",
    });
  }

  // ── Otros conceptos (tasas, fondos, contribuciones) ──────────────────
  let otrosConceptos = 0;
  for (const c of cuadro.conceptosExtra) {
    const incluido = c.opcional ? (e.extras[c.id] ?? c.pordefecto) : true;
    if (!incluido) continue;
    otrosConceptos += c.monto;
    lineas.push({
      grupo: "OTROS",
      concepto: c.label,
      monto: c.monto,
      detalle: c.nota,
    });
  }

  const total = subtotalServicios + iva + otrosConceptos;

  return {
    lineas,
    consumoAguaM3,
    tramoEnergia,
    tramoAgua,
    subtotalServicios,
    iva,
    otrosConceptos,
    total,
  };
}

/** Estado inicial de los conceptos opcionales según su `pordefecto`. */
export function extrasIniciales(cuadro: CuadroTarifario): Record<string, boolean> {
  const r: Record<string, boolean> = {};
  for (const c of cuadro.conceptosExtra) {
    if (c.opcional) r[c.id] = c.pordefecto;
  }
  return r;
}

export function pesos(n: number): string {
  return n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
