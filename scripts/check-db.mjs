import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
try {
  const e = await p.expediente.count();
  const a = await p.actoAdministrativo.count();
  const r = await p.reclamo.count();
  console.log("Reclamo            :", r);
  console.log("Expediente         :", e);
  console.log("ActoAdministrativo :", a);
} finally {
  await p.$disconnect();
}
