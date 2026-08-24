"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type * as L from "leaflet";

/**
 * Mapa real (Leaflet + OpenStreetMap) con el trazado de una línea, a partir
 * de las coordenadas reales que publica la Municipalidad (mismo dataset que
 * usa ZorritoGuia). Se consulta en vivo al abrir cada línea — no hay
 * captura estática que mantener ni que se desactualice si la Municipalidad
 * ajusta un recorrido. Sin calles de referencia el trazado solo es una
 * forma abstracta ilegible, por eso va sobre el mapa real y no como SVG suelto.
 */

const BASE = "https://comodoro-mit.github.io/transporte/layers_transporte";
const COMODORO: [number, number] = [-45.864, -67.4969];

type Geometry =
  | { type: "LineString"; coordinates: [number, number][] }
  | { type: "MultiLineString"; coordinates: [number, number][][] }
  | { type: string; coordinates: unknown };

type LineaGeoJSON = {
  features: Array<{ properties?: { sentido?: string }; geometry: Geometry }>;
};

async function fetchDataJs<T>(url: string): Promise<T> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("MCR_DATASET_DOWN");
  const texto = await resp.text();
  const idx = texto.indexOf("=");
  const jsonTexto = texto.slice(idx + 1).trim().replace(/;\s*$/, "");
  return JSON.parse(jsonTexto) as T;
}

function extraerLineas(geom: Geometry): [number, number][][] {
  if (geom.type === "LineString") return [geom.coordinates as [number, number][]];
  if (geom.type === "MultiLineString") return geom.coordinates as [number, number][][];
  return [];
}

const COLORES = ["#7e57c2", "#c4393c", "#2e8b57", "#e88a3c"];

type ItemLeyenda = { color: string; dash: boolean; etiqueta: string };

function capitalizar(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function MiniMapaLinea({ codigos }: { codigos: string[] }) {
  const [estado, setEstado] = useState<"cargando" | "ok" | "error" | "mantenimiento">("cargando");
  const [leyenda, setLeyenda] = useState<ItemLeyenda[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [leaflet, datos] = await Promise.all([
          import("leaflet"),
          Promise.all(
            codigos.map(async (codigo) => ({
              codigo,
              data: await fetchDataJs<LineaGeoJSON>(`${BASE}/linea_${codigo}_data.js`),
            })),
          ),
        ]);
        if (cancelado || !containerRef.current) return;

        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const map = leaflet.map(containerRef.current, { scrollWheelZoom: false });
        leaflet
          .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          })
          .addTo(map);

        const todosLosPuntos: [number, number][] = [];
        const leyendaNueva: ItemLeyenda[] = [];
        datos.forEach(({ codigo, data }, i) => {
          data.features.forEach((f, j) => {
            const color = COLORES[(i * 2 + j) % COLORES.length];
            const dash = j === 1;
            const sentido = f.properties?.sentido
              ? capitalizar(f.properties.sentido)
              : j === 0
                ? "Ida"
                : "Vuelta";
            const etiqueta = codigos.length > 1 ? `${codigo}: ${sentido}` : sentido;
            let dibujado = false;
            for (const linea of extraerLineas(f.geometry)) {
              const puntosLatLng = linea.map(
                ([lng, lat]) => [lat, lng] as [number, number],
              );
              todosLosPuntos.push(...puntosLatLng);
              leaflet
                .polyline(puntosLatLng, {
                  color,
                  weight: j === 0 ? 4 : 3,
                  opacity: 0.85,
                  dashArray: dash ? "6 6" : undefined,
                })
                .addTo(map);
              dibujado = true;
            }
            if (dibujado) leyendaNueva.push({ color, dash, etiqueta });
          });
        });

        if (todosLosPuntos.length > 0) {
          map.fitBounds(todosLosPuntos, { padding: [16, 16] });
        } else {
          map.setView(COMODORO, 12);
        }

        mapRef.current = map;
        setLeyenda(leyendaNueva);
        setEstado("ok");
      } catch (err) {
        if (cancelado) return;
        setEstado(err instanceof Error && err.message === "MCR_DATASET_DOWN" ? "mantenimiento" : "error");
      }
    })();

    return () => {
      cancelado = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [codigos]);

  return (
    <div className="flex flex-col gap-1.5">
      <div
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden border border-line bg-paper-2"
        style={{ height: 240 }}
      />
      {estado === "cargando" && (
        <div className="text-xs text-muted text-center">Cargando mapa del recorrido…</div>
      )}
      {estado === "error" && (
        <div className="text-xs text-muted text-center">
          No pudimos cargar el mapa de este recorrido ahora.
        </div>
      )}
      {estado === "mantenimiento" && (
        <div className="text-xs text-muted text-center px-2">
          El mapa oficial de la Municipalidad está en mantenimiento (probablemente actualizando los recorridos a la nueva resolución). Mientras tanto, guiate por el detalle calle por calle de abajo.
        </div>
      )}
      {estado === "ok" && (
        <div className="flex flex-col items-center gap-1">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            {leyenda.map((item) => (
              <span
                key={item.etiqueta}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-navy"
              >
                <svg width="20" height="8" aria-hidden>
                  <line
                    x1="0"
                    y1="4"
                    x2="20"
                    y2="4"
                    stroke={item.color}
                    strokeWidth="3"
                    strokeDasharray={item.dash ? "4 3" : undefined}
                    strokeLinecap="round"
                  />
                </svg>
                {item.etiqueta}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-muted text-center">
            Trazado real desde datos públicos del mapa oficial de transporte.
          </p>
        </div>
      )}
    </div>
  );
}
