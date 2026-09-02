// Fuente y códigos de archivo del dataset público de transporte que publica
// la Municipalidad (repo comodoro-mit/transporte, mismo dataset que usa su
// propio mapa oficial). Único lugar donde vive esta correspondencia —
// ZorritoGuia, MiniMapaLinea y LineaDetalle la comparten para no
// desincronizarse.
//
// La Municipalidad migró la estructura el 01/09/2026 (junto con la entrada
// en vigencia de la Resolución 1.628/26): antes publicaba
// layers_transporte/<archivo>_data.js (JSON envuelto en `var x = ...;`),
// ahora publica data/<archivo>.geojson y data/paradas.json en JSON plano,
// con nuevos códigos de archivo (ej. antes "6A"/"6B", ahora "6ah"/"6h" —
// antihorario/horario).
export const MCR_TRANSPORTE_BASE = "https://comodoro-mit.github.io/transporte/data";
export const MCR_SNAPSHOT_BASE = "/data/transporte-mcr-snapshot";

// numero (tal como se muestra en la página de Transporte, AREAS.transporte.lineas)
// -> código(s) de archivo real(es) del dataset (data/linea-<codigo>.geojson).
// Algunas líneas publican más de un archivo (dos sentidos de una circular,
// o un ramal aparte).
export const CODIGOS_ARCHIVO_POR_LINEA: Record<string, string[]> = {
  "1": ["1"],
  "2": ["2"],
  "3": ["3"],
  "4": ["4"],
  "5": ["5", "5u"],
  "6": ["6h", "6ah"],
  "7": ["7"],
  "8": ["8h", "8ah"],
  "9": ["9"],
  "9A": ["9a"],
  "12": ["12"],
  "13": ["13"],
  "14": ["14"],
  "15": ["15"],
  "16": ["16"],
  "17": ["17"],
  "18": ["18"],
  "19": ["19"],
  "20": ["20"],
  "21": ["21"],
  "22": ["22"],
};

export const TODOS_LOS_CODIGOS_ARCHIVO: string[] = Object.values(
  CODIGOS_ARCHIVO_POR_LINEA,
).flat();

// Inverso: código de archivo -> numero de línea, para poder anclar un
// resultado de ZorritoGuia (que trabaja con códigos de archivo) al detalle
// correcto de la página de Transporte (que usa el numero, ej. "9a" -> "9A").
export const NUMERO_POR_CODIGO_ARCHIVO: Record<string, string> = Object.fromEntries(
  Object.entries(CODIGOS_ARCHIVO_POR_LINEA).flatMap(([numero, codigos]) =>
    codigos.map((c) => [c, numero]),
  ),
);
