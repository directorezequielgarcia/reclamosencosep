// Utilidades de la sección Normativa (admin): normalización de texto para
// buscar y armado de extractos con las palabras encontradas resaltadas.

/**
 * Pasa a minúsculas y saca los acentos, carácter por carácter, así el texto
 * normalizado mide lo mismo que el original y las posiciones coinciden (sirve
 * para recortar extractos del texto original). No colapsa espacios: eso lo
 * hace `limpiarTextoOcr` al cargar.
 */
export function normalizarTexto(s: string): string {
  let out = "";
  for (const ch of s) {
    const n = ch.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    out += n.length === ch.length ? n : ch;
  }
  return out;
}

/**
 * Normalización para el texto de búsqueda (textoBusqueda): lo mismo que
 * `normalizarTexto` más una corrección tolerante de errores típicos del OCR.
 * El OCR lee la "ó" como "6" ("resoluci6n", "micromedici6n"), y a veces la
 * "o" como "0" o la "i" como "1". Se corrige SOLO cuando el dígito (6, 0 o 1)
 * está entre dos letras minúsculas dentro de una palabra: así "art. 17",
 * "16600", "1a" o "2018" no se tocan. Mide lo mismo que el original, por lo que
 * las posiciones siguen coincidiendo con el texto mostrado.
 */
export function normalizarParaBusqueda(s: string): string {
  return normalizarTexto(s).replace(/(?<=[a-z])[601](?=[a-z])/g, (d) => (d === "1" ? "i" : "o"));
}

/** Escapa los metacaracteres de regex de una entrada (JS y Postgres). */
export function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&");
}

/**
 * Regex global sobre texto ya normalizado que encuentra cada palabra
 * COMPLETA (no como parte de otra) y su plural simple (s / es).
 */
export function regexPalabras(palabras: string[]): RegExp {
  const alt = palabras.map(escaparRegex).join("|");
  return new RegExp(`(?<![a-z0-9])(?:${alt})(?:e?s)?(?![a-z0-9])`, "g");
}

/** Limpieza mínima del texto sacado por OCR: sin caracteres de control y con espacios y saltos colapsados. */
export function limpiarTextoOcr(s: string): string {
  return s
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Servicios con los que se clasifica la normativa (claves guardadas en
// Norma.servicios, ver scripts/cargar-normas.ts).
export const SERVICIO_LABEL: Record<string, string> = {
  marco: "Marco general y ENCOSEP",
  agua: "Agua y cloacas",
  energia: "Energía y alumbrado",
  transporte: "Transporte colectivo",
  taxis: "Taxis y remises",
  higiene: "Higiene urbana",
  convenios_scpl: "Convenios SCPL",
};

export type Fragmento = { texto: string; marcado: boolean };

/** Posiciones [inicio, fin) de todas las coincidencias (palabra completa) en el texto. */
export function posicionesCoincidencias(texto: string, palabras: string[]): [number, number][] {
  if (palabras.length === 0) return [];
  const norm = normalizarParaBusqueda(texto);
  return [...norm.matchAll(regexPalabras(palabras))].map((m) => [m.index, m.index + m[0].length]);
}

/** Parte `texto` en fragmentos marcados / no marcados según los rangos (ordenados, sin solaparse). */
export function fragmentar(texto: string, rangos: [number, number][], desde = 0, hasta = texto.length): Fragmento[] {
  const frags: Fragmento[] = [];
  let pos = desde;
  for (const [a, b] of rangos) {
    if (b <= desde || a >= hasta) continue;
    const ra = Math.max(a, desde);
    const rb = Math.min(b, hasta);
    if (ra > pos) frags.push({ texto: texto.slice(pos, ra), marcado: false });
    frags.push({ texto: texto.slice(ra, rb), marcado: true });
    pos = rb;
  }
  if (pos < hasta) frags.push({ texto: texto.slice(pos, hasta), marcado: false });
  return frags;
}

/**
 * Arma un extracto de unos `largo` caracteres alrededor de la primera
 * coincidencia, partido en fragmentos para renderizar con <mark> sin HTML crudo.
 */
export function armarExtracto(texto: string, palabras: string[], largo = 200): Fragmento[] | null {
  const rangos = posicionesCoincidencias(texto, palabras);
  if (rangos.length === 0) return null;
  const ini = Math.max(0, rangos[0][0] - Math.floor(largo / 2));
  const fin = Math.min(texto.length, ini + largo);
  const frags = fragmentar(texto, rangos, ini, fin);
  if (ini > 0) frags.unshift({ texto: "… ", marcado: false });
  if (fin < texto.length) frags.push({ texto: " …", marcado: false });
  return frags;
}
