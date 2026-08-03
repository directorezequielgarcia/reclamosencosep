"use client";

import { useState } from "react";

/**
 * "Zorrito Guía" — responde ¿dónde estoy? ¿qué paradas hay? ¿qué líneas pasan
 * por acá?, usando los datos geográficos reales y públicos que publica la
 * Municipalidad para su propio mapa interactivo (comodoro-mit.github.io).
 * No se copian esos datos al repo: se consultan en vivo (CORS abierto), así
 * nunca quedan desactualizados si la Municipalidad corrige un recorrido.
 */

const BASE = "https://comodoro-mit.github.io/transporte/layers_transporte";

// Códigos reales de archivo publicados por el mapa oficial (23 líneas).
const CODIGOS_LINEA = [
  "1", "2", "3", "4", "5", "5U", "6A", "6B", "7", "8H", "8AH", "9",
  "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22",
];

// Mapea el código de archivo al numero usado como id en la lista de líneas
// de esta página (linea-1, linea-8, etc.) — 5U->5, 6A/6B->6, 8H/8AH->8.
function numeroAncla(codigo: string) {
  return codigo.replace(/[A-Z]+$/, "");
}

type Parada = {
  id: number;
  lat: number;
  lng: number;
  calle: string;
  esquina: string;
  poste: boolean;
  cartel: boolean;
  refugio: boolean;
};

// El dataset mezcla LineString (coordinates: [[lng,lat],...]) y
// MultiLineString (coordinates: [[[lng,lat],...], [[lng,lat],...]]) según la
// línea — hay que soportar las dos formas o esa línea queda invisible.
type LineaGeoJSON = {
  features: Array<{
    properties: { linea: string; sentido: string };
    geometry:
      | { type: "LineString"; coordinates: [number, number][] }
      | { type: "MultiLineString"; coordinates: [number, number][][] }
      | { type: string; coordinates: unknown };
  }>;
};

async function fetchDataJs<T>(url: string): Promise<T> {
  const texto = await fetch(url).then((r) => r.text());
  const idx = texto.indexOf("=");
  const jsonTexto = texto
    .slice(idx + 1)
    .trim()
    .replace(/;\s*$/, "");
  return JSON.parse(jsonTexto) as T;
}

function distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Proyección plana local (suficientemente precisa a escala de una ciudad)
// para calcular distancia punto-a-segmento en metros.
function proyectar(lat: number, lng: number, latRef: number) {
  const metrosPorGradoLat = 111320;
  const metrosPorGradoLng = 111320 * Math.cos((latRef * Math.PI) / 180);
  return { x: lng * metrosPorGradoLng, y: lat * metrosPorGradoLat };
}

function distPuntoSegmento(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function distanciaSegmentos(p: { x: number; y: number }, lat: number, coords: [number, number][]) {
  let min = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lngA, latA] = coords[i];
    const [lngB, latB] = coords[i + 1];
    const a = proyectar(latA, lngA, lat);
    const b = proyectar(latB, lngB, lat);
    const d = distPuntoSegmento(p.x, p.y, a.x, a.y, b.x, b.y);
    if (d < min) min = d;
  }
  return min;
}

function distanciaAminea(lat: number, lng: number, linea: LineaGeoJSON) {
  const p = proyectar(lat, lng, lat);
  let min = Infinity;
  for (const f of linea.features) {
    const geom = f.geometry;
    if (geom?.type === "LineString") {
      const d = distanciaSegmentos(p, lat, geom.coordinates as [number, number][]);
      if (d < min) min = d;
    } else if (geom?.type === "MultiLineString") {
      for (const linea2 of geom.coordinates as [number, number][][]) {
        const d = distanciaSegmentos(p, lat, linea2);
        if (d < min) min = d;
      }
    }
  }
  return min;
}

type Resultado = {
  paradasCercanas: Array<Parada & { distancia: number }>;
  lineasCercanas: Array<{ codigo: string; distancia: number }>;
};

export function ZorritoGuia() {
  const [estado, setEstado] = useState<"idle" | "buscando" | "ok" | "error">("idle");
  const [resultado, setResultado] = useState<Resultado | null>(null);

  function irALinea(codigo: string) {
    const id = `linea-${numeroAncla(codigo)}`;
    const el = document.getElementById(id);
    if (el instanceof HTMLDetailsElement) {
      el.open = true;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function buscar() {
    if (!navigator.geolocation) {
      setEstado("error");
      return;
    }
    setEstado("buscando");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;

          const [paradas, ...lineas] = await Promise.all([
            fetchDataJs<Parada[]>(`${BASE}/paradas_data.js`),
            ...CODIGOS_LINEA.map((c) =>
              fetchDataJs<LineaGeoJSON>(`${BASE}/linea_${c}_data.js`),
            ),
          ]);

          const paradasCercanas = paradas
            .map((p) => ({ ...p, distancia: distanciaMetros(lat, lng, p.lat, p.lng) }))
            .sort((a, b) => a.distancia - b.distancia)
            .slice(0, 4);

          const lineasCercanas = CODIGOS_LINEA.map((codigo, i) => ({
            codigo,
            distancia: distanciaAminea(lat, lng, lineas[i]),
          }))
            .sort((a, b) => a.distancia - b.distancia)
            .slice(0, 6);

          setResultado({ paradasCercanas, lineasCercanas });
          setEstado("ok");
        } catch {
          setEstado("error");
        }
      },
      () => setEstado("error"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[#7e57c2]/40 bg-paper-2 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 shrink-0 rounded-full overflow-hidden border-2 border-[#7e57c2]/50 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/imagenes/zorrito/zorrito-parado.png"
            alt=""
            className="w-full h-full object-cover object-top"
          />
        </div>
        <div>
          <div className="text-sm font-extrabold text-navy">Zorrito Guía</div>
          <div className="text-xs text-muted">
            ¿Dónde estoy? ¿Qué paradas y líneas tengo cerca?
          </div>
        </div>
      </div>

      {estado === "idle" && (
        <button
          type="button"
          onClick={buscar}
          className="w-full px-4 py-2.5 rounded-xl bg-[#7e57c2] text-white font-bold text-sm hover:scale-[1.02] transition"
        >
          📍 Usar mi ubicación
        </button>
      )}

      {estado === "buscando" && (
        <div className="text-sm text-muted text-center py-2">
          Buscando paradas y líneas cerca tuyo…
        </div>
      )}

      {estado === "error" && (
        <div className="text-sm text-svc-red text-center py-2">
          No pudimos obtener tu ubicación. Probá de nuevo o usá el{" "}
          <a
            href="https://comodoro-mit.github.io/transporte"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            mapa interactivo completo
          </a>
          .
        </div>
      )}

      {estado === "ok" && resultado && (
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
              Paradas más cercanas
            </div>
            <div className="flex flex-col gap-1.5">
              {resultado.paradasCercanas.map((p) => (
                <a
                  key={p.id}
                  href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=walking`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-lg border border-line bg-paper px-3 py-2 hover:border-[#7e57c2]/50 hover:bg-[#7e57c2]/5 transition"
                  title="Ir hasta esta parada con Google Maps"
                >
                  <span className="text-xs text-navy">
                    🧭 {p.calle} y {p.esquina}
                    {p.refugio && " 🏠"}
                  </span>
                  <span className="text-xs text-muted font-mono shrink-0">
                    {Math.round(p.distancia)} m
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
              Líneas que pasan cerca
            </div>
            <div className="flex flex-wrap gap-2">
              {resultado.lineasCercanas.map((l) => (
                <button
                  key={l.codigo}
                  type="button"
                  onClick={() => irALinea(l.codigo)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[#7e57c2]/60 bg-[#7e57c2]/10 text-[#7e57c2] text-xs font-extrabold hover:bg-[#7e57c2]/20 transition"
                  title="Ver el recorrido completo de esta línea"
                >
                  {l.codigo}
                  <span className="font-normal text-navy">
                    · {Math.round(l.distancia)} m
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={buscar}
            className="text-xs text-navy-2 underline underline-offset-4 self-center mt-1"
          >
            Volver a buscar mi ubicación
          </button>
        </div>
      )}
    </div>
  );
}
