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
  | "OBRADOR"
  | "ENTIDAD_SIN_FINES"
  | "ENTES_OFICIALES"
  | "PEQUENA_INDUSTRIA"
  | "INDUSTRIAL"; // categoría usada solo para agua estimada (alias)

export const TIPO_LABEL: Record<TipoUsuario, string> = {
  RESIDENCIAL: "Residencial",
  COMERCIAL: "Comercial",
  OBRADOR: "Obrador",
  ENTIDAD_SIN_FINES: "Entidad sin fines de lucro",
  ENTES_OFICIALES: "Entes oficiales",
  PEQUENA_INDUSTRIA: "Pequeña industria",
  INDUSTRIAL: "Industrial",
};

/** Un tramo de la escala de energía: válido hasta `hasta` kWh (inclusive). */
export type TramoEnergia = {
  hasta: number; // límite superior del tramo en kWh (Infinity = último)
  cargoFijo: number; // $/mes
  cgoVariable: number; // $/kWh
  energia: number; // $/kWh (compra de energía)
};

/** Un tramo de la escala de agua estimada: válido hasta `hasta` m³. */
export type TramoAgua = {
  hasta: number; // límite superior del tramo en m³ (Infinity = último)
  cargoFijo: number; // $/mes
  cgoVariable: number; // $/m³
};

/** Bloque marginal de agua medida: los m³ dentro del bloque pagan `precio`. */
export type TramoMedida = {
  hasta: number; // límite superior del bloque en m³ (Infinity = último)
  precio: number; // $/m³ aplicado a los m³ de este bloque
};

/** Agua medida de una categoría: cargo fijo + bloques progresivos por m³. */
export type AguaMedidaCat = {
  cargoFijo: number; // $/mes
  tramos: TramoMedida[]; // bloques marginales desde 0
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

export type CuadroEstado = "VIGENTE" | "ANTERIOR" | "PEDIDO" | "BORRADOR";

/** Número centinela: un tramo con `hasta >= HASTA_MAX` no tiene límite
 *  superior. Se usa para poder serializar a JSON (Infinity no es válido). */
export const HASTA_MAX = 9_999_999;

export function esSinLimite(hasta: number): boolean {
  return hasta >= HASTA_MAX;
}

export type CuadroTarifario = {
  id: string;
  nombre: string;
  expediente: string;
  vigenteDesde: string; // ISO "2026-02-01"
  estado?: CuadroEstado;
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
  alumbradoPublico: Partial<Record<TipoUsuario, number>>;

  // Agua estimada (Anexo VI) — la que se factura por m² de superficie cubierta.
  aguaEstimada: Partial<Record<TipoUsuario, TramoAgua[]>>;

  // Agua medida (Anexo IV) — la que se factura por los m³ leídos del medidor.
  aguaMedida?: Partial<Record<TipoUsuario, AguaMedidaCat>>;

  // Para categorías sin tabla propia de agua, qué categoría usar como alias
  // (ej. Obrador → Comercial en estimada; Pequeña industria → Industrial).
  aguaAlias?: Partial<Record<TipoUsuario, TipoUsuario>>;

  // Fórmula de consumo estimado: base + (m3Por10m2) por cada 10 m² cubiertos.
  aguaFormula: { baseM3: number; m3Por10m2: number };

  // Servicio de cloacas (Anexo V/VI): % sobre el costo del agua.
  cloacasPorc: Partial<Record<TipoUsuario, number>>;

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

// Comerciales (Anexo II) — escalas 0-150, 151-400, 401-700, 701-1400,
// 1401-2500, 2501-4000, 4001+.
const ENERGIA_COMERCIAL_FEB26: TramoEnergia[] = [
  { hasta: 150, cargoFijo: 22135.0, cgoVariable: 154.9323, energia: 146.2829 },
  { hasta: 400, cargoFijo: 33202.51, cgoVariable: 154.9323, energia: 146.2829 },
  { hasta: 700, cargoFijo: 53124.01, cgoVariable: 154.9323, energia: 146.2829 },
  { hasta: 1400, cargoFijo: 66405.01, cgoVariable: 154.9323, energia: 146.2829 },
  { hasta: 2500, cargoFijo: 79686.01, cgoVariable: 154.9323, energia: 146.2829 },
  { hasta: 4000, cargoFijo: 100714.27, cgoVariable: 258.2205, energia: 146.2829 },
  { hasta: Infinity, cargoFijo: 123956.02, cgoVariable: 258.2205, energia: 146.2829 },
];

// Obradores (Anexo II)
const ENERGIA_OBRADOR_FEB26: TramoEnergia[] = [
  { hasta: 150, cargoFijo: 23241.75, cgoVariable: 177.8852, energia: 146.2829 },
  { hasta: 400, cargoFijo: 38736.26, cgoVariable: 177.8852, energia: 146.2829 },
  { hasta: 700, cargoFijo: 57551.01, cgoVariable: 177.8852, energia: 146.2829 },
  { hasta: 1400, cargoFijo: 71938.76, cgoVariable: 177.8852, energia: 146.2829 },
  { hasta: 2500, cargoFijo: 86326.51, cgoVariable: 177.8852, energia: 146.2829 },
  { hasta: 4000, cargoFijo: 108461.52, cgoVariable: 309.8646, energia: 146.2829 },
  { hasta: Infinity, cargoFijo: 132810.02, cgoVariable: 309.8646, energia: 146.2829 },
];

// Entidades sin fines de lucro (Anexo II) — escalas estilo residencial (8).
const ENERGIA_ENTIDAD_FEB26: TramoEnergia[] = [
  { hasta: 150, cargoFijo: 12567.58, cgoVariable: 114.7647, energia: 146.2829 },
  { hasta: 250, cargoFijo: 24042.33, cgoVariable: 114.7647, energia: 146.2829 },
  { hasta: 400, cargoFijo: 32785.0, cgoVariable: 114.7647, energia: 146.2829 },
  { hasta: 700, cargoFijo: 43713.33, cgoVariable: 114.7647, energia: 146.2829 },
  { hasta: 1400, cargoFijo: 54641.67, cgoVariable: 114.7647, energia: 146.2829 },
  { hasta: 2500, cargoFijo: 65570.0, cgoVariable: 114.7647, energia: 146.2829 },
  { hasta: 4000, cargoFijo: 76498.33, cgoVariable: 172.147, energia: 146.2829 },
  { hasta: Infinity, cargoFijo: 87426.66, cgoVariable: 229.5293, energia: 146.2829 },
];

// Entes oficiales (Anexo II)
const ENERGIA_OFICIALES_FEB26: TramoEnergia[] = [
  { hasta: 150, cargoFijo: 22135.0, cgoVariable: 172.147, energia: 146.2829 },
  { hasta: 400, cargoFijo: 35969.38, cgoVariable: 172.147, energia: 146.2829 },
  { hasta: 700, cargoFijo: 55337.51, cgoVariable: 172.147, energia: 146.2829 },
  { hasta: 1400, cargoFijo: 69171.89, cgoVariable: 172.147, energia: 146.2829 },
  { hasta: 2500, cargoFijo: 83006.26, cgoVariable: 229.5293, energia: 146.2829 },
  { hasta: 4000, cargoFijo: 96840.64, cgoVariable: 286.9117, energia: 146.2829 },
  { hasta: Infinity, cargoFijo: 132810.02, cgoVariable: 286.9117, energia: 146.2829 },
];

// Pequeñas industrias (Anexo III) — escalas 0-400, 401-700, 701-1400,
// 1401-2500, 2501-4000, 4001+.
const ENERGIA_PEQ_INDUSTRIA_FEB26: TramoEnergia[] = [
  { hasta: 400, cargoFijo: 38182.88, cgoVariable: 149.1941, energia: 146.2829 },
  { hasta: 700, cargoFijo: 50910.51, cgoVariable: 149.1941, energia: 146.2829 },
  { hasta: 1400, cargoFijo: 63638.14, cgoVariable: 149.1941, energia: 146.2829 },
  { hasta: 2500, cargoFijo: 76365.76, cgoVariable: 149.1941, energia: 146.2829 },
  { hasta: 4000, cargoFijo: 92967.02, cgoVariable: 275.4352, energia: 146.2829 },
  { hasta: Infinity, cargoFijo: 119529.02, cgoVariable: 275.4352, energia: 146.2829 },
];

const AGUA_ESTIMADA_FEB26: Partial<Record<TipoUsuario, TramoAgua[]>> = {
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

// Agua medida (Anexo IV) — cargo fijo + bloques progresivos por m³.
const AGUA_MEDIDA_FEB26: Partial<Record<TipoUsuario, AguaMedidaCat>> = {
  RESIDENCIAL: {
    cargoFijo: 29961.4119,
    tramos: [
      { hasta: 30, precio: 998.7137 },
      { hasta: 75, precio: 1248.3922 },
      { hasta: Infinity, precio: 1997.4275 },
    ],
  },
  COMERCIAL: {
    cargoFijo: 71907.3886,
    tramos: [{ hasta: Infinity, precio: 2396.913 }],
  },
  OBRADOR: {
    cargoFijo: 77899.671,
    tramos: [{ hasta: Infinity, precio: 2596.6557 }],
  },
  ENTIDAD_SIN_FINES: {
    cargoFijo: 59922.8238,
    tramos: [{ hasta: Infinity, precio: 1997.4275 }],
  },
  ENTES_OFICIALES: {
    cargoFijo: 83891.9534,
    tramos: [{ hasta: Infinity, precio: 2796.3984 }],
  },
  INDUSTRIAL: {
    cargoFijo: 103866.228,
    tramos: [{ hasta: Infinity, precio: 3495.4981 }],
  },
};

export const CUADRO_FEB_2026: CuadroTarifario = {
  id: "feb-2026",
  nombre: "Readecuación tarifaria — febrero 2026",
  expediente: "Exp. 014/2026",
  vigenteDesde: "2026-02-01",
  estado: "VIGENTE",
  pdfUrl: "/tarifas/cuadro-tarifario-feb-2026.pdf",
  fuente:
    "Dictamen N° 01/2026 EnCoSeP — Boletín Oficial Municipal N° 058 (04/06/2026). Anexos I a VI.",
  energia: {
    RESIDENCIAL: ENERGIA_RESIDENCIAL_FEB26,
    COMERCIAL: ENERGIA_COMERCIAL_FEB26,
    OBRADOR: ENERGIA_OBRADOR_FEB26,
    ENTIDAD_SIN_FINES: ENERGIA_ENTIDAD_FEB26,
    ENTES_OFICIALES: ENERGIA_OFICIALES_FEB26,
    PEQUENA_INDUSTRIA: ENERGIA_PEQ_INDUSTRIA_FEB26,
  },
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
    OBRADOR: 25849.12,
    ENTIDAD_SIN_FINES: 8616.37,
    ENTES_OFICIALES: 103396.47,
    PEQUENA_INDUSTRIA: 77547.36,
  },
  aguaEstimada: AGUA_ESTIMADA_FEB26,
  aguaMedida: AGUA_MEDIDA_FEB26,
  aguaAlias: {
    OBRADOR: "COMERCIAL",
    ENTIDAD_SIN_FINES: "COMERCIAL",
    PEQUENA_INDUSTRIA: "INDUSTRIAL",
  },
  aguaFormula: { baseM3: 5, m3Por10m2: 2 },
  cloacasPorc: {
    RESIDENCIAL: 0.5,
    COMERCIAL: 0.5,
    OBRADOR: 0.5,
    ENTIDAD_SIN_FINES: 0.5,
    ENTES_OFICIALES: 0.5,
    PEQUENA_INDUSTRIA: 0.5,
    INDUSTRIAL: 0.5,
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

export type ModoAgua = "ESTIMADA" | "MEDIDA";

export type EntradaCalculo = {
  tipo: TipoUsuario;
  kwh: number; // consumo eléctrico del período
  modoAgua: ModoAgua; // estimada por m² o medida por m³
  m2: number; // superficie cubierta declarada (modo estimada)
  m3Medido: number; // m³ leídos del medidor (modo medida)
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

/** Resuelve una tabla de agua por categoría: directo → alias → residencial. */
function resolverAgua<T>(
  tabla: Partial<Record<TipoUsuario, T>> | undefined,
  tipo: TipoUsuario,
  alias?: TipoUsuario,
): T | undefined {
  if (!tabla) return undefined;
  return tabla[tipo] ?? (alias ? tabla[alias] : undefined) ?? tabla.RESIDENCIAL;
}

/** Costo de agua medida: cargo fijo + bloques progresivos por m³. */
export function costoAguaMedida(cat: AguaMedidaCat, m3: number): number {
  let acc = 0;
  let prev = 0;
  for (const t of cat.tramos) {
    if (m3 <= prev) break;
    acc += (Math.min(m3, t.hasta) - prev) * t.precio;
    prev = t.hasta;
  }
  return cat.cargoFijo + acc;
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
      detalle: `Escala hasta ${esSinLimite(t.hasta) ? "máx." : t.hasta + " kWh"}`,
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

  // ── Agua (estimada por m² o medida por m³) ───────────────────────────
  const alias = cuadro.aguaAlias?.[e.tipo];
  let tramoAgua: TramoAgua | null = null;
  let costoAgua = 0;
  let consumoAguaM3 = 0;

  if (e.modoAgua === "MEDIDA") {
    consumoAguaM3 = e.m3Medido;
    const cat = resolverAgua(cuadro.aguaMedida, e.tipo, alias);
    if (cat && e.m3Medido > 0) {
      costoAgua = costoAguaMedida(cat, e.m3Medido);
      lineas.push({
        grupo: "AGUA",
        concepto: "Servicio de agua (medida)",
        monto: costoAgua,
        detalle: `${e.m3Medido} m³ medidos · CF $${cat.cargoFijo.toLocaleString(
          "es-AR",
        )} + consumo por bloques`,
      });
      baseIva += costoAgua;
    }
  } else {
    consumoAguaM3 = consumoAguaEstimado(cuadro, e.m2);
    const tramosAgua = resolverAgua(cuadro.aguaEstimada, e.tipo, alias);
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

// ─────────────────────────────────────────────────────────────────────────
// Serialización a/desde la base de datos
// ─────────────────────────────────────────────────────────────────────────

/** Subconjunto de un cuadro que guarda la columna `datos` (Json) en la DB. */
export type DatosCuadro = Pick<
  CuadroTarifario,
  | "energia"
  | "subsidioEnergia"
  | "alumbradoPublico"
  | "aguaEstimada"
  | "aguaMedida"
  | "aguaAlias"
  | "aguaFormula"
  | "cloacasPorc"
  | "iva"
  | "conceptosExtra"
>;

function finito(hasta: number): number {
  return isFinite(hasta) ? hasta : HASTA_MAX;
}

/** Extrae `datos` reemplazando Infinity por HASTA_MAX (JSON-safe). */
export function datosDeCuadro(c: CuadroTarifario): DatosCuadro {
  const energia: DatosCuadro["energia"] = {};
  for (const [tipo, tramos] of Object.entries(c.energia)) {
    if (tramos)
      energia[tipo as TipoUsuario] = tramos.map((t) => ({
        ...t,
        hasta: finito(t.hasta),
      }));
  }
  const aguaEstimada = {} as DatosCuadro["aguaEstimada"];
  for (const [tipo, tramos] of Object.entries(c.aguaEstimada)) {
    aguaEstimada[tipo as TipoUsuario] = tramos.map((t) => ({
      ...t,
      hasta: finito(t.hasta),
    }));
  }
  const aguaMedida: DatosCuadro["aguaMedida"] = {};
  for (const [tipo, cat] of Object.entries(c.aguaMedida ?? {})) {
    if (cat)
      aguaMedida[tipo as TipoUsuario] = {
        cargoFijo: cat.cargoFijo,
        tramos: cat.tramos.map((t) => ({ ...t, hasta: finito(t.hasta) })),
      };
  }
  return {
    energia,
    subsidioEnergia: c.subsidioEnergia,
    alumbradoPublico: c.alumbradoPublico,
    aguaEstimada,
    aguaMedida,
    aguaAlias: c.aguaAlias,
    aguaFormula: c.aguaFormula,
    cloacasPorc: c.cloacasPorc,
    iva: c.iva,
    conceptosExtra: c.conceptosExtra,
  };
}

/** Devuelve una copia del cuadro JSON-segura (sin Infinity), apta para
 *  pasarse de un Server Component a un Client Component como prop. */
export function cuadroSerializable(c: CuadroTarifario): CuadroTarifario {
  return {
    id: c.id,
    nombre: c.nombre,
    expediente: c.expediente,
    vigenteDesde: c.vigenteDesde,
    estado: c.estado,
    pdfUrl: c.pdfUrl,
    fuente: c.fuente,
    ...datosDeCuadro(c),
  };
}

/** Aplica un porcentaje de aumento a todos los montos monetarios de `datos`
 *  (cargos fijos, variables, energía, alumbrado, conceptos extra). NO toca
 *  porcentajes (IVA, cloacas) ni la fórmula de consumo. Sirve para armar un
 *  cuadro "pedido" a partir del vigente. `pct` en %, ej 30 => +30%. */
export function aplicarAumento(datos: DatosCuadro, pct: number): DatosCuadro {
  const f = 1 + pct / 100;
  const energia: DatosCuadro["energia"] = {};
  for (const [tipo, tramos] of Object.entries(datos.energia)) {
    if (tramos)
      energia[tipo as TipoUsuario] = tramos.map((t) => ({
        hasta: t.hasta,
        cargoFijo: t.cargoFijo * f,
        cgoVariable: t.cgoVariable * f,
        energia: t.energia * f,
      }));
  }
  const aguaEstimada = {} as DatosCuadro["aguaEstimada"];
  for (const [tipo, tramos] of Object.entries(datos.aguaEstimada)) {
    aguaEstimada[tipo as TipoUsuario] = tramos.map((t) => ({
      hasta: t.hasta,
      cargoFijo: t.cargoFijo * f,
      cgoVariable: t.cgoVariable * f,
    }));
  }
  const aguaMedida: DatosCuadro["aguaMedida"] = {};
  for (const [tipo, cat] of Object.entries(datos.aguaMedida ?? {})) {
    if (cat)
      aguaMedida[tipo as TipoUsuario] = {
        cargoFijo: cat.cargoFijo * f,
        tramos: cat.tramos.map((t) => ({ hasta: t.hasta, precio: t.precio * f })),
      };
  }
  const alumbradoPublico: DatosCuadro["alumbradoPublico"] = {};
  for (const [k, v] of Object.entries(datos.alumbradoPublico)) {
    if (typeof v === "number") alumbradoPublico[k as TipoUsuario] = v * f;
  }
  return {
    energia,
    subsidioEnergia: {
      ...datos.subsidioEnergia,
      precioPorKwh: datos.subsidioEnergia.precioPorKwh * f,
    },
    alumbradoPublico,
    aguaEstimada,
    aguaMedida,
    aguaAlias: datos.aguaAlias,
    aguaFormula: datos.aguaFormula,
    cloacasPorc: datos.cloacasPorc,
    iva: datos.iva,
    conceptosExtra: datos.conceptosExtra.map((c) => ({
      ...c,
      monto: c.monto * f,
    })),
  };
}
