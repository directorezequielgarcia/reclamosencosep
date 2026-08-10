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

const id = "boletin-nota-154-transporte-2026-08-10";

// Sin BLOB_READ_WRITE_TOKEN disponible localmente: se copia a public/uploads
// (mismo fallback que guardarFotoBoletin en lib/uploads.ts) y se fuerza el
// commit pese al .gitignore (es 1 solo PDF institucional, no contenido
// generado por usuarios), para que Vercel lo sirva como asset del deploy.
const pdfPath =
  "C:/Users/gje_9/Claude/01_ENCOSEP/TRansporte/Nota EnCoSeP N 154-2026 Subsecretaria Transporte - PUBLICA (sin anexos).pdf";
const nombreArchivo = "nota-encosep-154-2026-transporte.pdf";
const destDir = path.join(process.cwd(), "public", "uploads", "boletines", id);
await mkdir(destDir, { recursive: true });
await copyFile(pdfPath, path.join(destDir, nombreArchivo));
const archivoUrl = `/uploads/boletines/${id}/${nombreArchivo}`;
console.log("PDF copiado a:", archivoUrl);

const titulo = "Llevamos tus reclamos a la MCR";

const resumen =
  "Presentamos ante la Subsecretaría de Transporte una nota con los reclamos que recibimos durante la primera semana de Sol Bus, agrupados por tipo, y una propuesta de mejora para el servicio.";

const cuerpo = `Durante la primera semana del nuevo servicio de transporte urbano a cargo de Sol Bus, recibimos a través del Portal de Reclamos de EnCoSeP más de 300 reclamos de vecinos. Los agrupamos por tipo de problema y, con ese detalle, el 10 de agosto presentamos ante la Subsecretaría de Transporte de la Municipalidad (Nota EnCoSeP N° 154/2026) una serie de propuestas de mejora.

Los principales puntos que planteamos:

Frecuencia: pedimos reforzar la flota en los horarios pico, para que la espera no supere los 30 minutos, y garantizar que el primer servicio de la madrugada y los horarios de cambio de turno escolar se cumplan.

Señalización de paradas y líneas: solicitamos una comunicación general y contundente de los cambios de recorrido, señalización física en cada parada con QR y horarios, y que se retire la cartelería de las paradas que ya no tienen servicio.

Fallas en las aplicaciones web de Sol Bus y del Municipio: pedimos que ambas páginas muestren la misma información y que se avise cuando alguna esté caída.

Conducta de los choferes: reclamamos fiscalización permanente sobre el cumplimiento del recorrido, la señalización y el respeto por las paradas, incluyendo el descenso por la puerta delantera para personas con movilidad reducida o discapacidad.

También elevamos reclamos puntuales de barrios y zonas específicas (Malvinas Argentinas, Tres Pinos, Cordón Forestal, Bella Vista, Av. Tehuelche, entre otros), pedidos de información sobre distintas líneas, la fecha prevista del boleto combinado, y cuestiones de infraestructura para los choferes en los centros de transferencia.

En todos los casos, el objetivo es el mismo: garantizar que el transporte público sea un servicio continuo, general y uniforme para todos los vecinos de Comodoro Rivadavia, más allá del cambio de prestadora.

Le pedimos a la Subsecretaría que informe periódicamente las acciones correctivas que se vayan implementando. Podés ver la nota completa que presentamos en el archivo adjunto.

Si todavía no cargaste tu reclamo o te sigue pasando algo, contanos por el Portal — cada reclamo ordenado nos ayuda a exigir mejoras concretas.`;

const boletin = await p.boletin.upsert({
  where: { id },
  update: {
    tipo: "COMUNICADO",
    titulo,
    resumen,
    cuerpo,
    archivoUrl,
    servicio: "TRANSPORTE",
    fechaPublicacion: new Date("2026-08-10T18:30:00-03:00"),
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
    fechaPublicacion: new Date("2026-08-10T18:30:00-03:00"),
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
