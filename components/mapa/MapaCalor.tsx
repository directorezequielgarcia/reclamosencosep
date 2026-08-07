"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type * as L from "leaflet";

export type PuntoCalor = {
  lat: number;
  lng: number;
  servicio: "AGUA" | "ENERGIA" | "RESIDUOS" | "TRANSPORTE";
  estado: string;
  codigo: string;
};

type Props = {
  puntos: PuntoCalor[];
  alto?: number;
  /** Centro inicial — default Comodoro Rivadavia. */
  center?: [number, number];
  zoom?: number;
};

const COMODORO: [number, number] = [-45.864, -67.4969];

export function MapaCalor({
  puntos,
  alto = 540,
  center = COMODORO,
  zoom = 13,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const leaflet = await import("leaflet");
      // leaflet.heat es un plugin viejo que se engancha mutando un global
      // `L` (asume que Leaflet se cargó como <script>, no como módulo ESM).
      // El objeto que devuelve `import("leaflet")` es un module namespace
      // congelado (no extensible), así que el plugin no puede colgarle la
      // propiedad `heatLayer` directamente — queda undefined en silencio.
      // Usamos una copia extensible como `window.L` (mismas clases por
      // referencia) para que el plugin pueda escribirle su método, y leemos
      // heatLayer desde ahí en vez de desde el namespace original.
      const globalL = Object.assign({}, leaflet) as typeof leaflet & {
        heatLayer?: (
          points: Array<[number, number, number]>,
          options: Record<string, unknown>,
        ) => import("leaflet").Layer;
      };
      (window as unknown as { L: typeof globalL }).L = globalL;
      await import("leaflet.heat");

      if (cancelled || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = leaflet.map(containerRef.current, {
        scrollWheelZoom: true,
      });

      leaflet
        .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        })
        .addTo(map);

      // Ajustar vista al bounding box de los puntos, o usar centro default
      if (puntos.length > 0) {
        const lats = puntos.map((p) => p.lat);
        const lngs = puntos.map((p) => p.lng);
        const bounds: L.LatLngBoundsLiteral = [
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)],
        ];
        map.fitBounds(bounds, { padding: [40, 40] });
      } else {
        map.setView(center, zoom);
      }

      // Heatmap principal — gradiente rojo (intenso) → amarillo (medio) → verde (bajo)
      const heatPoints = puntos.map(
        (p) => [p.lat, p.lng, 1] as [number, number, number],
      );
      if (!globalL.heatLayer) return;
      globalL.heatLayer(heatPoints, {
        radius: 28,
        blur: 22,
        maxZoom: 17,
        gradient: {
          0.2: "#4a8b3a",
          0.5: "#f0bc40",
          0.8: "#e88a3c",
          1.0: "#c4393c",
        },
      }).addTo(map);

      // Markers por servicio: pin circular con icono SVG adentro
      const COLOR_SVC: Record<string, string> = {
        AGUA: "#4ba8c2",
        ENERGIA: "#f0bc40",
        RESIDUOS: "#4a8b3a",
        TRANSPORTE: "#7e57c2",
      };
      const SVC_LABEL: Record<string, string> = {
        AGUA: "Agua y Saneamiento",
        ENERGIA: "Energía y Alumbrado",
        RESIDUOS: "Residuos",
        TRANSPORTE: "Transporte",
      };
      // Iconos SVG inline (viewBox 24x24, fill=currentColor para heredar el color del contenedor)
      const SVG_SVC: Record<string, string> = {
        AGUA: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2c-.4 0-.7.2-.9.5C9.7 4.8 5 11.4 5 15.5 5 19.6 8.1 23 12 23s7-3.4 7-7.5C19 11.4 14.3 4.8 12.9 2.5 12.7 2.2 12.4 2 12 2z"/></svg>',
        ENERGIA: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 21c0 .6.4 1 1 1h4c.6 0 1-.4 1-1v-1H9v1zm3-19c-4.4 0-8 3.6-8 8 0 3 1.6 5.6 4 6.9V18c0 .6.4 1 1 1h6c.6 0 1-.4 1-1v-1.1c2.4-1.4 4-4 4-6.9 0-4.4-3.6-8-8-8z"/></svg>',
        RESIDUOS: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 3v1H4v2h1l1.4 14.1c.1 1.1 1 1.9 2.1 1.9h7c1.1 0 2-.8 2.1-1.9L19 6h1V4h-5V3H9zm2 5h2v10h-2V8zM7.5 8h1.6l.5 10H8l-.5-10zm7.4 0h1.6l-.5 10h-1.6l.5-10z"/></svg>',
        TRANSPORTE: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 3a3 3 0 0 0-3 3v10c0 1.3.8 2.4 2 2.8V21a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2h8v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2.2c1.2-.4 2-1.5 2-2.8V6a3 3 0 0 0-3-3H6zm0 2h12c.6 0 1 .4 1 1v4H5V6c0-.6.4-1 1-1zm.5 8a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm11 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/></svg>',
      };
      for (const p of puntos) {
        const color = COLOR_SVC[p.servicio] ?? "#1d3550";
        const svg = SVG_SVC[p.servicio] ?? "";
        const html = `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:${color};color:#fff;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);">${svg}</div>`;
        const icon = leaflet.divIcon({
          className: "encosep-mapa-pin",
          html,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -16],
        });
        leaflet
          .marker([p.lat, p.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<div style="font-family: Inter, system-ui, sans-serif; font-size: 12px;">
              <strong>#${p.codigo}</strong><br/>
              ${SVC_LABEL[p.servicio] ?? p.servicio}<br/>
              <span style="color:#6c7a8c">${p.estado.toLowerCase().replace(/_/g, " ")}</span>
            </div>`,
          );
      }

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [puntos, center, zoom]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl overflow-hidden border border-line"
      style={{ height: alto }}
    />
  );
}
