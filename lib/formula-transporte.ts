// Motor de cálculo del Costo Kilométrico del Servicio Público de Transporte
// Urbano y Suburbano de Pasajeros (concesión GRUPO MR S.R.L.), conforme al
// Anexo de Estructura y Metodología de Costos de la Ordenanza N° 17.335/25
// (Pliego de Bases y Condiciones, modificado por Ordenanza 17.335-1/25).
//
// El Costo/Km es la suma de 18 rubros. Cada uno tiene precios de mercado que
// cambian mes a mes (los carga el staff) y parámetros fijos por el pliego
// (cantidades, coeficientes, alícuotas — no cambian salvo que se modifique
// la Ordenanza). Este módulo no depende de la base de datos: los datos
// mensuales entran como `DatosFormula` y salen como `ResultadoFormula`.

// ─────────────────────────────────────────────────────────────────────────
// Parámetros fijados por el pliego (Anexo de Costos). No se cargan mes a
// mes: son constantes normativas. Si el Concejo Deliberante modifica el
// pliego, se actualizan acá (igual criterio que CUADRO_FEB_2026 en tarifas.ts).
// ─────────────────────────────────────────────────────────────────────────
export const PARAMETROS_FIJOS_PLIEGO = {
  combustible: {
    consumoLkm: 0.325,
    consumoLkmFrio: 0.39, // jornadas con < 8°C a las 7hs, prorrateado en el mes
  },
  lubricantes: {
    motorLkm: 0.0035,
    direccionLkm: 0.000038,
    cajaDiferencialKgkm: 0.000222,
  },
  lavadoEngrase: {
    kmCambioAceiteFiltro: 10000,
    kmCambioFiltroGasoil: 10000,
    kmEngraseLitio: 3333,
    kmLavado: 2000,
    kmFiltroClimatizacion: 7500,
  },
  neumaticos: {
    cantidadCubiertas: 6,
    kmCubiertaNueva: 60000,
    kmRecapado: 30000,
    recapadosPorCubierta: 1,
  },
  amortizacion: {
    proporcionChasis: 0.7,
    proporcionCarroceria: 0.3,
    valorResidualChasis: 0.2,
    valorResidualCarroceria: 0.2,
    vidaUtilKmAnios1a5: 230000,
    vidaUtilKmAnios6a10: 800000,
    valorPatentamientoPct: 0.018,
  },
  mantenimiento: {
    proporcionChasis: 0.7,
    proporcionCarroceria: 0.3,
    valorResidualChasis: 0.2,
    valorResidualCarroceria: 0.1,
    vidaUtilKm: 800000,
  },
  gastosGenerales: { alicuota: 0.03 }, // 3% sobre rubros 1 a 13
  creditosDebitosBancarios: { alicuota: 0.006 }, // 0,6%
  capitalInvertido: { tasa: 0.0655 }, // 6,55%
  gerenciamiento: { alicuotaNoLaboral: 0.04, alicuotaLaboral: 0.04 }, // 4% (art. 33 pliego)
  percepcionTarifariaGps: { alicuota: 0.0847 }, // 8,47% sobre recaudación digital
  tasasMunicipales: { coefValuacionCatastral: 0.66, alicuotaTasaMunicipal: 0.01 },
  maquinasHerramientas: { pctSobreValorParque: 0.02 },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// Definición de los 18 rubros: id estable + metadatos para explicar cada
// elemento del costo en la UI (nombre, artículo del pliego, cómo se calcula).
// ─────────────────────────────────────────────────────────────────────────
export type RubroId =
  | "combustible"
  | "lubricantes"
  | "lavadoEngrase"
  | "neumaticos"
  | "amortizacion"
  | "mantenimiento"
  | "salarios"
  | "seguros"
  | "maquinasHerramientasInmuebles"
  | "patentesEvaluacionesTecnicas"
  | "percepcionTarifariaGps"
  | "vigilancia"
  | "tasasMunicipales"
  | "gastosGenerales"
  | "ingresosBrutos"
  | "creditosDebitosBancarios"
  | "capitalInvertido"
  | "gerenciamiento";

export type RubroDef = {
  id: RubroId;
  numero: number;
  nombre: string;
  explicacion: string;
  /** Si el motor puede autocalcularlo a partir de precios base + parámetros fijos. */
  autocalculable: boolean;
};

export const RUBROS_DEF: RubroDef[] = [
  {
    id: "combustible",
    numero: 1,
    nombre: "Combustible",
    explicacion:
      "Precio del gasoil (Sec. de Energía de la Nación, Res. 1104) × consumo específico de 0,325 l/km (0,39 l/km en jornadas con heladas, prorrateado en el mes).",
    autocalculable: true,
  },
  {
    id: "lubricantes",
    numero: 2,
    nombre: "Lubricantes",
    explicacion:
      "Precio de motor, caja de dirección y caja de cambios/diferencial × su consumo específico respectivo.",
    autocalculable: true,
  },
  {
    id: "lavadoEngrase",
    numero: 3,
    nombre: "Lavado y engrase",
    explicacion:
      "Cambio de aceite/filtro, filtro de gasoil, engrase con litio, lavado y filtro de climatización, cada uno a su frecuencia kilométrica.",
    autocalculable: true,
  },
  {
    id: "neumaticos",
    numero: 4,
    nombre: "Neumáticos",
    explicacion:
      "6 cubiertas por unidad, 60.000 km de vida útil la cubierta nueva y 30.000 km el recapado (1 recapado por cubierta).",
    autocalculable: true,
  },
  {
    id: "amortizacion",
    numero: 5,
    nombre: "Amortización de material rodante",
    explicacion:
      "Reposición de capital del vehículo (70% chasis / 30% carrocería, valor residual 20%/20%), sobre una vida útil de 230.000 km (años 1 a 5 del contrato) u 800.000 km (años 6 a 10).",
    autocalculable: true,
  },
  {
    id: "mantenimiento",
    numero: 6,
    nombre: "Mantenimiento de material rodante",
    explicacion:
      "Misma lógica que la amortización (70%/30%, valor residual 20%/10%), sobre 800.000 km de vida útil.",
    autocalculable: true,
  },
  {
    id: "salarios",
    numero: 7,
    nombre: "Salarios del personal",
    explicacion:
      "Convenio colectivo × 20 subcategorías (conducción, tráfico, mantenimiento, administración) según coeficiente de dotación por vehículo (ej. 2,2228 conductores/unidad), sobre el Kilometraje Mensual de Base. Se carga como costo/km ya calculado por complejidad de la planilla salarial.",
    autocalculable: false,
  },
  {
    id: "seguros",
    numero: 8,
    nombre: "Seguros",
    explicacion:
      "Prima anual del parque + alícuota de ART sobre la remuneración de cada categoría + prima del Seguro de Vida Obligatorio (Decreto-Ley 1.567/74).",
    autocalculable: false,
  },
  {
    id: "maquinasHerramientasInmuebles",
    numero: 9,
    nombre: "Máquinas, herramientas e inmuebles",
    explicacion:
      "2% del valor del parque móvil para máquinas y herramientas, más la valuación de administración, playa, garage y terreno según m²/vehículo.",
    autocalculable: false,
  },
  {
    id: "patentesEvaluacionesTecnicas",
    numero: 10,
    nombre: "Patentes y evaluaciones técnicas",
    explicacion:
      "Aranceles de patentamiento, verificación técnica vehicular y evaluación psicofísica de choferes, según cantidad del parque total.",
    autocalculable: false,
  },
  {
    id: "percepcionTarifariaGps",
    numero: 11,
    nombre: "Percepción tarifaria y GPS",
    explicacion:
      "Alícuota del 8,47% sobre la recaudación digital total (SUBE) del mes, cubre el sistema de cobro y el sistema de posicionamiento global.",
    autocalculable: true,
  },
  {
    id: "vigilancia",
    numero: 12,
    nombre: "Servicio de vigilancia",
    explicacion: "Costo del sereno por cada predio de estacionamiento nocturno.",
    autocalculable: false,
  },
  {
    id: "tasasMunicipales",
    numero: 13,
    nombre: "Tasas municipales",
    explicacion:
      "66% de la valuación catastral de los inmuebles afectados × 1% de alícuota de la tasa municipal.",
    autocalculable: false,
  },
  {
    id: "gastosGenerales",
    numero: 14,
    nombre: "Gastos generales",
    explicacion: "3% sobre la suma de los rubros 1 a 13.",
    autocalculable: true,
  },
  {
    id: "ingresosBrutos",
    numero: 15,
    nombre: "Impuesto a los Ingresos Brutos",
    explicacion:
      "Alícuota provincial vigente sobre los ingresos del operador (recaudación tarifaria + publicidad + alquiler + otros).",
    autocalculable: false,
  },
  {
    id: "creditosDebitosBancarios",
    numero: 16,
    nombre: "Impuesto a los Créditos y Débitos bancarios",
    explicacion: "0,6% sobre la suma de los rubros 1 a 13.",
    autocalculable: true,
  },
  {
    id: "capitalInvertido",
    numero: 17,
    nombre: "Remuneración al capital invertido",
    explicacion:
      "6,55% sobre el valor contable del Parque Móvil (según antigüedad) y de Máquinas/Herramientas/Inmuebles.",
    autocalculable: false,
  },
  {
    id: "gerenciamiento",
    numero: 18,
    nombre: "Costo de gerenciamiento",
    explicacion:
      "4% de remuneración por gestión empresaria sobre los rubros no laborales, más 4% sobre el rubro de salarios (art. 33 del pliego).",
    autocalculable: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Datos que se cargan mes a mes (precios de mercado, ingresos, kilometraje).
// Todo lo que NO está acá es un parámetro fijo del pliego (arriba).
// ─────────────────────────────────────────────────────────────────────────
export type DatosFormula = {
  periodo: string; // "2026-08" (mes bajo análisis)

  // Precios de mercado para los rubros autocalculables
  precioCombustibleLitro: number;
  precioLubricanteMotor: number;
  precioLubricanteDireccion: number;
  precioLubricanteCajaDif: number;
  precioLavadoEngraseSet: number; // suma de los 5 subrubros por aplicación
  precioCubiertaNueva: number;
  precioRecapado: number;
  precioVehiculoNuevoUsd: number;
  tipoCambio: number;
  valorParqueMovilTotal: number; // para gerenciamiento / capital invertido si se autocalculan

  // Rubros no autocalculables: costo/km ya determinado y cargado a mano
  // (certificado por la Autoridad de Aplicación o calculado aparte).
  costoKmSalarios: number;
  costoKmSeguros: number;
  costoKmMaquinasInmuebles: number;
  costoKmPatentes: number;
  costoKmVigilancia: number;
  costoKmTasasMunicipales: number;
  costoKmIngresosBrutos: number;
  costoKmCapitalInvertido: number;

  // Ingresos del operador en el período (para el rubro 11 y para la
  // Compensación)
  recaudacionDigitalTotal: number;

  // Kilometraje del sistema
  kilometrajeMensualBase: number; // KMB, denominador de varios rubros
  kilometrajeProgramado: number;
  kilometrajeAPagarCertificado: number; // el que valida/certifica la Autoridad de Aplicación

  // ── Datos presentados por la prestadora (GRUPO MR S.R.L.), para
  // contrastar contra lo certificado por la Autoridad de Aplicación.
  prestadoraKilometrajeRecorrido?: number | null;
  prestadoraIngresosDeclarados?: number | null;
  prestadoraObservaciones?: string | null;
};

export type RubroCalculado = RubroDef & {
  costoKm: number;
};

export type ResultadoFormula = {
  rubros: RubroCalculado[];
  costoKmTotal: number;
  costoServicioMes: number; // costoKmTotal × kilometrajeAPagarCertificado
  compensacionEstimada: number; // costoServicioMes − recaudacionDigitalTotal (si > 0)
  diferenciaKmVsPrestadora: number | null; // kilometrajeAPagarCertificado − prestadoraKilometrajeRecorrido
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Calcula el costo/km de los 6 rubros con fórmula pública simple. */
function autocalcularRubros(d: DatosFormula): Record<string, number> {
  const P = PARAMETROS_FIJOS_PLIEGO;

  const combustible = d.precioCombustibleLitro * P.combustible.consumoLkm;

  const lubricantes =
    d.precioLubricanteMotor * P.lubricantes.motorLkm +
    d.precioLubricanteDireccion * P.lubricantes.direccionLkm +
    d.precioLubricanteCajaDif * P.lubricantes.cajaDiferencialKgkm;

  // "lavadoEngrase" se carga como precio de set ya prorrateado por el
  // usuario (simplificación: el detalle de las 5 frecuencias se muestra
  // como referencia en RUBROS_DEF pero no se recalcula automáticamente
  // acá para no exigir 5 precios de proveedor distintos cada mes).
  const lavadoEngrase = d.precioLavadoEngraseSet;

  const neumaticos =
    (P.neumaticos.cantidadCubiertas *
      (d.precioCubiertaNueva + P.neumaticos.recapadosPorCubierta * d.precioRecapado)) /
    (P.neumaticos.kmCubiertaNueva + P.neumaticos.kmRecapado);

  const valorVehiculo = d.precioVehiculoNuevoUsd * d.tipoCambio;
  const vidaUtilAmort = P.amortizacion.vidaUtilKmAnios1a5; // simplificación: años 1-5 por defecto
  const amortizacion =
    (((valorVehiculo * P.amortizacion.proporcionChasis -
      P.neumaticos.cantidadCubiertas * d.precioCubiertaNueva) *
      (1 - P.amortizacion.valorResidualChasis)) +
      valorVehiculo * P.amortizacion.proporcionCarroceria * (1 - P.amortizacion.valorResidualCarroceria)) /
    vidaUtilAmort;

  const mantenimiento =
    (((valorVehiculo * P.mantenimiento.proporcionChasis -
      P.neumaticos.cantidadCubiertas * d.precioCubiertaNueva) *
      (1 - P.mantenimiento.valorResidualChasis)) +
      valorVehiculo * P.mantenimiento.proporcionCarroceria * (1 - P.mantenimiento.valorResidualCarroceria)) /
    P.mantenimiento.vidaUtilKm;

  const percepcionTarifariaGps =
    d.kilometrajeMensualBase > 0
      ? (d.recaudacionDigitalTotal * P.percepcionTarifariaGps.alicuota) / d.kilometrajeMensualBase
      : 0;

  return {
    combustible: round2(combustible),
    lubricantes: round2(lubricantes),
    lavadoEngrase: round2(lavadoEngrase),
    neumaticos: round2(neumaticos),
    amortizacion: round2(amortizacion),
    mantenimiento: round2(mantenimiento),
    percepcionTarifariaGps: round2(percepcionTarifariaGps),
  };
}

/**
 * Calcula el desglose completo de los 18 rubros, el Costo/Km total, el
 * Costo del Servicio del mes y la Compensación estimada. Los rubros 14
 * (gastos generales), 16 (créditos/débitos) y 18 (gerenciamiento) dependen
 * de la suma de otros rubros, por lo que se calculan en un segundo paso.
 */
export function calcularFormula(d: DatosFormula): ResultadoFormula {
  const P = PARAMETROS_FIJOS_PLIEGO;
  const auto = autocalcularRubros(d);

  const costoKmPorRubro: Record<RubroId, number> = {
    combustible: auto.combustible,
    lubricantes: auto.lubricantes,
    lavadoEngrase: auto.lavadoEngrase,
    neumaticos: auto.neumaticos,
    amortizacion: auto.amortizacion,
    mantenimiento: auto.mantenimiento,
    salarios: d.costoKmSalarios,
    seguros: d.costoKmSeguros,
    maquinasHerramientasInmuebles: d.costoKmMaquinasInmuebles,
    patentesEvaluacionesTecnicas: d.costoKmPatentes,
    percepcionTarifariaGps: auto.percepcionTarifariaGps,
    vigilancia: d.costoKmVigilancia,
    tasasMunicipales: d.costoKmTasasMunicipales,
    gastosGenerales: 0, // se completa abajo
    ingresosBrutos: d.costoKmIngresosBrutos,
    creditosDebitosBancarios: 0, // se completa abajo
    capitalInvertido: d.costoKmCapitalInvertido,
    gerenciamiento: 0, // se completa abajo
  };

  // Rubros 1 a 13 (todo menos 14, 15, 16, 17, 18) — base de los rubros 14 y 16
  const sumaRubros1a13 =
    costoKmPorRubro.combustible +
    costoKmPorRubro.lubricantes +
    costoKmPorRubro.lavadoEngrase +
    costoKmPorRubro.neumaticos +
    costoKmPorRubro.amortizacion +
    costoKmPorRubro.mantenimiento +
    costoKmPorRubro.salarios +
    costoKmPorRubro.seguros +
    costoKmPorRubro.maquinasHerramientasInmuebles +
    costoKmPorRubro.patentesEvaluacionesTecnicas +
    costoKmPorRubro.percepcionTarifariaGps +
    costoKmPorRubro.vigilancia +
    costoKmPorRubro.tasasMunicipales;

  costoKmPorRubro.gastosGenerales = round2(sumaRubros1a13 * P.gastosGenerales.alicuota);
  costoKmPorRubro.creditosDebitosBancarios = round2(
    sumaRubros1a13 * P.creditosDebitosBancarios.alicuota,
  );

  const rubrosNoLaborales =
    sumaRubros1a13 +
    costoKmPorRubro.gastosGenerales +
    costoKmPorRubro.ingresosBrutos +
    costoKmPorRubro.creditosDebitosBancarios +
    costoKmPorRubro.capitalInvertido -
    costoKmPorRubro.salarios; // el gerenciamiento separa laboral de no laboral

  costoKmPorRubro.gerenciamiento = round2(
    rubrosNoLaborales * P.gerenciamiento.alicuotaNoLaboral +
      costoKmPorRubro.salarios * P.gerenciamiento.alicuotaLaboral,
  );

  const rubros: RubroCalculado[] = RUBROS_DEF.map((def) => ({
    ...def,
    costoKm: costoKmPorRubro[def.id] ?? 0,
  }));

  const costoKmTotal = round2(rubros.reduce((acc, r) => acc + r.costoKm, 0));
  const costoServicioMes = round2(costoKmTotal * d.kilometrajeAPagarCertificado);
  const compensacionEstimada = round2(
    Math.max(0, costoServicioMes - d.recaudacionDigitalTotal),
  );
  const diferenciaKmVsPrestadora =
    d.prestadoraKilometrajeRecorrido != null
      ? round2(d.kilometrajeAPagarCertificado - d.prestadoraKilometrajeRecorrido)
      : null;

  return {
    rubros,
    costoKmTotal,
    costoServicioMes,
    compensacionEstimada,
    diferenciaKmVsPrestadora,
  };
}

/** Valores en cero, para precargar el formulario de un período nuevo. */
export function datosFormulaVacios(periodo: string): DatosFormula {
  return {
    periodo,
    precioCombustibleLitro: 0,
    precioLubricanteMotor: 0,
    precioLubricanteDireccion: 0,
    precioLubricanteCajaDif: 0,
    precioLavadoEngraseSet: 0,
    precioCubiertaNueva: 0,
    precioRecapado: 0,
    precioVehiculoNuevoUsd: 0,
    tipoCambio: 0,
    valorParqueMovilTotal: 0,
    costoKmSalarios: 0,
    costoKmSeguros: 0,
    costoKmMaquinasInmuebles: 0,
    costoKmPatentes: 0,
    costoKmVigilancia: 0,
    costoKmTasasMunicipales: 0,
    costoKmIngresosBrutos: 0,
    costoKmCapitalInvertido: 0,
    recaudacionDigitalTotal: 0,
    kilometrajeMensualBase: 0,
    kilometrajeProgramado: 0,
    kilometrajeAPagarCertificado: 0,
    prestadoraKilometrajeRecorrido: null,
    prestadoraIngresosDeclarados: null,
    prestadoraObservaciones: null,
  };
}

// Parámetro técnico del 100% del pliego (Anexo I A, línea de base 2025),
// como referencia fija para comparar contra el Kilometraje Programado real.
export const KILOMETRAJE_100PCT_PLIEGO_ANEXO_IA = 826060.27;
export const PARQUE_OPERATIVO_100PCT_PLIEGO_ANEXO_IA = 121;
