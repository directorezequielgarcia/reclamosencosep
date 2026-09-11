import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

// ─────────────────────────────────────────────────────────────────
// Modelo DNI → año de nacimiento aproximado.
// RENAPER no publica una tabla oficial de asignación. Recalibrado con
// UN dato real confirmado por el usuario (34 años, DNI serie 36.xxx.xxx
// en 2026 → nacido ~1992) más un ancla histórica ampliamente citada
// (DNI ~4.000.000 ≈ personas nacidas ~1936, época de unificación de
// la Libreta de Enrolamiento/Cívica). Es un modelo LINEAL de 2 puntos:
// más simple que la tabla anterior, pero sincero sobre su base real.
// Sigue siendo una ESTIMACIÓN GRUESA — sirve para un perfil demográfico
// agregado, no para inferir la edad de una persona puntual.
// ─────────────────────────────────────────────────────────────────
const ANCLA_A = [4000000, 1936];
const ANCLA_B = [36000000, 1992]; // dato real aportado por el usuario
const PENDIENTE = (ANCLA_B[1] - ANCLA_A[1]) / (ANCLA_B[0] - ANCLA_A[0]); // años por unidad de DNI

function estimarAnioNacimiento(dniNum) {
  return Math.round(ANCLA_A[1] + (dniNum - ANCLA_A[0]) * PENDIENTE);
}

const LIMITE_EXTRANJERO = 90000000; // criterio indicado por el usuario

function rangoEtario(edad) {
  if (edad < 0 || edad > 100) return "Dato inconsistente";
  if (edad < 18) return "Menor de 18";
  if (edad <= 25) return "18-25";
  if (edad <= 35) return "26-35";
  if (edad <= 45) return "36-45";
  if (edad <= 55) return "46-55";
  if (edad <= 65) return "56-65";
  if (edad <= 75) return "66-75";
  return "76+";
}

const ANIO_ACTUAL = 2026;

const reclamos = await p.reclamo.findMany({
  select: {
    codigo: true,
    origenOficio: true,
    createdAt: true,
    servicio: { select: { nombreCorto: true } },
    ciudadano: { select: { id: true, dni: true, rol: true } },
  },
});

console.log(`Total de reclamos en la base: ${reclamos.length}\n`);

const oficio = reclamos.filter((r) => r.origenOficio);
const vecinos = reclamos.filter((r) => !r.origenOficio);

console.log(`Reclamos de oficio (DNI = inspector del Ente, se excluyen del perfil etario): ${oficio.length}`);
console.log(`Reclamos de vecinos (base del análisis demográfico): ${vecinos.length}\n`);

const dniInvalidos = [];
const extranjeros = [];
const nativos = [];

for (const r of vecinos) {
  const dniRaw = r.ciudadano?.dni ?? "";
  const soloDigitos = String(dniRaw).replace(/\D/g, "");
  const dniNum = parseInt(soloDigitos, 10);
  // Un DNI argentino real tiene 6 a 8 dígitos (nativo ~1.000.000-70.000.000;
  // extranjero con radicación ~90.000.000-99.999.999). Todo lo que tenga 9+
  // dígitos NO es un DNI válido: suele ser un teléfono u otro dato mal
  // cargado en el campo (ej. 2974165837 = 0297-4165837, cód. área Comodoro).
  if (!dniNum || soloDigitos.length < 6 || soloDigitos.length > 8) {
    dniInvalidos.push({ ...r, dniRaw, soloDigitos });
    continue;
  }
  if (dniNum >= LIMITE_EXTRANJERO) {
    extranjeros.push({ ...r, dniNum });
  } else {
    const anioNac = estimarAnioNacimiento(dniNum);
    const edad = ANIO_ACTUAL - anioNac;
    nativos.push({ ...r, dniNum, anioNacEstimado: anioNac, edadEstimada: edad, rango: rangoEtario(edad) });
  }
}

console.log(`DNI con formato inválido (9+ dígitos, no puede ser un DNI real — típicamente teléfonos mal cargados): ${dniInvalidos.length}`);
console.log(`Reclamos con DNI en rango "extranjero" válido (8 dígitos, ${LIMITE_EXTRANJERO.toLocaleString("es-AR")}-99.999.999): ${extranjeros.length}`);
console.log(`Reclamos con DNI en rango nativo, con edad estimable: ${nativos.length}\n`);

// ── Distribución por rango etario (por reclamo) ──
const distribEtaria = {};
for (const n of nativos) {
  distribEtaria[n.rango] = (distribEtaria[n.rango] || 0) + 1;
}
const ordenRangos = ["Menor de 18", "18-25", "26-35", "36-45", "46-55", "56-65", "66-75", "76+", "Dato inconsistente"];
console.log("── Distribución etaria estimada (por reclamo, vecinos) ──");
for (const rango of ordenRangos) {
  if (distribEtaria[rango]) {
    const pct = ((distribEtaria[rango] / nativos.length) * 100).toFixed(1);
    console.log(`${rango.padEnd(20)} ${String(distribEtaria[rango]).padStart(4)}  (${pct}%)`);
  }
}

// ── Por ciudadano único (evita que un vecino con muchos reclamos infle un rango) ──
const porCiudadano = new Map();
for (const n of nativos) {
  if (!porCiudadano.has(n.ciudadano.id)) porCiudadano.set(n.ciudadano.id, n);
}
const distribEtariaUnica = {};
for (const n of porCiudadano.values()) {
  distribEtariaUnica[n.rango] = (distribEtariaUnica[n.rango] || 0) + 1;
}
console.log(`\n── Distribución etaria estimada (ciudadanos ÚNICOS, ${porCiudadano.size} vecinos) ──`);
for (const rango of ordenRangos) {
  if (distribEtariaUnica[rango]) {
    const pct = ((distribEtariaUnica[rango] / porCiudadano.size) * 100).toFixed(1);
    console.log(`${rango.padEnd(20)} ${String(distribEtariaUnica[rango]).padStart(4)}  (${pct}%)`);
  }
}

// ── Edad promedio y mediana ──
function promedio(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function mediana(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}
const edadesPorReclamo = nativos.map((n) => n.edadEstimada);
const edadesPorCiudadano = [...porCiudadano.values()].map((n) => n.edadEstimada);
console.log(`\n── Edad promedio estimada ──`);
console.log(`Por reclamo (n=${edadesPorReclamo.length}):    promedio ${promedio(edadesPorReclamo).toFixed(1)} años · mediana ${mediana(edadesPorReclamo)} años`);
console.log(`Por vecino único (n=${edadesPorCiudadano.length}): promedio ${promedio(edadesPorCiudadano).toFixed(1)} años · mediana ${mediana(edadesPorCiudadano)} años`);

// ── Extranjeros: detalle ──
const ciudadanosExtranjerosUnicos = new Map();
for (const e of extranjeros) {
  if (!ciudadanosExtranjerosUnicos.has(e.ciudadano.id)) ciudadanosExtranjerosUnicos.set(e.ciudadano.id, e);
}
console.log(`\n── Extranjeros (DNI >= 90.000.000) ──`);
console.log(`Reclamos: ${extranjeros.length}  |  Vecinos únicos: ${ciudadanosExtranjerosUnicos.size}`);
if (extranjeros.length > 0) {
  console.log("\nDetalle (código reclamo, servicio, DNI):");
  for (const e of extranjeros) {
    console.log(`  ${e.codigo}  ${(e.servicio?.nombreCorto ?? "").padEnd(12)} DNI ${e.dniNum.toLocaleString("es-AR")}`);
  }
}

// ── DNI inconsistentes: detalle para revisión manual ──
if (dniInvalidos.length > 0) {
  console.log(`\n── DNI no interpretable (revisar manualmente) ──`);
  for (const r of dniInvalidos) {
    console.log(`  ${r.codigo}  ciudadanoId=${r.ciudadano?.id}  dni="${r.ciudadano?.dni}"`);
  }
}

// ── Distribución por servicio de los extranjeros (para contexto) ──
if (extranjeros.length > 0) {
  console.log(`\n── Extranjeros por servicio ──`);
  const porServicio = {};
  for (const e of extranjeros) {
    const s = e.servicio?.nombreCorto ?? "Sin servicio";
    porServicio[s] = (porServicio[s] || 0) + 1;
  }
  for (const [s, c] of Object.entries(porServicio)) {
    console.log(`  ${s.padEnd(15)} ${c}`);
  }
}

await p.$disconnect();
