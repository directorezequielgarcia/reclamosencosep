/**
 * Mapa estático de un punto GPS, para embeber en documentos exportables
 * (.docx) y vistas imprimibles sin depender de un servicio externo de
 * "static maps" (la mayoría requiere API key o no está disponible): se arma
 * un mosaico 3×3 de teselas ráster de OpenStreetMap como SVG autocontenido
 * (teselas embebidas en base64) con un marcador dibujado en el punto exacto.
 *
 * El mismo SVG sirve para el HTML imprimible (el navegador lo renderiza
 * nativo) y, con el PNG de la tesela central como `fallbackPng`, para el
 * ImageRun tipo "svg" de la librería `docx` (Word < 2016 no renderiza SVG).
 */

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
