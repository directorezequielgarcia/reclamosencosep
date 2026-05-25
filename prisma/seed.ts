/**
 * Seed inicial — servicios, prestadoras y usuarios demo.
 * Idempotente: se puede correr varias veces sin duplicar.
 */
import { PrismaClient, Rol, ServicioKind } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1) Servicios bajo control del ENCOSEP
  const servicios = await Promise.all([
    prisma.servicio.upsert({
      where: { kind: ServicioKind.RESIDUOS },
      update: {},
      create: {
        kind: ServicioKind.RESIDUOS,
        nombre: "Gestión de Residuos · Higiene Urbana",
        nombreCorto: "Residuos",
      },
    }),
    prisma.servicio.upsert({
      where: { kind: ServicioKind.ENERGIA },
      update: {},
      create: {
        kind: ServicioKind.ENERGIA,
        nombre: "Electricidad e Iluminación pública",
        nombreCorto: "Electricidad",
      },
    }),
    prisma.servicio.upsert({
      where: { kind: ServicioKind.AGUA },
      update: {},
      create: {
        kind: ServicioKind.AGUA,
        nombre: "Agua, Saneamiento y Cloacas",
        nombreCorto: "Agua",
      },
    }),
    prisma.servicio.upsert({
      where: { kind: ServicioKind.TRANSPORTE },
      update: {},
      create: {
        kind: ServicioKind.TRANSPORTE,
        nombre: "Transporte Urbano de Pasajeros",
        nombreCorto: "Transporte",
      },
    }),
  ]);

  const svc = Object.fromEntries(servicios.map((s) => [s.kind, s]));

  // 2) Prestadoras del padrón actual
  const clear = await prisma.prestadora.upsert({
    where: { cuit: "30-71000000-1" }, // marcador, ajustar con CUIT real
    update: {},
    create: {
      razonSocial: "CLEAR URBANA S.A.",
      cuit: "30-71000000-1",
      servicios: { connect: [{ id: svc.RESIDUOS.id }] },
    },
  });

  const scpl = await prisma.prestadora.upsert({
    where: { cuit: "30-52877540-9" }, // CUIT histórico SCPL, verificar
    update: {},
    create: {
      razonSocial: "Sociedad Cooperativa Popular Limitada (SCPL)",
      cuit: "30-52877540-9",
      servicios: { connect: [{ id: svc.ENERGIA.id }, { id: svc.AGUA.id }] },
    },
  });

  const patagonia = await prisma.prestadora.upsert({
    where: { cuit: "30-71000000-2" },
    update: {},
    create: {
      razonSocial: "PATAGONIA ARGENTINA S.R.L.",
      cuit: "30-71000000-2",
      servicios: { connect: [{ id: svc.TRANSPORTE.id }] },
    },
  });

  const diadema = await prisma.prestadora.upsert({
    where: { cuit: "30-71000000-3" },
    update: {},
    create: {
      razonSocial: "TRANSPORTE DIADEMA S.A.",
      cuit: "30-71000000-3",
      servicios: { connect: [{ id: svc.TRANSPORTE.id }] },
    },
  });

  // 3) Usuarios demo (clave: "demo1234")
  const pass = await bcrypt.hash("demo1234", 10);

  await prisma.usuario.upsert({
    where: { dni: "27345678" },
    update: {},
    create: {
      dni: "27345678",
      nombre: "Ezequiel",
      apellido: "García",
      email: "abogadoezequielgarcia@gmail.com",
      passwordHash: pass,
      rol: Rol.SUPER_ADMIN,
    },
  });

  await prisma.usuario.upsert({
    where: { dni: "30111222" },
    update: {},
    create: {
      dni: "30111222",
      nombre: "Gestora",
      apellido: "Demo",
      passwordHash: pass,
      rol: Rol.GESTOR_ENTE,
    },
  });

  await prisma.usuario.upsert({
    where: { dni: "33444555" },
    update: {},
    create: {
      dni: "33444555",
      nombre: "Operadora",
      apellido: "SCPL Demo",
      passwordHash: pass,
      rol: Rol.OPERADOR_PRESTADORA,
      prestadoraId: scpl.id,
    },
  });

  await prisma.usuario.upsert({
    where: { dni: "40555666" },
    update: {},
    create: {
      dni: "40555666",
      nombre: "Vecino",
      apellido: "Demo",
      passwordHash: pass,
      rol: Rol.CIUDADANO,
    },
  });

  console.log("Seed OK:");
  console.log(` Servicios:    ${servicios.length}`);
  console.log(` Prestadoras:  4 (CLEAR URBANA, SCPL, PATAGONIA, DIADEMA)`);
  console.log(` Usuarios:     4 (super, gestor, operadora, ciudadano)`);
  console.log(` Clave demo:   "demo1234"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
