"use client";

import { useEffect, useState } from "react";

/**
 * Dibuja el trazado real de una línea (ida/vuelta, o varios ramales) como
 * SVG a partir de las coordenadas reales que publica la Municipalidad
 * (mismo dataset que usa ZorritoGuia). Se consulta en vivo cada vez que se
 * abre — no hay captura estática que mantener ni que se desactualice si
 * la Municipalidad ajusta un recorrido.
 */

const BASE = "https://comodoro-mit.github.io/transporte/layers_transporte";

type Geometry =
  | { type: "LineString"; coordinates: [number, number][] }
  | { type: "MultiLineString"; coordinates: [number, number][][] }
  | { type: string; coordinates: unknown };

type LineaGeoJSON = {
  features: Array<{ properties?: { sentido?: string }; geometry: Geometry }>;
};

async function fetchDataJs<T>(url: string): Promise<T> {
  const texto = await fetch(url).then((r) => r.text());
  const idx = texto.indexOf("=");
  const jsonTexto = texto.slice(idx + 1).trim().replace(/;\s*$/, "");
  return JSON.parse(jsonTexto) as T;
}

function extraerLineas(geom: Geometry): [number, number][][] {
  if (geom.type === "LineString") return [geom.coordinates as [number, number][]];
  if (geom.type === "MultiLineString") return geom.coordinates as [number, number][][];
  return [];
}

const ANCHO = 320;
const ALTO = 190;
const PADDING = 14;
const COLORES = ["#7e57c2", "#c4393c", "#2e8b57", "#e88a3c"];

type RutaArchivo = {
  codigo: string;
  trazos: Array<{ puntos: [number, number][][] }>;
};

function construirRutasSvg(
  lineasPorArchivo: Array<{ codigo: string; data: LineaGeoJSON }>,
): RutaArchivo[] | null {
  const todasLasLineas: [number, number][][] = [];
  for (const { data } of lineasPorArchivo) {
    for (const f of data.features) todasLasLineas.push(...extraerLineas(f.geometry));
  }
  if (todasLasLineas.length === 0) return null;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const linea of todasLasLineas) {
    for (const [lng, lat] of linea) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }
  const latRef = (minLat + maxLat) / 2;
  const corr = Math.cos((latRef * Math.PI) / 180);
  const rangoX = (maxLng - minLng) * corr || 1;
  const rangoY = maxLat - minLat || 1;
  const escala = Math.min(
    (ANCHO - PADDING * 2) / rangoX,
    (ALTO - PADDING * 2) / rangoY,
  );

  const proyectar = ([lng, lat]: [number, number]): [number, number] => [
    (lng - minLng) * corr * escala + PADDING,
    (maxLat - lat) * escala + PADDING,
  ];

  return lineasPorArchivo.map(({ codigo, data }) => ({
    codigo,
    trazos: data.features.map((f) => ({
      puntos: extraerLineas(f.geometry).map((linea) => linea.map(proyectar)),
    })),
  }));
}

export function MiniMapaLinea({ codigos }: { codigos: string[] }) {
  const [estado, setEstado] = useState<"cargando" | "ok" | "error">("cargando");
  const [rutas, setRutas] = useState<RutaArchivo[] | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const datos = await Promise.all(
          codigos.map(async (codigo) => ({
            codigo,
            data: await fetchDataJs<LineaGeoJSON>(`${BASE}/linea_${codigo}_data.js`),
          })),
        );
        if (cancelado) return;
        setRutas(construirRutasSvg(datos));
        setEstado("ok");
      } catch {
        if (!cancelado) setEstado("error");
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [codigos]);

  if (estado === "cargando") {
    return (
      <div className="text-xs text-muted py-4 text-center">
        Cargando mapa del recorrido…
      </div>
    );
  }
  if (estado === "error" || !rutas) {
    return (
      <div className="text-xs text-muted py-2 text-center">
        No pudimos cargar el mapa de este recorrido ahora.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {rutas.map((ruta, i) => (
        <div key={ruta.codigo} className="flex flex-col items-center">
          {rutas.length > 1 && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
              Recorrido {ruta.codigo}
            </div>
          )}
          <svg
            viewBox={`0 0 ${ANCHO} ${ALTO}`}
            className="w-full max-w-xs rounded-lg border border-line bg-paper-2"
          >
            {ruta.trazos.map((trazo, j) =>
              trazo.puntos.map((linea, k) => (
                <polyline
                  key={`${j}-${k}`}
                  points={linea.map(([x, y]) => `${x},${y}`).join(" ")}
                  fill="none"
                  stroke={COLORES[(i * 2 + j) % COLORES.length]}
                  strokeWidth={j === 0 ? 2.5 : 1.5}
                  strokeDasharray={j === 1 ? "4 3" : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.9}
                />
              )),
            )}
          </svg>
        </div>
      ))}
      <p className="text-[10px] text-muted text-center">
        Trazado real desde datos públicos del mapa oficial de transporte.
      </p>
    </div>
  );
}
