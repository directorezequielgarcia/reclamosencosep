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
  "Audiencia Pública Temática — Readecuación Tarifaria Nota N° 1746/2026 (Energía y Alumbrado Público)";

const descripcion =
  "Análisis del pedido de readecuación tarifaria de la SCPL para los servicios de distribución de Energía Eléctrica y Alumbrado Público, tramitado por Nota N° 1746/2026 (a diferencia del Exp. N° 014/2026, ya resuelto). 27 ciudadanos inscriptos para exponer (2 de forma virtual).";

const fecha = new Date("2026-07-06T09:00:00-03:00");

const audiencia = await p.audienciaPublica.upsert({
  where: { id: "audiencia-nota-1746-2026" },
  update: {
    titulo,
    descripcion,
    fecha,
    lugar:
      "Centro de Exposición y Promoción Turística (CEPTUR) · Av. Hipólito Yrigoyen 225 · Comodoro Rivadavia",
    modalidad: "HIBRIDA",
    estado: "REALIZADA",
    expedienteNumero: "Nota N° 1746/2026",
    expedienteTitulo:
      "Readecuación Tarifaria SCPL — Energía Eléctrica y Alumbrado Público (Nota N° 1746/2026)",
    expedienteUrl: "/audiencias/nota-1746-26-readecuacion-tarifaria.pdf",
    videoUrl: "https://www.youtube.com/watch?v=KYKOSpLxXrY",
    realizadaEn: new Date(),
  },
  create: {
    id: "audiencia-nota-1746-2026",
    titulo,
    descripcion,
    fecha,
    lugar:
      "Centro de Exposición y Promoción Turística (CEPTUR) · Av. Hipólito Yrigoyen 225 · Comodoro Rivadavia",
    modalidad: "HIBRIDA",
    estado: "REALIZADA",
    expedienteNumero: "Nota N° 1746/2026",
    expedienteTitulo:
      "Readecuación Tarifaria SCPL — Energía Eléctrica y Alumbrado Público (Nota N° 1746/2026)",
    expedienteUrl: "/audiencias/nota-1746-26-readecuacion-tarifaria.pdf",
    videoUrl: "https://www.youtube.com/watch?v=KYKOSpLxXrY",
    realizadaEn: new Date(),
    autorId: autor.id,
  },
});

console.log("Audiencia cargada:");
console.log(`  ID: ${audiencia.id}`);
console.log(`  ${audiencia.titulo}`);
console.log(`  ${audiencia.expedienteNumero}`);
console.log(`  Fecha: ${audiencia.fecha.toISOString()}`);
console.log(`  Video: ${audiencia.videoUrl}`);

await p.$disconnect();
