// Da de alta la prestadora SOL BUS (Grupo MR S.R.L.) para el servicio de Transporte.
// No borra ni modifica PATAGONIA ARGENTINA S.R.L.: se agrega como prestadora adicional.
// Idempotente: se puede correr varias veces sin duplicar.

import { PrismaClient, ServicioKind } from "@prisma/client";

const CUIT_SOLBUS = "30-71000000-4"; // marcador, ajustar con CUIT real de Grupo MR S.R.L.

const p = new PrismaClient();

const transporte = await p.servicio.findUnique({
  where: { kind: ServicioKind.TRANSPORTE },
});
if (!transporte) {
  console.error("No encontré el servicio TRANSPORTE. Corré npm run db:seed primero.");
  process.exit(1);
}

const solbus = await p.prestadora.upsert({
  where: { cuit: CUIT_SOLBUS },
  update: {},
  create: {
    razonSocial: "GRUPO MR S.R.L. (SOL BUS)",
    cuit: CUIT_SOLBUS,
    servicios: { connect: [{ id: transporte.id }] },
  },
});

console.log("Prestadora SOL BUS lista:");
console.log("  id:          " + solbus.id);
console.log("  razonSocial: " + solbus.razonSocial);
console.log("  cuit:        " + solbus.cuit + " (marcador, ajustar con CUIT real)");

await p.$disconnect();
