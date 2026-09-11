import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const reclamos = await p.reclamo.findMany({
  where: { servicio: { kind: "ENERGIA" } },
  select: {
    codigo: true,
    titulo: true,
    descripcion: true,
    estado: true,
    createdAt: true,
    direccion: true,
    barrio: true,
    ciudadano: { select: { dni: true } },
    adjuntos: { select: { id: true, tipo: true, url: true } },
    prestadora: { select: { razonSocial: true } },
  },
  orderBy: { createdAt: "desc" },
});

console.log(`Total reclamos de Electricidad (ENERGIA): ${reclamos.length}\n`);

const mencionaFactura = (r) =>
  /factur/i.test(r.titulo) || /factur/i.test(r.descripcion);
const conAdjuntos = (r) => r.adjuntos.length > 0;

const relevantes = reclamos.filter((r) => mencionaFactura(r) || conAdjuntos(r));

console.log(`Reclamos que mencionan "factura" en título/descripción o tienen adjuntos subidos: ${relevantes.length}\n`);

for (const r of relevantes) {
  console.log(`── ${r.codigo} — ${r.estado} — ${r.createdAt.toISOString().slice(0, 10)}`);
  console.log(`   Título: ${r.titulo}`);
  console.log(`   Menciona "factura": ${mencionaFactura(r) ? "SÍ" : "no"} | Adjuntos: ${r.adjuntos.length} (${r.adjuntos.map((a) => a.tipo).join(", ") || "-"})`);
  console.log(`   Dirección: ${r.direccion}${r.barrio ? " — " + r.barrio : ""}`);
  console.log(`   DNI: ${r.ciudadano?.dni ?? "-"}  |  Prestadora: ${r.prestadora?.razonSocial ?? "-"}`);
  console.log(`   Descripción: ${r.descripcion.slice(0, 200)}${r.descripcion.length > 200 ? "…" : ""}`);
  console.log("");
}

await p.$disconnect();
