import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const autor =
  (await p.usuario.findUnique({ where: { dni: "27345678" } })) ??
  (await p.usuario.findFirst({ where: { rol: "GESTOR_ENTE" } }));
if (!autor) {
  console.error("No hay autor disponible (super admin / gestor).");
  process.exit(1);
}

const titulo = "EnCoSeP controló en la calle el nuevo servicio de colectivos";

const resumen =
  "El 5 de agosto nos reunimos con el Secretario de Transporte y el Secretario de Gobierno y les llevamos los reclamos de los vecinos. Ahora elaboramos un informe técnico sobre regularidad, zonas, líneas y malestares para perfeccionar el servicio.";

const cuerpo = `El 5 de agosto, el Directorio del ENCOSEP se reunió con el Secretario de Transporte y el Secretario de Gobierno para hacer un balance del nuevo sistema de transporte público. En ese encuentro le llevamos los reclamos recibidos hasta la fecha —más de 400, por WhatsApp y por la página del Ente— señalando los puntos concretos que los vecinos vienen notando.

Además, salimos a controlar en terreno: inspeccionamos unidades en la calle (estado de los colectivos, cumplimiento de las paradas, atención a los pasajeros) y viajamos en la Línea 5 Universidad para probar el servicio en primera persona.

¿Qué encontramos? Los colectivos revisados estaban en buen estado, con la calefacción funcionando bien, y se respetaron las normas de tránsito. También detectamos falta de cartelería en algunas paradas y carteles de línea apagados dentro de los colectivos.

Ahora estamos elaborando un informe técnico sobre la regularidad del servicio, cruzando los reclamos por zona, por línea y por tipo de malestar, para perfeccionar el sistema junto a la Subsecretaría de Transporte.

Recordá que el sistema está en implementación reciente y que el recorrido cambió: no es igual al que tenía Patagonia. Por eso es importante que revises tu línea en el mapa interactivo antes de viajar.

Si a vos te sigue pasando algo, seguí contándonos — cuantos más reclamos ordenados recibamos, más rápido podemos exigir que se solucione.`;

const boletin = await p.boletin.upsert({
  where: { id: "boletin-fiscalizacion-transporte-2026-08-06" },
  update: {
    tipo: "COMUNICADO",
    titulo,
    resumen,
    cuerpo,
    fuente: "encosepcomodoro.gob.ar",
    enlaceExterno:
      "https://encosepcomodoro.gob.ar/index.php/noticias2/95-noticias-transporte/251-encosep-fiscaliza-el-juego-sistema-de-transporte-publico-y-refuerza-la-articulacion-institucional",
    fechaPublicacion: new Date("2026-08-06T10:00:00-03:00"),
    publicado: true,
  },
  create: {
    id: "boletin-fiscalizacion-transporte-2026-08-06",
    tipo: "COMUNICADO",
    titulo,
    resumen,
    cuerpo,
    fuente: "encosepcomodoro.gob.ar",
    enlaceExterno:
      "https://encosepcomodoro.gob.ar/index.php/noticias2/95-noticias-transporte/251-encosep-fiscaliza-el-juego-sistema-de-transporte-publico-y-refuerza-la-articulacion-institucional",
    fechaPublicacion: new Date("2026-08-06T10:00:00-03:00"),
    publicado: true,
    autorId: autor.id,
  },
});

console.log("Boletín cargado:");
console.log(`  ID: ${boletin.id}`);
console.log(`  ${boletin.titulo}`);
console.log(`  Fecha: ${boletin.fechaPublicacion.toISOString()}`);

await p.$disconnect();
