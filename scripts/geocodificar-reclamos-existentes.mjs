/**
 * Geocodifica los reclamos existentes que NO tienen lat/lng pero sí
 * dirección escrita. Usa Nominatim (gratis) y respeta el rate limit
 * de 1 request por segundo.
 */
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const USER_AGENT =
  "ENCOSEP Reclamos Portal (https://reclamosencosep.vercel.app)";
const VIEWBOX = "-67.65,-45.75,-67.35,-45.95";

async function geocode(direccion, barrio) {
  const partes = [direccion.trim()];
  if (barrio?.trim()) partes.push(barrio.trim());
  partes.push("Comodoro Rivadavia", "Chubut", "Argentina");
  const q = partes.join(", ");

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("viewbox", VIEWBOX);
  url.searchParams.set("bounded", "1");
  url.searchParams.set("countrycodes", "ar");

  const resp = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      "Accept-Language": "es",
    },
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const lat = Number(data[0].lat);
  const lng = Number(data[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

const pendientes = await p.reclamo.findMany({
  where: {
    OR: [{ lat: null }, { lng: null }],
    direccion: { not: "Sin dirección" },
    NOT: { direccion: { startsWith: "Coordenadas GPS" } },
  },
  select: { id: true, codigo: true, direccion: true, barrio: true },
});

console.log(`Reclamos sin GPS a geocodificar: ${pendientes.length}`);

let ok = 0;
let fail = 0;
for (let i = 0; i < pendientes.length; i++) {
  const r = pendientes[i];
  try {
    const geo = await geocode(r.direccion, r.barrio);
    if (geo) {
      await p.reclamo.update({
        where: { id: r.id },
        data: { lat: geo.lat, lng: geo.lng },
      });
      ok++;
      console.log(
        `  [${i + 1}/${pendientes.length}] ${r.codigo} OK  →  ${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}`,
      );
    } else {
      fail++;
      console.log(`  [${i + 1}/${pendientes.length}] ${r.codigo} no encontrado`);
    }
  } catch (e) {
    fail++;
    console.log(`  [${i + 1}/${pendientes.length}] ${r.codigo} ERROR: ${e.message}`);
  }
  // Rate limit: 1 req/seg para respetar a Nominatim
  if (i < pendientes.length - 1) {
    await new Promise((r) => setTimeout(r, 1100));
  }
}

console.log(`\nTotal: ${ok} OK · ${fail} sin resultado`);
await p.$disconnect();
