import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

// Autor: super admin (Ezequiel) o el primer gestor disponible
const autor =
  (await p.usuario.findUnique({ where: { dni: "27345678" } })) ??
  (await p.usuario.findFirst({ where: { rol: "GESTOR_ENTE" } }));
if (!autor) {
  console.error("No hay autor disponible (super admin / gestor).");
  process.exit(1);
}

const titulo =
  "Audiencia Pública por solicitud de readecuación tarifaria SCPL";
const fecha = new Date("2026-05-27T10:00:00-03:00");
const inscripcionCierra = new Date("2026-05-22T15:00:00-03:00");
const publicadaEn = new Date("2026-05-15T00:00:00-03:00");

const convocatoriaTexto = `El Ente de Control de los Servicios Públicos (EnCoSeP) de la ciudad de Comodoro Rivadavia informa a la comunidad que se encuentra abierta la convocatoria para participar de la Audiencia Pública Temática, destinada al análisis del pedido de readecuación tarifaria solicitado para los servicios de distribución de energía eléctrica, alumbrado público, agua potable y cloacas.

El encuentro tendrá lugar el próximo miércoles 27 de mayo de 2026, a partir de las 10:00 horas, en las instalaciones del Auditorio del Centro Cultural, ubicado en la Avenida Hipólito Yrigoyen N° 99 de nuestra ciudad.

Información clave para la inscripción
Los interesados en participar u hacer uso de la palabra deberán inscribirse previamente. El plazo para el registro vence el viernes 22 de mayo de 2026 a las 15:00 hs.

Vías habilitadas para inscribirse:
• Presencial: En la sede del EnCoSeP, Pasaje Valdivia N° 435, de lunes a viernes de 08:00 a 15:00 hs.
• Digital: A través del correo electrónico oficial infoencosep@gmail.com o vía WhatsApp al 2974303051.
• Online: en este mismo portal del Ente, completando el formulario debajo.

Se comunica asimismo que los ciudadanos pueden tomar vista del expediente solicitando una copia en papel o mediante la entrega de un archivo digital (presentando un pendrive o vía correo electrónico). Este procedimiento se rige bajo lo estipulado en la Ordenanza N° 7034-1/02.

La participación es libre y gratuita. La inscripción es hasta 72 hrs hábiles previo a la realización de la audiencia pública. Cabe destacar que el orden de inscripción no determina el orden de exposición durante la audiencia.`;

const descripcion =
  "Análisis del pedido de readecuación tarifaria solicitado por la SCPL para los servicios de distribución de energía eléctrica, alumbrado público, agua potable y cloacas.";

const audiencia = await p.audienciaPublica.upsert({
  where: { id: "audiencia-readecuacion-scpl-2026" },
  update: {
    titulo,
    descripcion,
    fecha,
    lugar: "Auditorio del Centro Cultural · Av. Hipólito Yrigoyen 99 · Comodoro Rivadavia",
    modalidad: "PRESENCIAL",
    estado: "ABIERTA_INSCRIPCION",
    expedienteNumero: "Exp.014-2026",
    expedienteTitulo:
      "Readecuación Tarifaria SCPL — Energía Eléctrica, Alumbrado Público, Agua y Cloacas",
    expedienteUrl: "/audiencias/exp-014-2026-readecuacion-scpl.pdf",
    convocatoriaTexto,
    convocatoriaPublicadaEn: publicadaEn,
    inscripcionCierra,
    ordenDiaUrl: "/audiencias/orden-dia-27-05-2026.pdf",
  },
  create: {
    id: "audiencia-readecuacion-scpl-2026",
    titulo,
    descripcion,
    fecha,
    lugar: "Auditorio del Centro Cultural · Av. Hipólito Yrigoyen 99 · Comodoro Rivadavia",
    modalidad: "PRESENCIAL",
    estado: "ABIERTA_INSCRIPCION",
    expedienteNumero: "Exp.014-2026",
    expedienteTitulo:
      "Readecuación Tarifaria SCPL — Energía Eléctrica, Alumbrado Público, Agua y Cloacas",
    expedienteUrl: "/audiencias/exp-014-2026-readecuacion-scpl.pdf",
    convocatoriaTexto,
    convocatoriaPublicadaEn: publicadaEn,
    inscripcionCierra,
    ordenDiaUrl: "/audiencias/orden-dia-27-05-2026.pdf",
    autorId: autor.id,
  },
});

console.log("Audiencia cargada:");
console.log(`  ID: ${audiencia.id}`);
console.log(`  ${audiencia.titulo}`);
console.log(`  ${audiencia.expedienteNumero}`);
console.log(`  Fecha: ${audiencia.fecha.toISOString()}`);

await p.$disconnect();
