// Carga idempotente de los resúmenes de las normas (generados por lotes).
// Lee todos los resumenes_lote*.json de la carpeta de lotes (o los archivos /
// carpeta que se pasen por argumento) y actualiza por digestoId: resumen,
// puntosClave, aplicaAlEnte, temas y calidadTexto. Valida la forma de cada
// objeto y descarta los inválidos (los lista). Se puede correr las veces que
// haga falta.
//
// Cada archivo es una lista de objetos:
//   { digestoId: number, resumen: string, puntosClave: string[],
//     aplicaAlEnte: string, temas: string[], calidadTexto: "buena"|"regular"|"mala" }
//
// Uso: npx tsx --env-file=.env scripts/cargar-resumenes-normas.ts [carpeta-o-archivo ...]

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const CARPETA_DEFECTO =
  "C:/Users/gje_9/AppData/Local/Temp/claude/c--Users-gje-9-OneDrive-Documentos-Claude-md/1d3bad91-d003-4b14-a03f-6888fd18a82a/scratchpad/agua/lotes";

const Resumen = z.object({
  digestoId: z.coerce.number().int().positive(),
  resumen: z.string().trim().min(1),
  puntosClave: z.array(z.string().trim().min(1)),
  aplicaAlEnte: z.string().trim(),
  temas: z.array(z.string().trim().min(1)),
  calidadTexto: z.enum(["buena", "regular", "mala"]),
});

// Junta los archivos resumenes_lote*.json (un nivel de subcarpetas: lote1/, lote2/...)
function buscarArchivos(ruta: string): string[] {
  if (!existsSync(ruta)) return [];
  if (statSync(ruta).isFile()) return [ruta];
  const out: string[] = [];
  for (const nombre of readdirSync(ruta)) {
    const p = join(ruta, nombre);
    if (statSync(p).isDirectory()) out.push(...buscarArchivos(p));
    else if (/^resumenes_lote.*\.json$/i.test(nombre)) out.push(p);
  }
  return out;
}

async function main() {
  const rutas = process.argv.slice(2);
  const archivos = (rutas.length > 0 ? rutas : [CARPETA_DEFECTO]).flatMap(buscarArchivos).sort();
  if (archivos.length === 0) {
    console.error("No se encontraron archivos resumenes_lote*.json");
    process.exit(1);
  }

  let leidos = 0;
  let actualizadas = 0;
  const invalidos: string[] = [];
  const sinNorma: number[] = [];
  const vistos = new Set<number>();
  for (const archivo of archivos) {
    let lista: unknown;
    try {
      lista = JSON.parse(readFileSync(archivo, "utf-8"));
    } catch (e) {
      invalidos.push(`${archivo}: JSON ilegible (${(e as Error).message})`);
      continue;
    }
    if (!Array.isArray(lista)) {
      invalidos.push(`${archivo}: no es una lista`);
      continue;
    }
    for (const [i, item] of lista.entries()) {
      leidos++;
      const r = Resumen.safeParse(item);
      if (!r.success) {
        invalidos.push(`${archivo} #${i}: ${r.error.issues.map((x) => x.path.join(".") + " " + x.message).join("; ")}`);
        continue;
      }
      const d = r.data;
      vistos.add(d.digestoId);
      const res = await prisma.norma.updateMany({
        where: { digestoId: d.digestoId },
        data: {
          resumen: d.resumen,
          puntosClave: d.puntosClave,
          aplicaAlEnte: d.aplicaAlEnte,
          temas: d.temas,
          calidadTexto: d.calidadTexto,
        },
      });
      if (res.count === 0) sinNorma.push(d.digestoId);
      else actualizadas += res.count;
    }
  }

  const conResumen = await prisma.norma.count({ where: { resumen: { not: null } } });
  const sinResumen = await prisma.norma.findMany({
    where: { digestoId: { not: null }, resumen: null },
    orderBy: [{ anio: "desc" }, { numero: "desc" }],
    select: { tipo: true, numero: true, anio: true, digestoId: true },
  });
  console.log(`Archivos leídos: ${archivos.length}. Objetos: ${leidos}. Normas actualizadas: ${actualizadas}`);
  console.log(`Inválidos (${invalidos.length}):`);
  invalidos.forEach((x) => console.log("  - " + x));
  console.log(`digestoId sin norma en la base (${sinNorma.length}): ${sinNorma.join(", ")}`);
  console.log(`Normas con resumen: ${conResumen}`);
  console.log(`Normas del Digesto SIN resumen (${sinResumen.length}):`);
  sinResumen.forEach((n) => console.log(`  - ${n.tipo} ${n.numero}/${n.anio} (digestoId ${n.digestoId})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
