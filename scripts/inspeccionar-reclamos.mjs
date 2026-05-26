import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const todos = await p.reclamo.findMany({
  orderBy: { createdAt: "asc" },
  select: {
    codigo: true,
    titulo: true,
    direccion: true,
    barrio: true,
    lat: true,
    lng: true,
    estado: true,
    createdAt: true,
  },
});

console.log(`Total reclamos: ${todos.length}\n`);
console.log("CODIGO   GPS  DIR                                                TITULO");
console.log("─".repeat(120));
for (const r of todos) {
  const gps = r.lat !== null && r.lng !== null ? "✓" : " ";
  const dir = (r.direccion ?? "").slice(0, 50).padEnd(50);
  const tit = (r.titulo ?? "").slice(0, 50);
  console.log(`${r.codigo.padEnd(8)} ${gps}    ${dir}  ${tit}`);
}

await p.$disconnect();
