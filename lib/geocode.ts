/**
 * Geocoding con Nominatim (OpenStreetMap).
 *
 * Servicio gratuito sin API key. User-Agent identificable como lo pide
 * la política de uso de Nominatim. Implementa 5 estrategias de búsqueda
 * en cascada (más estricta a más laxa) y como último recurso devuelve
 * el centro de Comodoro con jitter para no acumular puntos en el mismo
 * pixel del mapa.
 */

export type Coordenadas = { lat: number; lng: number };

const USER_AGENT =
  "ENCOSEP Reclamos Portal (https://reclamosencosep.vercel.app)";

// Bounding box: Comodoro Rivadavia + Rada Tilly + alrededores
const VIEWBOX = "-67.65,-45.75,-67.35,-45.95";
const CENTRO_COMODORO: Coordenadas = { lat: -45.864, lng: -67.4969 };

/**
 * Valida que unas coordenadas caigan dentro de la Patagonia argentina,
 * alrededor de Comodoro Rivadavia. Usarla siempre que se acepten
 * coordenadas de una fuente sin control (geolocalización del navegador,
 * que puede fallar groseramente por IP/VPN en vez de GPS real).
 */
export function estaEnZonaComodoro(lat: number, lng: number): boolean {
  return lat >= -47 && lat <= -45 && lng >= -68 && lng <= -67;
}

async function tryQuery(
  q: string,
  bounded: boolean,
): Promise<Coordenadas | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  if (bounded) {
    url.searchParams.set("viewbox", VIEWBOX);
    url.searchParams.set("bounded", "1");
  }
  url.searchParams.set("countrycodes", "ar");
  try {
    const resp = await fetch(url.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        "Accept-Language": "es",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) return null;
    const data: Array<{ lat: string; lon: string }> = await resp.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (!estaEnZonaComodoro(lat, lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Convierte una dirección escrita en coordenadas aproximadas en Comodoro
 * Rivadavia. Siempre devuelve coordenadas (al menos las del centro con
 * jitter si nada se encuentra), nunca null. Esto asegura que TODO reclamo
 * cargado quede georeferenciado en el mapa de calor.
 */
export async function geocodificarDireccion(
  direccion: string,
  barrio?: string | null,
): Promise<Coordenadas> {
  const calleNum = direccion.trim();

  // 1) bounded + barrio
  const conBarrio = [calleNum];
  if (barrio?.trim()) conBarrio.push(barrio.trim());
  conBarrio.push("Comodoro Rivadavia", "Chubut", "Argentina");
  let r = await tryQuery(conBarrio.join(", "), true);
  if (r) return r;
  await sleep(1100);

  // 2) sin bounded + barrio
  r = await tryQuery(conBarrio.join(", "), false);
  if (r) return r;
  await sleep(1100);

  // 3) sin barrio
  r = await tryQuery(
    `${calleNum}, Comodoro Rivadavia, Chubut, Argentina`,
    false,
  );
  if (r) return r;
  await sleep(1100);

  // 4) sólo calle (sin número)
  const sinNumero = calleNum.replace(/\s+\d+\s*$/, "").trim();
  if (sinNumero && sinNumero !== calleNum) {
    r = await tryQuery(
      `${sinNumero}, Comodoro Rivadavia, Chubut, Argentina`,
      false,
    );
    if (r) return r;
  }

  // 5) Fallback: centro de Comodoro + jitter para evitar superposición
  const jitter = (n: number) => n + (Math.random() - 0.5) * 0.01;
  return {
    lat: jitter(CENTRO_COMODORO.lat),
    lng: jitter(CENTRO_COMODORO.lng),
  };
}
