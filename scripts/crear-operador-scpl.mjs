// Crea un usuario operador para SCPL identificado por su CUIT.
// Idempotente: si ya existe, actualiza la clave.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const CUIT_SCPL_SIN_GUIONES = "30528775409";
const CLAVE_TEMPORAL = "scpl-2026";

const p = new PrismaClient();

const scpl = await p.prestadora.findFirst({
  where: { razonSocial: { contains: "SCPL" } },
});
if (!scpl) {
  console.error("No encontré la prestadora SCPL. Corré npm run db:seed primero.");
  process.exit(1);
}

const hash = await bcrypt.hash(CLAVE_TEMPORAL, 10);

const user = await p.usuario.upsert({
  where: { dni: CUIT_SCPL_SIN_GUIONES },
  update: { passwordHash: hash, prestadoraId: scpl.id, activo: true },
  create: {
    dni: CUIT_SCPL_SIN_GUIONES,
    nombre: "SCPL",
    apellido: "Operador",
    passwordHash: hash,
    rol: "OPERADOR_PRESTADORA",
    prestadoraId: scpl.id,
  },
});

console.log("Operador SCPL listo:");
console.log("  identificador (CUIT sin guiones): " + user.dni);
console.log("  clave temporal:                   " + CLAVE_TEMPORAL);
console.log("  prestadora:                       " + scpl.razonSocial);

await p.$disconnect();
