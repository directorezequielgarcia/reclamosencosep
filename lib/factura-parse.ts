// Parser de facturas SCPL (texto extraído del PDF) + análisis de diferencias
// contra los cuadros tarifarios. Funciones puras (sin DB ni red).

import {
  calcularFactura,
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
  };
  total: number | null;
};

const TIPO_TEXTO: [RegExp, TipoUsuario][] = [
  [/RESIDENCIAL/i, "RESIDENCIAL"],
  [/COMERCIAL/i, "COMERCIAL"],
  [/OBRADOR/i, "OBRADOR"],
  [/ENTIDAD/i, "ENTIDAD_SIN_FINES"],
  [/OFICIAL/i, "ENTES_OFICIALES"],
  [/INDUSTRIA/i, "PEQUENA_INDUSTRIA"],
];

export function parseFacturaTexto(text: string): FacturaExtraida {
  // Tipo de usuario (de la línea del servicio eléctrico).
  const mServ = text.match(/Servicio El[eé]ctrico:\s*([A-ZÁÉÍÓÚ ]+)/i);
  const tipoTxt = mServ ? mServ[1] : text;
  let tipo: TipoUsuario = "RESIDENCIAL";
  for (const [re, t] of TIPO_TEXTO) if (re.test(tipoTxt)) { tipo = t; break; }

  // Modo de agua.
  const modoAgua: ModoAgua = /AGUA\s+MEDIDA/i.test(text) ? "MEDIDA" : "ESTIMADA";

  // Consumo eléctrico: último decimal del bloque del medidor activo.
  let consumoKwh: number | null = null;
  const mAct = text.match(/TOTAL CONSUMO ACTIVO([\s\S]*?)(REACTIVA|Servicios)/i);
  if (mAct) {
    const nums = mAct[1].match(/-?[\d.,]+\.\d{2}|-?\d+\.\d{2}/g);
    if (nums && nums.length) consumoKwh = parseMonto(nums[nums.length - 1]);
  }

  // m² (superficie cubierta declarada).
  const m2 = buscar(text, /Cubierta Declarada M2:\s*([\d.,]+)/i);

  // m³ medido (si corresponde).
  let m3Medido: number | null = null;
  const mMed = text.match(/TOTAL CONSUMO MEDIDO([\s\S]*?)(CONSUMOS|SERVICIOS)/i);
  if (mMed) {
    const nums = mMed[1].match(/-?\d+\.\d{2}/g);
    if (nums && nums.length) m3Medido = parseMonto(nums[nums.length - 1]);
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
  };

  const total = buscar(text, /SUBTOTAL VARIOS\s+([\d.,]+)\s+\d{2}\/\d{2}\/\d{2}/i);

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
  facturado: number | null;
  segunCuadro: number;
  difPorc: number | null;
  alerta: boolean;
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
};

const UMBRAL = 0.03; // 3% de tolerancia para marcar alerta

function difPorc(fact: number | null, calc: number): number | null {
  if (fact == null || calc === 0) return null;
  return (fact - calc) / calc;
}

export function analizarFactura(
  text: string,
  cuadros: CuadroTarifario[],
): AnalisisFactura {
  const extraida = parseFacturaTexto(text);

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
    };
  }

  const entrada = (): EntradaCalculo => ({
    tipo: extraida.tipo,
    kwh: extraida.consumoKwh ?? 0,
    modoAgua: extraida.modoAgua,
    m2: extraida.m2 ?? 0,
    m3Medido: extraida.m3Medido ?? 0,
    tieneCloacas: extraida.tieneCloacas,
    conSubsidioEnergia: extraida.conSubsidio,
    mes: extraida.mes,
    extras: {
      bomberos: extraida.conBomberos,
      sepelios: extraida.conSepelios,
      "sepelios-adic": extraida.conSepelios,
    },
  });

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
    };
  }

  const res = mejor.res;
  const fila = (
    concepto: string,
    fact: number | null,
    nombreLinea: string,
  ): FilaControl => {
    const segun = sumaLinea(res, nombreLinea);
    const d = difPorc(fact, segun);
    return {
      concepto,
      facturado: fact,
      segunCuadro: segun,
      difPorc: d,
      alerta: d != null && Math.abs(d) > UMBRAL,
    };
  };

  const filas: FilaControl[] = [
    fila("Cargo fijo de energía", c.cargoFijo, "Cargo fijo de energía"),
    fila("Cargo variable de energía", c.cargoVariable, "Cargo variable de energía"),
    fila("Compra de energía", c.compra, "Compra de energía"),
    fila("Alumbrado público", c.alumbrado, "Alumbrado público"),
    fila("Servicio de agua", c.agua, "Servicio de agua"),
    fila("Servicio de cloacas", c.cloacas, "Servicio de cloacas"),
  ].filter((f) => f.facturado != null || f.segunCuadro > 0);

  // Chequeos independientes del prorrateo.
  const checks: { label: string; ok: boolean; detalle: string }[] = [];
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
