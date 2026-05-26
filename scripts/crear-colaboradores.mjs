import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const p = new PrismaClient();

// DNI temporales (numericos para no romper UI que valida numero). Reemplazar
// con DNI reales en otra sesión cuando el usuario los pase.
const colaboradores = [
  {
    dni: "11111111",
    nombre: "Adriana",
    apellido: "Almonacid",
    email: "adriana.almonacid@encosepcomodoro.gob.ar",
    rol: "GESTOR_ENTE",
    rolDescripcion: "Responsable del Control Documental",
  },
  {
    dni: "22222222",
    nombre: "Marcos",
    apellido: "Barrionuevo",
    email: "marcos.barrionuevo@encosepcomodoro.gob.ar",
    rol: "GESTOR_ENTE",
    rolDescripcion: "Responsable de Comunicación y Medios",
  },
  {
    dni: "33333333",
    nombre: "Yanina",
    apellido: "del Bono",
    email: "yanina.delbono@encosepcomodoro.gob.ar",
    rol: "GESTOR_ENTE",
    rolDescripcion: "Responsable y Gestora de Expedientes",
  },
  {
    dni: "44444444",
    nombre: "Julieta",
    apellido: "Palacios",
    email: "julieta.palacios@encosepcomodoro.gob.ar",
    rol: "GESTOR_ENTE",
    rolDescripcion: "Responsable de Inspecciones",
  },
];

const claveTemporal = "encosep-2026";
const hash = await bcrypt.hash(claveTemporal, 10);

console.log("Creando colaboradores con clave temporal:", claveTemporal);
console.log("");

for (const c of colaboradores) {
  const u = await p.usuario.upsert({
    where: { dni: c.dni },
    update: {
      nombre: c.nombre,
      apellido: c.apellido,
      email: c.email,
      rol: c.rol,
      activo: true,
    },
    create: {
      dni: c.dni,
      nombre: c.nombre,
      apellido: c.apellido,
      email: c.email,
      passwordHash: hash,
      rol: c.rol,
    },
  });
  console.log(
    `  ✓ ${u.nombre} ${u.apellido} — ${c.rolDescripcion} — DNI ${u.dni}`,
  );
}

await p.$disconnect();
console.log("\nLISTO. Todos con clave temporal:", claveTemporal);
