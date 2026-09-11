/**
 * Mapas estáticos armados con teselas ráster de OpenStreetMap como SVG
 * autocontenido (teselas embebidas en base64), sin depender de un servicio
 * externo de "static maps" (la mayoría requiere API key o no está
 * disponible). Dos variantes:
 *
 * - `construirMapaEstatico`: un solo punto, para embeber en documentos
 *   exportables (.docx) y vistas imprimibles de un reclamo individual.
 * - `construirMapaMultiPunto` + `rasterizarSvgAPng`: varios puntos (la
 *   "captura" descargable del mapa de calor de /indicadores, filtrada por
 *   fecha/servicio), rasterizada a PNG con `sharp` porque ahí sí hace falta
 *   entregar una imagen real, no un SVG.
 */
import type { ServicioKind } from "@prisma/client";
import { SVC_COLOR_HEX } from "@/lib/servicios";

const TILE_SIZE = 256;

function lonToPixelX(lon: number, zoom: number): number {
  return ((lon + 180) / 360) * Math.pow(2, zoom) * TILE_SIZE;
}

function latToPixelY(lat: number, zoom: number): number {
  const latRad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    Math.pow(2, zoom) *
    TILE_SIZE
  );
}

async function fetchTilePng(
  x: number,
  y: number,
  zoom: number,
): Promise<Buffer | null> {
  try {
    const res = await fetch(
      `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
      {
        headers: {
          "User-Agent": "ENCOSEP-PortalReclamos/1.0 (portal de reclamos)",
        },
      },
    );
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export type MapaEstatico = {
  svg: string;
  fallbackPng: Buffer;
};

/**
 * Arma el mosaico 3×3 centrado en la tesela del punto, y recorta un viewBox
 * de `anchoPx`×`altoPx` centrado en el pixel exacto del punto — así el
 * marcador queda siempre centrado sin importar en qué tesela caiga.
 * Devuelve null solo si las 9 teselas fallan (sin conectividad, etc.).
 */
export async function construirMapaEstatico(
  lat: number,
  lng: number,
  {
    zoom = 16,
    anchoPx = 480,
    altoPx = 320,
  }: { zoom?: number; anchoPx?: number; altoPx?: number } = {},
): Promise<MapaEstatico | null> {
  const pxGlobalX = lonToPixelX(lng, zoom);
  const pxGlobalY = latToPixelY(lat, zoom);
  const tileCenterX = Math.floor(pxGlobalX / TILE_SIZE);
  const tileCenterY = Math.floor(pxGlobalY / TILE_SIZE);

  const offsets = [-1, 0, 1];
  const tiles = await Promise.all(
    offsets.flatMap((dy) =>
      offsets.map(async (dx) => ({
        dx,
        dy,
        png: await fetchTilePng(tileCenterX + dx, tileCenterY + dy, zoom),
      })),
    ),
  );

  const central = tiles.find((t) => t.dx === 0 && t.dy === 0)?.png;
  const cualquiera = tiles.find((t) => t.png)?.png;
  if (!cualquiera) return null;

  const mosaicOriginX = (tileCenterX - 1) * TILE_SIZE;
  const mosaicOriginY = (tileCenterY - 1) * TILE_SIZE;
  const pxLocalX = pxGlobalX - mosaicOriginX;
  const pxLocalY = pxGlobalY - mosaicOriginY;

  const images = tiles
    .map(({ dx, dy, png }) => {
      const x = (dx + 1) * TILE_SIZE;
      const y = (dy + 1) * TILE_SIZE;
      if (!png) {
        return `<rect x="${x}" y="${y}" width="${TILE_SIZE}" height="${TILE_SIZE}" fill="#e5e7eb"/>`;
      }
      return `<image x="${x}" y="${y}" width="${TILE_SIZE}" height="${TILE_SIZE}" href="data:image/png;base64,${png.toString("base64")}" />`;
    })
    .join("");

  const vx = pxLocalX - anchoPx / 2;
  const vy = pxLocalY - altoPx / 2;

  const pin = `<g transform="translate(${pxLocalX - 12}, ${pxLocalY - 34})">
    <path d="M12 34C12 34 23 19.6 23 11.5C23 5.15 18.1 0 12 0C5.9 0 1 5.15 1 11.5C1 19.6 12 34 12 34Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="1.2"/>
    <circle cx="12" cy="11.5" r="4.3" fill="#ffffff"/>
  </g>`;

  const atribucion = `<rect x="${vx}" y="${vy + altoPx - 15}" width="172" height="15" fill="#ffffff" fill-opacity="0.78"/>
  <text x="${vx + 4}" y="${vy + altoPx - 4}" font-family="Arial, sans-serif" font-size="9" fill="#333333">© OpenStreetMap contributors</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${anchoPx} ${altoPx}" width="${anchoPx}" height="${altoPx}">${images}${pin}${atribucion}</svg>`;

  return { svg, fallbackPng: central ?? cualquiera };
}

export type PuntoMapa = { lat: number; lng: number; servicio: ServicioKind };

// Zoom más alto (más detalle) tal que el bounding box de todos los puntos,
// con margen, todavía entra en el lienzo anchoPx×altoPx. A mayor zoom, más
// píxeles por grado — por eso se prueba de mayor a menor y se toma el primero
// que entra.
function elegirZoom(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
  anchoPx: number,
  altoPx: number,
): number {
  const PADDING = 80;
  for (let z = 17; z >= 3; z--) {
    const w = lonToPixelX(maxLng, z) - lonToPixelX(minLng, z);
    const h = latToPixelY(minLat, z) - latToPixelY(maxLat, z);
    if (w + PADDING <= anchoPx && h + PADDING <= altoPx) return z;
  }
  return 3;
}

/**
 * Mosaico de tamaño variable (no fijo 3×3) que cubre el bounding box de
 * todos los puntos, con un pin de color por servicio en cada uno. Pensado
 * para rasterizar después con `rasterizarSvgAPng` y ofrecerlo como descarga.
 * Devuelve null si no hay puntos o si ninguna tesela pudo descargarse.
 */
export async function construirMapaMultiPunto(
  puntos: PuntoMapa[],
  { anchoPx = 900, altoPx = 600 }: { anchoPx?: number; altoPx?: number } = {},
): Promise<{ svg: string } | null> {
  if (puntos.length === 0) return null;

  const lats = puntos.map((p) => p.lat);
  const lngs = puntos.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const zoom = elegirZoom(minLat, maxLat, minLng, maxLng, anchoPx, altoPx);

  const pxCenterX = (lonToPixelX(minLng, zoom) + lonToPixelX(maxLng, zoom)) / 2;
  const pxCenterY = (latToPixelY(maxLat, zoom) + latToPixelY(minLat, zoom)) / 2;

  const tileMinX = Math.floor((pxCenterX - anchoPx / 2) / TILE_SIZE);
  const tileMaxX = Math.floor((pxCenterX + anchoPx / 2) / TILE_SIZE);
  const tileMinY = Math.floor((pxCenterY - altoPx / 2) / TILE_SIZE);
  const tileMaxY = Math.floor((pxCenterY + altoPx / 2) / TILE_SIZE);

  const coords: Array<{ x: number; y: number }> = [];
  for (let y = tileMinY; y <= tileMaxY; y++) {
    for (let x = tileMinX; x <= tileMaxX; x++) coords.push({ x, y });
  }
  const tiles = await Promise.all(
    coords.map(async ({ x, y }) => ({ x, y, png: await fetchTilePng(x, y, zoom) })),
  );
  if (!tiles.some((t) => t.png)) return null;

  const mosaicOriginX = tileMinX * TILE_SIZE;
  const mosaicOriginY = tileMinY * TILE_SIZE;

  const images = tiles
    .map(({ x, y, png }) => {
      const lx = (x - tileMinX) * TILE_SIZE;
      const ly = (y - tileMinY) * TILE_SIZE;
      if (!png) {
        return `<rect x="${lx}" y="${ly}" width="${TILE_SIZE}" height="${TILE_SIZE}" fill="#e5e7eb"/>`;
      }
      return `<image x="${lx}" y="${ly}" width="${TILE_SIZE}" height="${TILE_SIZE}" href="data:image/png;base64,${png.toString("base64")}" />`;
    })
    .join("");

  const pines = puntos
    .map((p) => {
      const lx = lonToPixelX(p.lng, zoom) - mosaicOriginX;
      const ly = latToPixelY(p.lat, zoom) - mosaicOriginY;
      const color = SVC_COLOR_HEX[p.servicio] ?? "#1d3550";
      return `<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="5.5" fill="${color}" fill-opacity="0.88" stroke="#ffffff" stroke-width="1.4"/>`;
    })
    .join("");

  const vx = pxCenterX - mosaicOriginX - anchoPx / 2;
  const vy = pxCenterY - mosaicOriginY - altoPx / 2;

  const atribucion = `<rect x="${vx}" y="${vy + altoPx - 15}" width="172" height="15" fill="#ffffff" fill-opacity="0.78"/>
  <text x="${vx + 4}" y="${vy + altoPx - 4}" font-family="Arial, sans-serif" font-size="9" fill="#333333">© OpenStreetMap contributors</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${anchoPx} ${altoPx}" width="${anchoPx}" height="${altoPx}">${images}${pines}${atribucion}</svg>`;

  return { svg };
}

/** Rasteriza un SVG autocontenido (con width/height propios) a PNG. */
export async function rasterizarSvgAPng(svg: string): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
