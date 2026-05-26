import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const p = new PrismaClient();

// Buscar las prestadoras por nombre. Los CUIT del seed son marcadores
// temporales (esperando los reales). Usamos esos mismos números sin
// guiones como identificador del operador.
const prestadoras = await p.prestadora.findMany();
const buscar = (n) => prestadoras.find((p) => p.razonSocial.toUpperCase().includes(n));

const clear     = buscar("CLEAR");
const patagonia = buscar("PATAGONIA");
const diadema   = buscar("DIADEMA");

if (!clear || !patagonia || !diadema) {
  console.error("Faltan prestadoras en la DB. Encontradas:", prestadoras.map((p) => p.razonSocial));
  process.exit(1);
}

// CUIT sin guiones (placeholder hasta tener los reales)
const operadores = [
  {
    prestadora: clear,
    identificador: clear.cuit ? clear.cuit.replace(/\D/g, "") : "30710000001",
    nombre: "Operador",
    apellido: "Clear Urbana",
    claveTemporal: "clear-2026",
  },
  {
    prestadora: patagonia,
    identificador: patagonia.cuit ? patagonia.cuit.replace(/\D/g, "") : "30710000002",
    nombre: "Operador",
    apellido: "Patagonia",
    claveTemporal: "patagonia-2026",
  },
  {
    prestadora: diadema,
    identificador: diadema.cuit ? diadema.cuit.replace(/\D/g, "") : "30710000003",
    nombre: "Operador",
    apellido: "Diadema",
    claveTemporal: "diadema-2026",
  },
];

for (const o of operadores) {
  const hash = await bcrypt.hash(o.claveTemporal, 10);
  const u = await p.usuario.upsert({
    where: { dni: o.identificador },
    update: {
      nombre: o.nombre,
      apellido: o.apellido,
      rol: "OPERADOR_PRESTADORA",
      prestadoraId: o.prestadora.id,
      activo: true,
    },
    create: {
      dni: o.identificador,
      nombre: o.nombre,
      apellido: o.apellido,
      passwordHash: hash,
      rol: "OPERADOR_PRESTADORA",
      prestadoraId: o.prestadora.id,
    },
  });
  console.log(
    `  ✓ ${u.nombre} ${u.apellido} — ${o.prestadora.razonSocial}  |  CUIT ${o.identificador}  |  clave ${o.claveTemporal}`,
  );
}

await p.$disconnect();
console.log("\nLISTO.");
