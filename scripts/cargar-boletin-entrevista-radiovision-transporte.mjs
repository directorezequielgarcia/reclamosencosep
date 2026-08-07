import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const autor =
  (await p.usuario.findUnique({ where: { dni: "27345678" } })) ??
  (await p.usuario.findFirst({ where: { rol: "GESTOR_ENTE" } }));
if (!autor) {
  console.error("No hay autor disponible (super admin / gestor).");
  process.exit(1);
}

const titulo =
  'EnCoSeP en los medios: "El municipio sigue evidenciando problemas de planificación"';

const resumen =
  "Radiovisión 99.5 entrevistó al Vicepresidente del EnCoSeP sobre las fallas del nuevo sistema de transporte: recorridos incumplidos, horarios que no se cumplen y paradas mal ubicadas.";

const cuerpo = `El programa de Radiovisión 99.5 FM entrevistó al Vicepresidente del EnCoSeP, quien cuestionó la falta de previsión del municipio en la implementación del nuevo sistema de transporte público: recorridos que no se cumplen, horarios anunciados que no se respetan y paradas mal ubicadas, que obligan a los vecinos a improvisar cómo llegar al trabajo o al estudio.

Señaló que, frente a otros problemas de la ciudad como los turnos médicos o el paro escolar, tampoco se resuelven cuestiones básicas de movilidad y servicio. Indicó que el Ente viene recibiendo cientos de reclamos por esta situación, y adelantó el desarrollo de una nueva aplicación web para ordenar y hacer seguimiento de las denuncias de los vecinos.`;

const boletin = await p.boletin.upsert({
  where: { id: "boletin-entrevista-radiovision-transporte-2026-08-05" },
  update: {
    tipo: "CLIPPING",
    titulo,
    resumen,
    cuerpo,
    fuente: "Radiovisión 99.5 FM",
    enlaceExterno:
      "https://www.facebook.com/radiovision995/posts/ezequiel-garc%C3%ADa-el-municipio-sigue-evidenciando-problemas-de-planificaci%C3%B3n-ezequ/1682580386666599/",
    videoUrl: "https://youtu.be/kO-YM-asoaA",
    fechaPublicacion: new Date("2026-08-05T10:00:00-03:00"),
    publicado: true,
  },
  create: {
    id: "boletin-entrevista-radiovision-transporte-2026-08-05",
    tipo: "CLIPPING",
    titulo,
    resumen,
    cuerpo,
    fuente: "Radiovisión 99.5 FM",
    enlaceExterno:
      "https://www.facebook.com/radiovision995/posts/ezequiel-garc%C3%ADa-el-municipio-sigue-evidenciando-problemas-de-planificaci%C3%B3n-ezequ/1682580386666599/",
    videoUrl: "https://youtu.be/kO-YM-asoaA",
    fechaPublicacion: new Date("2026-08-05T10:00:00-03:00"),
    publicado: true,
    autorId: autor.id,
  },
});

console.log("Boletín cargado:");
console.log(`  ID: ${boletin.id}`);
console.log(`  ${boletin.titulo}`);
console.log(`  Video: ${boletin.videoUrl}`);

await p.$disconnect();
