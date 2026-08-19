"use server";

import { geocodificarDireccion } from "@/lib/geocode";
import { resolverBarrioPorCoordenadas, barrioMasCercano } from "@/lib/barrios-geo";
import { RECORRIDO_COORDS } from "@/lib/recorrido-coords";
import {
  buscarRecoleccionPorBarrio,
  RECORRIDOS_BARRIDO,
  type NucleoRecoleccion,
  type RecorridoBarrido,
} from "@/lib/servicios-por-barrio";

export interface RecorridoCercano {
  recorrido: RecorridoBarrido;
  distanciaKm: number;
}

export interface ResultadoDireccion {
  barrioResuelto: string | null;
  barrioAproximado: boolean;
  nucleos: NucleoRecoleccion[];
  recorridosCercanos: RecorridoCercano[];
}

function distanciaKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/**
 * Resuelve una dirección libre (ej. "Rivadavia 100") a:
 * - el barrio oficial que la contiene (point-in-polygon contra el límite
 *   municipal de barrios) -> núcleos de recolección de ese barrio.
 * - los recorridos de barrido geográficamente más cercanos (aproximado: se
 *   compara contra un punto ancla por recorrido, no contra la geometría real
 *   del recorrido, que no está digitalizada).
 */
export async function resolverDireccion(
  direccion: string,
): Promise<ResultadoDireccion> {
  const coord = await geocodificarDireccion(direccion);

  let barrio = resolverBarrioPorCoordenadas(coord.lat, coord.lng);
  let aproximado = false;
  if (!barrio) {
    barrio = barrioMasCercano(coord.lat, coord.lng);
    aproximado = true;
  }

  const nucleos = barrio ? buscarRecoleccionPorBarrio(barrio) : [];

  const recorridosCercanos: RecorridoCercano[] = RECORRIDOS_BARRIDO.map(
    (r) => {
      const c = RECORRIDO_COORDS[r.recorrido];
      if (!c) return null;
      return { recorrido: r, distanciaKm: distanciaKm(coord, { lat: c[0], lng: c[1] }) };
    },
  )
    .filter((x): x is RecorridoCercano => x !== null)
    .sort((a, b) => a.distanciaKm - b.distanciaKm)
    .slice(0, 3);

  return { barrioResuelto: barrio, barrioAproximado: aproximado, nucleos, recorridosCercanos };
}
