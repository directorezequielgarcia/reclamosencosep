// Crea la cuenta de operador para GRUPO MR S.R.L. (SOL BUS), que quedó sin
// ningún usuario de acceso tras darse de alta como prestadora nueva del
// servicio TRANSPORTE (reemplazo de PATAGONIA ARGENTINA S.R.L. desde el
// 1/8/2026). Mismo patrón que crear-operadores-prestadoras.mjs (Clear /
// Patagonia / Diadema): identificador = CUIT sin guiones, clave temporal a
// comunicar para el primer ingreso.
// Idempotente: se puede correr varias veces sin duplicar (upsert por dni).

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const p = new PrismaClient();

const solbus = await p.prestadora.findFirst({
  where: { razonSocial: { contains: "SOL BUS" } },
});
if (!solbus) {
  console.error("No encontré la prestadora SOL BUS en la base.");
  process.exit(1);
}

// El CUIT sigue siendo el marcador del alta (30-71000000-4) hasta que se
// cargue el real de Grupo MR S.R.L. — usarlo igual como identificador,
// mismo criterio que se usó para Clear/Patagonia/Diadema con sus marcadores.
const identificador = solbus.cuit ? solbus.cuit.replace(/\D/g, "") : "30710000004";
const claveTemporal = "solbus-2026";

const hash = await bcrypt.hash(claveTemporal, 10);
const u = await p.usuario.upsert({
  where: { dni: identificador },
  update: {
    nombre: "Operador",
    apellido: "Sol Bus",
    rol: "OPERADOR_PRESTADORA",
    prestadoraId: solbus.id,
    activo: true,
  },
  create: {
    dni: identificador,
    nombre: "Operador",
    apellido: "Sol Bus",
    passwordHash: hash,
    rol: "OPERADOR_PRESTADORA",
    prestadoraId: solbus.id,
  },
});

console.log(`✓ ${u.nombre} ${u.apellido} — ${solbus.razonSocial}  |  CUIT ${identificador}  |  clave ${claveTemporal}`);
console.log("\nRECORDATORIO: el CUIT sigue siendo un marcador — cuando se tenga el real de Grupo MR S.R.L., actualizar prestadora.cuit y avisar a Sol Bus para que vuelva a loguearse con el CUIT correcto.");

await p.$disconnect();
