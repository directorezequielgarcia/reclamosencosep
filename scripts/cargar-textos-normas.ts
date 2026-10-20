// Carga idempotente del texto completo (OCR de los PDF oficiales) en Norma.
// Lee un JSON {"<digestoId>": "texto"} y actualiza por digestoId las columnas
// `texto` y `textoBusqueda`. Se puede correr las veces que haga falta.
//
// Uso: npx tsx --env-file=.env scripts/cargar-textos-normas.ts [ruta-al-json]

import { existsSync, readFileSync } from "node:fs";
import { prisma } from "../lib/prisma";
import { limpiarTextoOcr, normalizarParaBusqueda } from "../lib/normativa";

const RUTA_DEFECTO =
  "C:/Users/gje_9/AppData/Local/Temp/claude/c--Users-gje-9-OneDrive-Documentos-Claude-md/1d3bad91-d003-4b14-a03f-6888fd18a82a/scratchpad/agua/textos_normas.json";
const MIN_CHARS = 200;

async function main() {
  const ruta = process.argv[2] ?? RUTA_DEFECTO;
  if (!existsSync(ruta)) {
    console.error("No existe el archivo de textos: " + ruta);
    process.exit(1);
  }
  const textos: Record<string, string> = JSON.parse(readFileSync(ruta, "utf-8"));

  let actualizadas = 0;
  let noEncontradas = 0;
  let bytes = 0;
  const cortas: string[] = [];
  for (const [id, crudo] of Object.entries(textos)) {
    const texto = limpiarTextoOcr(crudo ?? "");
    const norma = await prisma.norma.findFirst({ where: { digestoId: Number(id) } });
    if (!norma) {
      noEncontradas++;
      console.warn("Sin norma para digestoId " + id);
      continue;
    }
    if (texto.length < MIN_CHARS) {
      cortas.push(`${norma.tipo} ${norma.numero}/${norma.anio} (${texto.length} caracteres)`);
    }
    await prisma.norma.update({
      where: { id: norma.id },
      data: { texto: texto || null, textoBusqueda: texto ? normalizarParaBusqueda(texto) : null },
    });
    bytes += texto.length * 2; // texto + textoBusqueda
    actualizadas++;
  }

  const sinTexto = await prisma.norma.count({ where: { digestoId: { not: null }, texto: null } });
  console.log(`Textos en el JSON: ${Object.keys(textos).length}`);
  console.log(`Normas actualizadas: ${actualizadas} (digestoId sin norma: ${noEncontradas})`);
  console.log(`Normas del Digesto que quedaron sin texto: ${sinTexto}`);
  console.log(`Con texto muy corto (menos de ${MIN_CHARS} caracteres): ${cortas.length}`);
  cortas.forEach((c) => console.log("  - " + c));
  console.log(`Tamaño aproximado cargado: ${(bytes / 1024 / 1024).toFixed(1)} MB`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
