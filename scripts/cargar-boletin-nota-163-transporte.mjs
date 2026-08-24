import { PrismaClient } from "@prisma/client";
import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";

const p = new PrismaClient();

const autor =
  (await p.usuario.findUnique({ where: { dni: "27345678" } })) ??
  (await p.usuario.findFirst({ where: { rol: "GESTOR_ENTE" } }));
if (!autor) {
  console.error("No hay autor disponible (super admin / gestor).");
  process.exit(1);
}

const id = "boletin-nota-163-transporte-2026-08-19";

// Sin BLOB_READ_WRITE_TOKEN disponible localmente: se copia a public/uploads
// (mismo fallback que guardarFotoBoletin en lib/uploads.ts) y se fuerza el
// commit pese al .gitignore (es 1 solo PDF institucional, no contenido
// generado por usuarios), para que Vercel lo sirva como asset del deploy.
const pdfPath =
  "C:/Users/gje_9/Claude/01_ENCOSEP/CONTRATO MR/Nota EnCoSeP N° 163-2026 Subsec. de Ser. Pub. ref solicita info. sobre transp. pub. de pasajeros_organized.pdf";
const nombreArchivo = "nota-encosep-163-2026-transporte.pdf";
const destDir = path.join(process.cwd(), "public", "uploads", "boletines", id);
await mkdir(destDir, { recursive: true });
await copyFile(pdfPath, path.join(destDir, nombreArchivo));
const archivoUrl = `/uploads/boletines/${id}/${nombreArchivo}`;
console.log("PDF copiado a:", archivoUrl);

const titulo = "Pedimos información oficial sobre el nuevo transporte (Sol Bus)";

const resumen =
  "Presentamos ante la Subsecretaría de Servicios Públicos una nota solicitando información oficial sobre recorridos, frecuencias, paradas y horarios del nuevo servicio, junto con el detalle de los reclamos que recibimos.";

const cuerpo = `El 19 de agosto de 2026 presentamos ante la Subsecretaría de Servicios Públicos (con copia a la Subsecretaría de Transporte) la Nota EnCoSeP N° 163/2026, solicitando que se nos remita en forma oficial la información y documentación sobre la entrada en vigencia del nuevo contrato de transporte público de pasajeros a cargo de Grupo MR (Sol Bus).

Presentamos este pedido por el fuerte incremento de reclamos, consultas y pedidos de los vecinos, motivados por la incertidumbre sobre cómo está funcionando actualmente el servicio. Puntualmente, requerimos:

Copia del Acta de Inicio del servicio.

El diagrama oficial de recorridos y frecuencias de cada línea.

El detalle de las paradas asignadas a cada recorrido.

La grilla horaria oficial por línea (o, en su defecto, los parámetros mínimos y máximos de frecuencia exigidos por el pliego).

La fecha prevista de habilitación de las páginas y aplicaciones digitales, tanto de la prestataria como del Municipio.

Junto con la nota, acompañamos un desglose de los principales reclamos que recibimos por el Portal: demoras y falta de frecuencia, falta de señalización en las paradas, la caída de la página de Sol Bus, la falta de información sobre el boleto combinado, unidades detenidas sin circular, el riesgo generado por las paradas frente al Consorcio Torraca (Pellegrini) y la situación de la comunidad educativa de la Escuela de Arte.

Vamos a seguir informando las novedades a medida que la Municipalidad y la prestataria nos den respuesta. Podés ver la nota completa en el archivo adjunto.

Si todavía no cargaste tu reclamo o te sigue pasando algo, contanos por el Portal — cada reclamo ordenado nos ayuda a exigir respuestas concretas.`;

const boletin = await p.boletin.upsert({
  where: { id },
  update: {
    tipo: "COMUNICADO",
    titulo,
    resumen,
    cuerpo,
    archivoUrl,
    servicio: "TRANSPORTE",
    fechaPublicacion: new Date("2026-08-19T18:00:00-03:00"),
    publicado: true,
  },
  create: {
    id,
    tipo: "COMUNICADO",
    titulo,
    resumen,
    cuerpo,
    archivoUrl,
    servicio: "TRANSPORTE",
    fechaPublicacion: new Date("2026-08-19T18:00:00-03:00"),
    publicado: true,
    autorId: autor.id,
  },
});

console.log("Boletín cargado:");
console.log(`  ID: ${boletin.id}`);
console.log(`  ${boletin.titulo}`);
console.log(`  archivoUrl: ${boletin.archivoUrl}`);
console.log(`  Fecha: ${boletin.fechaPublicacion.toISOString()}`);

await p.$disconnect();
