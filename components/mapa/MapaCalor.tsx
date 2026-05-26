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
      const heatLayer = (
        leaflet as unknown as {
          heatLayer: (
            points: Array<[number, number, number]>,
            options: Record<string, unknown>,
          ) => L.Layer;
        }
      ).heatLayer;
      heatLayer(heatPoints, {
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

      // Markers tenues encima — círculos chicos por servicio
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
      for (const p of puntos) {
        const c = leaflet.circleMarker([p.lat, p.lng], {
          radius: 9,
          color: "#ffffff",
          weight: 2.5,
          fillColor: COLOR_SVC[p.servicio] ?? "#1d3550",
          fillOpacity: 1,
          opacity: 1,
        }).addTo(map);
        c.bindPopup(
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
