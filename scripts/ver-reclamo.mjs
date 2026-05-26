import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const reclamos = await p.reclamo.findMany({
  orderBy: { createdAt: "desc" },
  take: 3,
  include: { servicio: true, ciudadano: { select: { nombre: true, apellido: true, dni: true, email: true } } },
});

for (const r of reclamos) {
  console.log("─".repeat(80));
  console.log(`Código: ${r.codigo}`);
  console.log(`Servicio: ${r.servicio.nombre}`);
  console.log(`Vecino: ${r.ciudadano.nombre} ${r.ciudadano.apellido} (DNI ${r.ciudadano.dni}, email ${r.ciudadano.email ?? "—"})`);
  console.log(`Título: ${r.titulo}`);
  console.log(`Dirección: ${r.direccion}`);
  console.log(`Barrio: ${r.barrio ?? "—"}`);
  console.log(`Lat/Lng: ${r.lat}, ${r.lng}`);
  console.log(`Estado: ${r.estado}`);
  console.log(`Creado: ${r.createdAt.toISOString()}`);
}

await p.$disconnect();
