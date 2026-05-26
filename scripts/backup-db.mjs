/**
 * Backup de la base de datos a un archivo SQL.
 *
 * Uso:
 *   node scripts/backup-db.mjs
 *
 * Genera: backup-encosep-YYYY-MM-DD.sql en la carpeta actual.
 * Recomendado: ejecutar semanalmente y subir el archivo a Google Drive
 * del Ente (carpeta "Resguardo Portal ENCOSEP").
 *
 * Requiere que DATABASE_URL_UNPOOLED esté seteada (.env).
 *
 * Cómo funciona: Prisma no incluye pg_dump nativo, así que el script
 * exporta TODAS las tablas como INSERT statements en orden de
 * dependencias. Es un dump funcional re-importable.
 */

import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const p = new PrismaClient();
const ahora = new Date();
const ts = ahora.toISOString().slice(0, 10);
const out = `backup-encosep-${ts}.sql`;

const esc = (v) => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "number") return String(v);
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

function dumpTable(nombre, filas) {
  if (filas.length === 0) return `-- Tabla "${nombre}" vacía\n\n`;
  const cols = Object.keys(filas[0]);
  let sql = `-- ${nombre} (${filas.length} filas)\n`;
  for (const f of filas) {
    const vals = cols.map((c) => esc(f[c]));
    sql += `INSERT INTO "${nombre}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${vals.join(", ")});\n`;
  }
  return sql + "\n";
}

console.log(`Generando backup → ${out}`);

let sql = `-- Backup Portal ENCOSEP — ${ahora.toISOString()}\n`;
sql += `-- Generado por scripts/backup-db.mjs\n`;
sql += `-- IMPORTANTE: este archivo contiene datos personales. Resguardar.\n\n`;

const tablas = [
  ["Servicio", await p.servicio.findMany()],
  ["Prestadora", await p.prestadora.findMany()],
  ["Usuario", await p.usuario.findMany()],
  ["Reclamo", await p.reclamo.findMany()],
  ["ReclamoEvento", await p.reclamoEvento.findMany()],
  ["Adjunto", await p.adjunto.findMany()],
  ["Expediente", await p.expediente.findMany()],
  ["ActoAdministrativo", await p.actoAdministrativo.findMany()],
  ["Documento", await p.documento.findMany()],
  ["Vencimiento", await p.vencimiento.findMany()],
  ["Boletin", await p.boletin.findMany()],
  ["AudienciaPublica", await p.audienciaPublica.findMany()],
  ["InscripcionAudiencia", await p.inscripcionAudiencia.findMany()],
  ["EncuestaServicios", await p.encuestaServicios.findMany()],
];

for (const [nombre, filas] of tablas) {
  sql += dumpTable(nombre, filas);
  console.log(`  ${nombre}: ${filas.length} filas`);
}

writeFileSync(out, sql, "utf8");
const bytes = (await import("node:fs")).statSync(out).size;
console.log(`\nOK: ${out} (${(bytes / 1024).toFixed(1)} KB)`);
console.log("Recomendado: subir este archivo a Google Drive del Ente.");

await p.$disconnect();
