// Desactiva PATAGONIA ARGENTINA S.R.L. (reemplazada por SOL BUS desde el
// 1/8/2026): deja de aparecer en los selectores de prestadora activa para
// nuevos reclamos/expedientes/inspecciones, sin borrar la fila ni tocar
// sus reclamos y operadores ya existentes (se conserva el historial).
// Idempotente: se puede correr varias veces sin efecto adicional.

import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const patagonia = await p.prestadora.findFirst({
  where: { razonSocial: { contains: "PATAGONIA" } },
});
if (!patagonia) {
  console.error("No encontré la prestadora PATAGONIA en la base.");
  process.exit(1);
}

const actualizada = await p.prestadora.update({
  where: { id: patagonia.id },
  data: { activa: false },
});

const reclamos = await p.reclamo.count({ where: { prestadoraId: patagonia.id } });

console.log("PATAGONIA desactivada:");
console.log("  id:          " + actualizada.id);
console.log("  razonSocial: " + actualizada.razonSocial);
console.log("  activa:      " + actualizada.activa);
console.log("  reclamos históricos conservados: " + reclamos);

await p.$disconnect();
