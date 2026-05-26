import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
try {
  const u = await p.servicio.update({
    where: { kind: "AGUA" },
    data: {
      nombre: "Agua y Saneamiento",
      nombreCorto: "Agua y Saneamiento",
    },
  });
  console.log("Actualizado:", u);
  const all = await p.servicio.findMany({ orderBy: { kind: "asc" } });
  console.log("\nEstado final:");
  for (const s of all) console.log(`  ${s.kind}: "${s.nombreCorto}"`);
} finally {
  await p.$disconnect();
}
