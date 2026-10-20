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

/** Limpieza mínima del texto sacado por OCR: sin caracteres de control y con espacios y saltos colapsados. */
export function limpiarTextoOcr(s: string): string {
  return s
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type Fragmento = { texto: string; marcado: boolean };

/**
 * Arma un extracto de unos `largo` caracteres alrededor de la primera
 * coincidencia de cualquiera de las palabras (ya normalizadas), partido en
 * fragmentos para renderizar con <mark> sin HTML crudo.
 */
export function armarExtracto(texto: string, palabras: string[], largo = 200): Fragmento[] | null {
  const norm = normalizarTexto(texto);
  let primera = -1;
  for (const p of palabras) {
    const i = norm.indexOf(p);
    if (i >= 0 && (primera < 0 || i < primera)) primera = i;
  }
  if (primera < 0) return null;

  const ini = Math.max(0, primera - Math.floor(largo / 2));
  const fin = Math.min(texto.length, ini + largo);

  // Rangos marcados dentro de [ini, fin)
  const rangos: [number, number][] = [];
  for (const p of palabras) {
    let i = norm.indexOf(p, ini);
    while (i >= 0 && i < fin) {
      rangos.push([i, Math.min(i + p.length, fin)]);
      i = norm.indexOf(p, i + p.length);
    }
  }
  rangos.sort((a, b) => a[0] - b[0]);
  const unidos: [number, number][] = [];
  for (const r of rangos) {
    const ult = unidos[unidos.length - 1];
    if (ult && r[0] <= ult[1]) ult[1] = Math.max(ult[1], r[1]);
    else unidos.push([r[0], r[1]]);
  }

  const frags: Fragmento[] = [];
  let pos = ini;
  for (const [a, b] of unidos) {
    if (a > pos) frags.push({ texto: texto.slice(pos, a), marcado: false });
    frags.push({ texto: texto.slice(a, b), marcado: true });
    pos = b;
  }
  if (pos < fin) frags.push({ texto: texto.slice(pos, fin), marcado: false });
  if (ini > 0) frags.unshift({ texto: "… ", marcado: false });
  if (fin < texto.length) frags.push({ texto: " …", marcado: false });
  return frags;
}
