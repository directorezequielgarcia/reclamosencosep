/**
 * Geocoding con Nominatim (OpenStreetMap).
 *
 * Servicio gratuito sin API key. Respeta el rate limit de 1 request/segundo
 * y un User-Agent identificable que pide la política de uso de Nominatim.
 *
 * Devuelve coordenadas aproximadas de la dirección dentro de Comodoro
 * Rivadavia. Si no se encuentra resultado, devuelve null.
 */

export type Coordenadas = { lat: number; lng: number };

const USER_AGENT =
  "ENCOSEP Reclamos Portal (https://reclamosencosep.vercel.app)";

// Bounding box de Comodoro Rivadavia y alrededores (Rada Tilly + Caleta)
// para restringir los resultados a la zona.
// viewbox = lon_min,lat_max,lon_max,lat_min
const VIEWBOX_COMODORO = "-67.65,-45.75,-67.35,-45.95";

export async function geocodificarDireccion(
  direccion: string,
  barrio?: string | null,
): Promise<Coordenadas | null> {
  const partes = [direccion.trim()];
  if (barrio?.trim()) partes.push(barrio.trim());
  partes.push("Comodoro Rivadavia", "Chubut", "Argentina");
  const q = partes.join(", ");

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("viewbox", VIEWBOX_COMODORO);
  url.searchParams.set("bounded", "1");
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
    return { lat, lng };
  } catch {
    return null;
  }
}
