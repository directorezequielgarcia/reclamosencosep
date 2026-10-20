// Búsqueda de la sección Normativa: filtra y ordena por relevancia.
//
// Reglas:
//  1. Se busca por PALABRA COMPLETA (límites de palabra de Postgres \m y \M)
//     sobre textoBusqueda, que ya está normalizado. "agua" no encuentra
//     "aguas" como coincidencia exacta ni "paraguay". El plural simple (s / es)
//     se acepta, pero se cuenta aparte y pesa menos.
//  2. Todas las palabras de la consulta deben aparecer en algún campo: número
//     y año, tema, temas, resumen o texto completo.
//  3. Puntaje: la frase contigua pesa mucho (más en tema/resumen que en el
//     texto), cada palabra pesa más en tema/temas/resumen que en el texto, y el
//     conteo en el texto entra en escala logarítmica para que un documento
//     enorme no gane solo por tamaño.

import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { escaparRegex, normalizarTexto } from "./normativa";

/** Normas sin los textos pesados (se traen aparte, solo cuando hacen falta). */
export const OMITIR_TEXTO = { texto: true, textoBusqueda: true } as const;

export type NormaLiviana = Prisma.NormaGetPayload<{ omit: typeof OMITIR_TEXTO }>;

export type Resultado = {
  norma: NormaLiviana;
  puntaje: number;
  /** Apariciones de las palabras en el texto completo (exactas + plurales). */
  coincidenciasTexto: number;
  /** Apariciones de la frase contigua en el texto (solo con 2+ palabras). */
  fraseTexto: number;
};

/** Palabras de la consulta: normalizadas y separadas por todo lo que no sea letra o número. */
export function palabrasDeConsulta(q: string | undefined): string[] {
  return [...new Set(normalizarTexto(q ?? "").split(/[^a-z0-9]+/).filter(Boolean))];
}

type ConteoTexto = { id: string; e: number[]; p: number[]; f: number };

// Cuenta, por norma, apariciones exactas, plurales y de la frase contigua en
// textoBusqueda. Se hace en una sola consulta; los patrones van como parámetros.
async function contarEnTexto(palabras: string[]): Promise<Map<string, ConteoTexto>> {
  const cuenta = (patron: string) =>
    Prisma.sql`(SELECT count(*) FROM regexp_matches("textoBusqueda", ${patron}, 'g'))::int`;
  const columnas: Prisma.Sql[] = [];
  palabras.forEach((w, i) => {
    const x = escaparRegex(w);
    columnas.push(Prisma.sql`${cuenta(`\\m${x}\\M`)} AS "e${Prisma.raw(String(i))}"`);
    columnas.push(Prisma.sql`${cuenta(`\\m${x}(es|s)\\M`)} AS "p${Prisma.raw(String(i))}"`);
  });
  if (palabras.length > 1) {
    const frase = palabras.map((w) => `${escaparRegex(w)}(es|s)?`).join("[^a-z0-9]{1,3}");
    columnas.push(Prisma.sql`${cuenta(`\\m${frase}\\M`)} AS "f"`);
  }
  const filas = await prisma.$queryRaw<Record<string, string | number>[]>`
    SELECT "id", ${Prisma.join(columnas)} FROM "Norma" WHERE "textoBusqueda" IS NOT NULL`;
  const out = new Map<string, ConteoTexto>();
  for (const f of filas) {
    out.set(String(f.id), {
      id: String(f.id),
      e: palabras.map((_, i) => Number(f[`e${i}`])),
      p: palabras.map((_, i) => Number(f[`p${i}`])),
      f: palabras.length > 1 ? Number(f.f) : 0,
    });
  }
  return out;
}

/** Cantidad de apariciones de `patron` (regex global) en `texto`. */
const cuantas = (texto: string, patron: RegExp) => (texto.match(patron) ?? []).length;

export async function buscarNormas(
  where: Prisma.NormaWhereInput,
  q: string | undefined,
): Promise<{ total: number; resultados: Resultado[]; palabras: string[] }> {
  const [total, candidatas] = await Promise.all([
    prisma.norma.count(),
    prisma.norma.findMany({ where, omit: OMITIR_TEXTO }),
  ]);
  const palabras = palabrasDeConsulta(q);

  const porAnio = (a: NormaLiviana, b: NormaLiviana) =>
    b.anio - a.anio || (parseInt(b.numero, 10) || 0) - (parseInt(a.numero, 10) || 0);

  if (palabras.length === 0) {
    return {
      total,
      palabras,
      resultados: candidatas
        .sort(porAnio)
        .map((norma) => ({ norma, puntaje: 0, coincidenciasTexto: 0, fraseTexto: 0 })),
    };
  }

  const conteos = await contarEnTexto(palabras);
  const exacta = palabras.map((w) => new RegExp(`(?<![a-z0-9])${escaparRegex(w)}(?![a-z0-9])`, "g"));
  const plural = palabras.map((w) => new RegExp(`(?<![a-z0-9])${escaparRegex(w)}(?:es|s)(?![a-z0-9])`, "g"));
  const frase = new RegExp(
    `(?<![a-z0-9])${palabras.map((w) => `${escaparRegex(w)}(?:es|s)?`).join("[^a-z0-9]{1,3}")}(?![a-z0-9])`,
    "g",
  );

  const resultados: Resultado[] = [];
  for (const n of candidatas) {
    const tema = normalizarTexto(n.tema);
    const temas = normalizarTexto(n.temas.join(" | "));
    const resumen = normalizarTexto(n.resumen ?? "");
    const ident = normalizarTexto(`${n.tipo === "ORD" ? "ordenanza ord" : "resolucion res"} ${n.numero} ${n.anio}`);
    const t = conteos.get(n.id);

    let puntaje = 0;
    let completa = true;
    palabras.forEach((_, i) => {
      const exTema = cuantas(tema, exacta[i]) > 0;
      const exTemas = cuantas(temas, exacta[i]) > 0;
      const exRes = cuantas(resumen, exacta[i]) > 0;
      const plMeta =
        cuantas(tema, plural[i]) + cuantas(temas, plural[i]) + cuantas(resumen, plural[i]) > 0;
      const enIdent = cuantas(ident, exacta[i]) > 0;
      const e = t?.e[i] ?? 0;
      const p = t?.p[i] ?? 0;

      if (!(exTema || exTemas || exRes || plMeta || enIdent || e > 0 || p > 0)) completa = false;
      if (enIdent) puntaje += 15;
      if (exTema) puntaje += 12;
      if (exTemas) puntaje += 12;
      if (exRes) puntaje += 8;
      if (!exTema && !exTemas && !exRes && plMeta) puntaje += 9; // plural: casi como exacta
      // Escala logarítmica y con tope: un documento enorme no gana solo por tamaño
      puntaje += Math.min(8, 2 * Math.log(1 + e) + 0.7 * Math.log(1 + p));
    });
    if (!completa) continue;

    if (palabras.length > 1) {
      if (cuantas(tema, frase) > 0) puntaje += 40;
      if (cuantas(temas, frase) > 0) puntaje += 40;
      if (cuantas(resumen, frase) > 0) puntaje += 30;
      const f = t?.f ?? 0;
      if (f > 0) puntaje += 25 + 8 * Math.log(1 + f);
    }

    const coincidenciasTexto = t ? t.e.reduce((a, x) => a + x, 0) + t.p.reduce((a, x) => a + x, 0) : 0;
    resultados.push({ norma: n, puntaje, coincidenciasTexto, fraseTexto: t?.f ?? 0 });
  }

  resultados.sort((a, b) => b.puntaje - a.puntaje || porAnio(a.norma, b.norma));
  return { total, palabras, resultados };
}
