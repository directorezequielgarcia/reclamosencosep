import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const e = await p.expediente.deleteMany({
  where: { numero: { contains: "-T" } },
});
const r = await p.reclamo.deleteMany({
  where: { OR: [{ titulo: { contains: "test" } }, { titulo: { contains: "GPS (test)" } }] },
});
console.log("Expedientes de prueba borrados:", e.count);
console.log("Reclamos de prueba borrados:   ", r.count);
await p.$disconnect();
