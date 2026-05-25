// Test end-to-end del flujo M4: foto + GPS + expediente.
// Asume que el dev server está corriendo en http://localhost:3000.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const BASE = "http://localhost:3000";

// Helpers para manejar cookies entre fetch calls
class Jar {
  constructor() { this.cookies = new Map(); }
  ingest(resp) {
    const sc = resp.headers.getSetCookie?.() ?? [];
    for (const c of sc) {
      const [pair] = c.split(";");
      const eq = pair.indexOf("=");
      if (eq > 0) this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }
  header() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

function ok(cond, msg) {
  console.log(`${cond ? "  ✓" : "  ✗ FALLO:"} ${msg}`);
  if (!cond) process.exitCode = 1;
}

async function main() {
  const jar = new Jar();

  // 1) CSRF
  const csrfResp = await fetch(`${BASE}/api/auth/csrf`);
  jar.ingest(csrfResp);
  const { csrfToken } = await csrfResp.json();

  // 2) Login como vecino
  const loginForm = new URLSearchParams({
    csrfToken,
    dni: "40555666",
    password: "demo1234",
    callbackUrl: `${BASE}/inicio`,
    json: "true",
  });
  const loginResp = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { cookie: jar.header(), "content-type": "application/x-www-form-urlencoded" },
    body: loginForm,
    redirect: "manual",
  });
  jar.ingest(loginResp);
  console.log(`Login HTTP ${loginResp.status}`);
  ok([200, 302].includes(loginResp.status), "login del vecino");

  // 3) Crear reclamo con foto + GPS
  const jpgBytes = Buffer.from([
    0xFF,0xD8,0xFF,0xE0,0x00,0x10,0x4A,0x46,0x49,0x46,0x00,0x01,0x01,0x00,0x00,0x01,
    0x00,0x01,0x00,0x00,0xFF,0xDB,0x00,0x43,0x00,0x08,0x06,0x06,0x07,0x06,0x05,0x08,
    0x07,0x07,0x07,0x09,0x09,0x08,0x0A,0x0C,0x14,0x0D,0x0C,0x0B,0x0B,0x0C,0x19,0x12,
    0x13,0x0F,0x14,0x1D,0x1A,0x1F,0x1E,0x1D,0x1A,0x1C,0x1C,0x20,0x24,0x2E,0x27,0x20,
    0x22,0x2C,0x23,0x1C,0x1C,0x28,0x37,0x29,0x2C,0x30,0x31,0x34,0x34,0x34,0x1F,0x27,
    0x39,0x3D,0x38,0x32,0x3C,0x2E,0x33,0x34,0x32,0xFF,0xC0,0x00,0x0B,0x08,0x00,0x01,
    0x00,0x01,0x01,0x01,0x11,0x00,0xFF,0xC4,0x00,0x1F,0x00,0x00,0x01,0x05,0x01,0x01,
    0x01,0x01,0x01,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01,0x02,0x03,0x04,
    0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0xFF,0xDA,0x00,0x08,0x01,0x01,0x00,0x00,0x3F,
    0x00,0xFB,0xD0,0xFF,0xD9
  ]);

  const fd = new FormData();
  fd.append("svc", "agua");
  fd.append("titulo", "Pérdida con foto + GPS (test)");
  fd.append("descripcion", "Reclamo de prueba M4 con foto adjunta y coordenadas GPS reales de Comodoro Rivadavia.");
  fd.append("direccion", "Av. Rivadavia 1500");
  fd.append("barrio", "Centro");
  fd.append("lat", "-45.86413");
  fd.append("lng", "-67.49656");
  fd.append("foto", new Blob([jpgBytes], { type: "image/jpeg" }), "test.jpg");

  const createResp = await fetch(`${BASE}/api/reclamos`, {
    method: "POST",
    headers: { cookie: jar.header() },
    body: fd,
  });
  console.log(`POST /api/reclamos HTTP ${createResp.status}`);
  const created = await createResp.json();
  console.log("  resp:", JSON.stringify(created));
  ok(createResp.status === 200 && created.ok, "creación del reclamo");
  if (!created.id) { process.exit(1); }

  // 4) Verificar que el archivo se guardó
  const fotoDir = join(process.cwd(), "public", "uploads", "reclamos", created.id);
  ok(existsSync(fotoDir), `directorio de fotos existe: ${fotoDir}`);

  // 5) Logout vecino
  jar.cookies.clear();

  // 6) Login como gestor del Ente
  const csrf2 = await fetch(`${BASE}/api/auth/csrf`);
  jar.ingest(csrf2);
  const { csrfToken: t2 } = await csrf2.json();
  const lf2 = new URLSearchParams({
    csrfToken: t2, dni: "30111222", password: "demo1234", callbackUrl: `${BASE}/admin`, json: "true",
  });
  const l2 = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { cookie: jar.header(), "content-type": "application/x-www-form-urlencoded" },
    body: lf2,
    redirect: "manual",
  });
  jar.ingest(l2);
  ok([200, 302].includes(l2.status), "login del gestor del Ente");

  // 7) Verificar que el detalle admin carga (con mapa + foto)
  const det = await fetch(`${BASE}/admin/reclamo/${created.id}`, { headers: { cookie: jar.header() } });
  const detHtml = await det.text();
  ok(det.status === 200, `detalle admin HTTP 200`);
  ok(detHtml.includes("MiniMapa") || detHtml.includes("leaflet") || detHtml.includes("Ubicación"), "muestra la ubicación");
  ok(detHtml.includes("test.jpg") || detHtml.includes("/uploads/reclamos/"), "muestra la foto adjunta");
  ok(detHtml.includes("Elevar a expediente"), "tiene la acción 'Elevar a expediente'");

  // 8) Llamar a la server action 'elevarAExpediente' es complejo (Next encripta los action IDs).
  //    En su lugar, hacemos la elevación directa por Prisma para verificar las pantallas.
  //    Esto valida que las páginas /admin/expedientes y /admin/expediente/[id] renderizan.
  const { PrismaClient } = await import("@prisma/client");
  const p = new PrismaClient();
  const reclamoFull = await p.reclamo.findUnique({ where: { id: created.id }, include: { prestadora: true, servicio: true } });
  const gestor = await p.usuario.findUnique({ where: { dni: "30111222" } });
  const exp = await p.expediente.create({
    data: {
      numero: `EXP-${new Date().getFullYear()}-T${Date.now().toString().slice(-5)}`,
      caratula: `ENCOSEP c/ ${reclamoFull.prestadora.razonSocial} (test)`,
      asunto: "Prueba automatizada M4",
      prestadoraId: reclamoFull.prestadoraId,
      iniciadorId: gestor.id,
      reclamos: { connect: { id: reclamoFull.id } },
      actos: {
        create: {
          tipo: "CARATULACION",
          titulo: "Apertura (test)",
          cuerpo: "Cuerpo de prueba.",
          autorId: gestor.id,
        },
      },
    },
  });
  console.log(`Expediente creado: ${exp.numero} (id ${exp.id})`);
  await p.$disconnect();

  // 9) Listado de expedientes
  const expList = await fetch(`${BASE}/admin/expedientes`, { headers: { cookie: jar.header() } });
  const expHtml = await expList.text();
  ok(expList.status === 200, "/admin/expedientes HTTP 200");
  ok(expHtml.includes(exp.numero), `el listado incluye ${exp.numero}`);

  // 10) Detalle del expediente
  const expDet = await fetch(`${BASE}/admin/expediente/${exp.id}`, { headers: { cookie: jar.header() } });
  const expDetHtml = await expDet.text();
  ok(expDet.status === 200, `/admin/expediente/${exp.id} HTTP 200`);
  ok(expDetHtml.includes("Cuerpo del expediente"), "detalle muestra cuerpo del expediente");
  ok(expDetHtml.includes("Labrar nuevo acto"), "detalle ofrece labrar nuevo acto");
  ok(expDetHtml.includes("Reclamos asociados"), "detalle lista reclamos asociados");

  console.log("\nFIN.");
}

main().catch(e => { console.error(e); process.exit(1); });
