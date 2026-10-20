// Carga idempotente (upsert) del índice de Normativa del ENCOSEP.
// Fuentes: indice_normativa.json (171 fichas del Digesto Municipal) y el Excel
// "INDICE normativa servicios publicos.xlsx" (hoja 1: estado y derogaciones;
// hoja 2: documentos propios sin ficha en el Digesto). Se puede correr las
// veces que haga falta: la clave es (tipo, numero, anio).
//
// Uso: npx tsx --env-file=.env scripts/cargar-normas.ts

import { readFileSync } from "node:fs";
import ExcelJS from "exceljs";
import { prisma } from "../lib/prisma";
import type { EstadoNorma, TipoNorma } from "@prisma/client";

const DIR = "C:/Users/gje_9/Claude/01_ENCOSEP/Normativa ENCOSEP/";
const JSON_PATH = DIR + "indice_normativa.json";
const XLSX_PATH = DIR + "INDICE normativa servicios publicos.xlsx";
const URL_PDF = "https://www.digestocomodoro.gob.ar/verPDF.aspx?TIPO=NORMAS&ID=";

type FichaJson = {
  id: number;
  norma: string;
  publicacion: string;
  tema: string;
  servicios: string[];
  url: string;
};

// Claves de carpeta del JSON → valores guardados en Norma.servicios
const SERVICIO_POR_CARPETA: Record<string, string> = {
  "0_Marco_general_y_ENCOSEP": "marco",
  "1_Agua_y_cloacas": "agua",
  "2_Energia_y_alumbrado": "energia",
  "3_Transporte_colectivo": "transporte",
  "4_Taxis_y_remises": "taxis",
  "5_Higiene_urbana": "higiene",
  "6_Convenios_SCPL": "convenios_scpl",
};

// Nombres de servicio de la hoja 2 del Excel → mismos valores
const SERVICIO_POR_NOMBRE: Record<string, string> = {
  "marco general y encosep": "marco",
  "agua y cloacas": "agua",
  "transporte urbano": "transporte",
  "taxis y remises": "taxis",
  "higiene urbana": "higiene",
  "convenios scpl": "convenios_scpl",
};

type NormaKey = { tipo: TipoNorma; numero: string; anio: number };

const claveStr = (k: NormaKey) => `${k.tipo}|${k.numero}|${k.anio}`;
const etiqueta = (k: NormaKey) =>
  `${k.tipo === "ORD" ? "Ord." : "Res."} ${k.numero}/${k.anio}`;

function anio4(a: string): number {
  const n = Number(a);
  if (a.length === 4) return n;
  return n >= 50 ? 1900 + n : 2000 + n;
}

// "Ord. 14682/2019" → { ORD, "14682", 2019 }
function parseNorma(txt: string): NormaKey | null {
  const m = txt.match(/^(Ord|Res)\.?\s*([\d.]+(?:-\d+)?)\/(\d{2,4})$/i);
  if (!m) return null;
  return {
    tipo: m[1].toLowerCase() === "ord" ? "ORD" : "RES",
    numero: m[2].replace(/\./g, ""),
    anio: anio4(m[3]),
  };
}

// Normaliza referencias del Excel ("Ord 10270/2011") al formato "Ord. 10270/2011"
function normalizarRefs(txt: string | null): string | null {
  if (!txt) return null;
  return txt
    .split(";")
    .map((s) =>
      s.trim().replace(/^(Ord|Res)\.?\s*/i, (_, t: string) => `${t[0].toUpperCase()}${t.slice(1).toLowerCase()}. `),
    )
    .filter(Boolean)
    .join("; ");
}

// Extrae todas las normas mencionadas en el texto de un documento propio
// ("Res. 417/26, 1261/26 y 1562/25" → tres Res). Lo que viene después de
// "BOL" (boletines) se ignora. El prefijo Ord/Res se hereda al siguiente número.
function extraerNormas(texto: string): NormaKey[] {
  const corte = texto.split(/\bBOL\b/i)[0];
  const re = /(?:(Ord|Res)\.?\s*)?(\d[\d.]*(?:-\d+)?)\/(\d{2,4})/gi;
  const out: NormaKey[] = [];
  let prefijo: TipoNorma | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(corte))) {
    if (m[1]) prefijo = m[1].toLowerCase() === "ord" ? "ORD" : "RES";
    if (!prefijo) continue; // sin Ord/Res no es identificable (ej. "Exp. 014/2026")
    out.push({ tipo: prefijo, numero: m[2].replace(/\./g, ""), anio: anio4(m[3]) });
  }
  return out;
}

const celda = (v: ExcelJS.CellValue): string | null => {
  if (v == null) return null;
  const s = typeof v === "object" && "text" in v ? String(v.text) : String(v);
  return s.trim() || null;
};

async function main() {
  const fichas: FichaJson[] = JSON.parse(readFileSync(JSON_PATH, "utf-8"));

  // Detección de mojibake en el tema (cp1252 leído como UTF-8 → "Ã³" etc.)
  let mojibake = 0;
  let reparados = 0;
  const reparar = (s: string): string => {
    if (!/[ÃÂ\uFFFD]/.test(s)) return s;
    mojibake++;
    const r = Buffer.from(s, "latin1").toString("utf-8");
    if (!r.includes("\uFFFD")) {
      reparados++;
      return r;
    }
    return s;
  };

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX_PATH);

  // Hoja 1: estado y derogaciones por norma (hay varias filas por norma si
  // está en más de un servicio; se combinan)
  type Extra = {
    estado: EstadoNorma;
    derogadaPor: string | null;
    derogaA: string | null;
    archivoLocal: string | null;
  };
  const extra = new Map<string, Extra>();
  wb.worksheets[0].eachRow((row, n) => {
    if (n === 1) return;
    const k = parseNorma(celda(row.getCell(2).value) ?? "");
    if (!k) return;
    const prev = extra.get(claveStr(k));
    extra.set(claveStr(k), {
      estado: celda(row.getCell(5).value) === "DEROGADA" ? "DEROGADA" : "VIGENTE",
      derogadaPor: normalizarRefs(celda(row.getCell(6).value)) ?? prev?.derogadaPor ?? null,
      derogaA: normalizarRefs(celda(row.getCell(7).value)) ?? prev?.derogaA ?? null,
      archivoLocal: celda(row.getCell(8).value) ?? prev?.archivoLocal ?? null,
    });
  });

  // 1) Fichas del Digesto
  const claves = new Set<string>();
  let sinParsear = 0;
  for (const f of fichas) {
    const k = parseNorma(f.norma);
    if (!k) {
      sinParsear++;
      console.warn("Norma no interpretable:", f.norma);
      continue;
    }
    claves.add(claveStr(k));
    const e = extra.get(claveStr(k));
    const servicios = [...new Set(f.servicios.map((s) => SERVICIO_POR_CARPETA[s]).filter(Boolean))];
    const datos = {
      fechaPublicacionBO: f.publicacion || null,
      tema: reparar(f.tema).trim(),
      servicios,
      estado: e?.estado ?? ("VIGENTE" as EstadoNorma),
      derogadaPor: e?.derogadaPor ?? null,
      derogaA: e?.derogaA ?? null,
      urlFicha: f.url,
      urlPdf: URL_PDF + f.id,
      digestoId: f.id,
      archivoLocal: e?.archivoLocal ?? null,
    };
    await prisma.norma.upsert({
      where: { tipo_numero_anio: { tipo: k.tipo, numero: k.numero, anio: k.anio } },
      create: { ...k, ...datos },
      update: datos, // no pisa `notas`, que puede editarse a mano
    });
  }

  // 2) Documentos propios (hoja 2) con número identificable
  const cargadosPropios: string[] = [];
  const yaEnDigesto: string[] = [];
  const omitidos: string[] = [];
  const filas: { servicio: string | null; doc: string; carpeta: string | null; obs: string | null }[] = [];
  wb.worksheets[1].eachRow((row, n) => {
    if (n === 1) return;
    filas.push({
      servicio: celda(row.getCell(1).value),
      doc: celda(row.getCell(2).value) ?? "",
      carpeta: celda(row.getCell(3).value),
      obs: celda(row.getCell(4).value),
    });
  });
  for (const f of filas) {
    const normas = extraerNormas(f.doc);
    if (normas.length === 0) {
      omitidos.push(f.doc);
      continue;
    }
    const servicio = SERVICIO_POR_NOMBRE[(f.servicio ?? "").toLowerCase()];
    for (const k of normas) {
      if (claves.has(claveStr(k))) {
        yaEnDigesto.push(`${etiqueta(k)} (en "${f.doc}")`);
        continue;
      }
      const datos = {
        tema: f.doc,
        servicios: servicio ? [servicio] : [],
        archivoLocal: f.carpeta,
        notas: ["Documento propio, sin ficha en el Digesto.", f.obs].filter(Boolean).join(" "),
      };
      await prisma.norma.upsert({
        where: { tipo_numero_anio: { tipo: k.tipo, numero: k.numero, anio: k.anio } },
        create: { ...k, ...datos },
        update: datos,
      });
      cargadosPropios.push(etiqueta(k));
    }
  }

  const total = await prisma.norma.count();
  const conDigesto = await prisma.norma.count({ where: { digestoId: { not: null } } });
  const derogadas = await prisma.norma.count({ where: { estado: "DEROGADA" } });
  console.log(`Fichas del JSON: ${fichas.length} (no interpretables: ${sinParsear})`);
  console.log(`Temas con mojibake detectado: ${mojibake} (reparados: ${reparados}, sin reparar: ${mojibake - reparados})`);
  console.log(`Documentos propios cargados (${cargadosPropios.length}): ${cargadosPropios.join(", ")}`);
  console.log(`Documentos propios que ya estaban en el Digesto (${yaEnDigesto.length}): ${yaEnDigesto.join(" | ")}`);
  console.log(`Documentos propios omitidos por no tener número identificable (${omitidos.length}):`);
  omitidos.forEach((o) => console.log("  - " + o));
  console.log(`Tabla Norma: ${total} filas (${conDigesto} con digestoId, ${derogadas} derogadas)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
