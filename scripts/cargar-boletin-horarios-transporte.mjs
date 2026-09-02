import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const autor =
  (await p.usuario.findUnique({ where: { dni: "27345678" } })) ??
  (await p.usuario.findFirst({ where: { rol: "GESTOR_ENTE" } }));
if (!autor) {
  console.error("No hay autor disponible (super admin / gestor).");
  process.exit(1);
}

const id = "boletin-horarios-recorridos-solbus-2026-09-01";

const titulo = "Ya podés consultar los horarios y recorridos de Sol Bus";

const resumen =
  "Sumamos al Portal el horario de primer y último servicio por línea, y el recorrido oficial de cada una, para que sepas antes de salir a esperar el colectivo.";

const cuerpo = `A partir de ahora, en la sección de Transporte del Portal vas a encontrar el horario de primer y último servicio de cada línea urbana, además del recorrido oficial de ida y vuelta.

La información sale del mismo relevamiento georreferenciado que usamos para ubicar tu reclamo en el mapa, así que se va actualizando a medida que se confirman cambios de recorrido o de frecuencia.

También dejamos disponible un PDF descargable con los horarios completos de todas las líneas, por si preferís guardarlo en el celular para consultarlo sin conexión.

Si el horario o el recorrido de tu línea no coincide con lo que ves en la calle, seguí contándonos — cada reclamo con el dato concreto (línea, horario, recorrido) nos ayuda a exigirle a la prestataria que cumpla lo pactado en el pliego.`;

const boletin = await p.boletin.upsert({
  where: { id },
  update: {
    tipo: "COMUNICADO",
    titulo,
    resumen,
    cuerpo,
    servicio: "TRANSPORTE",
    fechaPublicacion: new Date(),
    publicado: true,
  },
  create: {
    id,
    tipo: "COMUNICADO",
    titulo,
    resumen,
    cuerpo,
    servicio: "TRANSPORTE",
    fechaPublicacion: new Date(),
    publicado: true,
    autorId: autor.id,
  },
});

console.log("Boletín cargado:");
console.log(`  ID: ${boletin.id}`);
console.log(`  ${boletin.titulo}`);
console.log(`  Fecha: ${boletin.fechaPublicacion.toISOString()}`);

await p.$disconnect();
