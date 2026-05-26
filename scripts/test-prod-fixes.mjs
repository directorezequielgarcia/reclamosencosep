// Test end-to-end de los fixes en producción.
import { existsSync } from "node:fs";

const BASE = "https://reclamosencosep.vercel.app";

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

async function loginAs(jar, dni, password) {
  const csrf = await fetch(`${BASE}/api/auth/csrf`);
  jar.ingest(csrf);
  const { csrfToken } = await csrf.json();
  const lf = new URLSearchParams({
    csrfToken, dni, password,
    callbackUrl: `${BASE}/inicio`, json: "true",
  });
  const r = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { cookie: jar.header(), "content-type": "application/x-www-form-urlencoded" },
    body: lf,
    redirect: "manual",
  });
  jar.ingest(r);
  return r;
}

const main = async () => {
  // FIX #4: Login operador SCPL con CUIT
  const jarSCPL = new Jar();
  const lSCPL = await loginAs(jarSCPL, "30528775409", "scpl-2026");
  ok([200, 302].includes(lSCPL.status), `FIX #4 — Login operador SCPL con CUIT (30528775409 / scpl-2026)`);

  // FIX #1: Crear reclamo SOLO con GPS (sin dirección)
  const jar = new Jar();
  await loginAs(jar, "40555666", "demo1234");

  const jpg = Buffer.from([
    0xFF,0xD8,0xFF,0xE0,0x00,0x10,0x4A,0x46,0x49,0x46,0x00,0x01,0x01,0x00,0x00,0x01,
    0x00,0x01,0x00,0x00,0xFF,0xDB,0x00,0x43,0x00,0x08,0x06,0x06,0x07,0x06,0x05,0x08,
    0x07,0x07,0x07,0x09,0x09,0x08,0x0A,0x0C,0x14,0x0D,0x0C,0x0B,0x0B,0x0C,0x19,0x12,
    0x13,0x0F,0x14,0x1D,0x1A,0x1F,0x1E,0x1D,0x1A,0x1C,0x1C,0x20,0x24,0x2E,0x27,0x20,
    0x22,0x2C,0x23,0x1C,0x1C,0x28,0x37,0x29,0x2C,0x30,0x31,0x34,0x34,0x34,0x1F,0x27,
    0x39,0x3D,0x38,0x32,0x3C,0x2E,0x33,0x34,0x32,0xFF,0xC0,0x00,0x0B,0x08,0x00,0x01,
    0x00,0x01,0x01,0x01,0x11,0x00,0xFF,0xC4,0x00,0x1F,0x00,0x00,0x01,0x05,0x01,0x01,
    0x01,0x01,0x01,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01,0x02,0x03,0x04,
    0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0xFF,0xDA,0x00,0x08,0x01,0x01,0x00,0x00,0x3F,
    0x00,0xFB,0xD0,0xFF,0xD9,
  ]);

  // Test #1: Solo GPS, sin direccion
  const fd1 = new FormData();
  fd1.append("svc", "agua");
  fd1.append("titulo", "Test #1 — solo GPS, sin dirección");
  fd1.append("descripcion", "Test del fix #1: la app debe aceptar reclamos con solo coordenadas GPS, sin dirección escrita.");
  fd1.append("lat", "-45.86413");
  fd1.append("lng", "-67.49656");
  fd1.append("foto", new Blob([jpg], { type: "image/jpeg" }), "test1.jpg");

  const r1 = await fetch(`${BASE}/api/reclamos`, {
    method: "POST",
    headers: { cookie: jar.header() },
    body: fd1,
  });
  const d1 = await r1.json();
  ok(r1.status === 200 && d1.ok, `FIX #1a — Reclamo creado SOLO con GPS (sin dirección): ${JSON.stringify(d1)}`);

  // Test #1b: Solo direccion, sin GPS
  const fd2 = new FormData();
  fd2.append("svc", "energia");
  fd2.append("titulo", "Test #1b — solo dirección, sin GPS");
  fd2.append("descripcion", "Test del fix #1: dirección escrita sin coordenadas GPS también debe funcionar.");
  fd2.append("direccion", "Mitre 850");
  fd2.append("foto", new Blob([jpg], { type: "image/jpeg" }), "test2.jpg");

  const r2 = await fetch(`${BASE}/api/reclamos`, {
    method: "POST",
    headers: { cookie: jar.header() },
    body: fd2,
  });
  const d2 = await r2.json();
  ok(r2.status === 200 && d2.ok, `FIX #1b — Reclamo creado SOLO con dirección (sin GPS): ${JSON.stringify(d2)}`);

  // FIX #2: Pagina de detalle del reclamo para el vecino
  const codigo1 = d1.codigo;
  const det = await fetch(`${BASE}/mis-reclamos/${codigo1}`, { headers: { cookie: jar.header() } });
  const detHtml = await det.text();
  ok(det.status === 200, `FIX #2 — GET /mis-reclamos/${codigo1} HTTP 200`);
  ok(detHtml.includes("Lo que contaste") || detHtml.includes("Estado"), "FIX #2 — Detalle del reclamo muestra contenido");

  // FIX #3: Foto persistente en Vercel Blob
  const usaBlob = detHtml.includes("blob.vercel-storage.com");
  const usaFs   = detHtml.includes("/uploads/reclamos/");
  if (usaBlob) {
    console.log(`  ✓ FIX #3 — Foto en Vercel Blob (persistente)`);
  } else if (usaFs) {
    console.log(`  ⚠ FIX #3 — Foto en filesystem (NO persistente). Blob no activo todavía.`);
  } else {
    console.log(`  ✗ FIX #3 — Foto no se encuentra en el HTML de detalle`);
  }

  // Extraer la URL exacta de la foto
  const blobMatch = detHtml.match(/https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[^"]+/);
  if (blobMatch) {
    console.log(`     URL: ${blobMatch[0]}`);
    // Verificar que la foto es accesible
    const fotoResp = await fetch(blobMatch[0]);
    console.log(`     Acceso HTTP ${fotoResp.status} (${fotoResp.headers.get("content-type")})`);
  }

  console.log("\nResultado final:", process.exitCode === 1 ? "FALLAS" : "TODO OK");
};

main().catch(e => { console.error(e); process.exit(1); });
