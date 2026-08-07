import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const ids = [
  "clipping-cronica-2026-08-05-desorientacion-recorridos",
  "clipping-cronica-2026-08-04-solbus-reclamos",
  "clipping-adnsur-2026-08-04-340-reclamos-solbus",
  "clipping-comodorense-2026-08-05-poder-contralor",
  "clipping-cronica-2026-07-16-dictamen-luz",
  "clipping-adnsur-2026-07-16-readecuacion-tarifaria",
  "clipping-cronica-2026-07-06-audiencia-tarifas",
  "clipping-consellopatagonico-2026-06-29-convocatoria-audiencia",
];

function extraerImagen(html) {
  const patrones = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ];
  for (const re of patrones) {
    const m = html.match(re);
    if (m) return m[1];
  }
  return null;
}

for (const id of ids) {
  const boletin = await p.boletin.findUnique({ where: { id } });
  if (!boletin || !boletin.enlaceExterno) {
    console.log(`SKIP ${id}: no encontrado o sin enlaceExterno`);
    continue;
  }
  try {
    const res = await fetch(boletin.enlaceExterno, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
    });
    if (!res.ok) {
      console.log(`FAIL ${id}: HTTP ${res.status} al pedir la nota`);
      continue;
    }
    const html = await res.text();
    let img = extraerImagen(html);
    if (!img) {
      console.log(`FAIL ${id}: no se encontró og:image / twitter:image`);
      continue;
    }
    if (img.startsWith("//")) img = "https:" + img;
    else if (img.startsWith("/")) {
      const base = new URL(boletin.enlaceExterno);
      img = `${base.protocol}//${base.host}${img}`;
    }

    await p.boletin.update({ where: { id }, data: { fotoUrl: img } });
    console.log(`OK   ${id}\n     -> ${img}`);
  } catch (err) {
    console.log(`ERROR ${id}: ${err.message}`);
  }
}

await p.$disconnect();
