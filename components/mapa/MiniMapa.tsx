"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type * as L from "leaflet";

type Props = {
  lat: number;
  lng: number;
  alto?: number;
  zoom?: number;
};

export function MiniMapa({ lat, lng, alto = 200, zoom = 16 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const leaflet = await import("leaflet");
      if (cancelled || !containerRef.current) return;

      // Arreglar el ícono default (Leaflet busca rutas relativas que no existen
      // cuando se sirve desde un bundler).
      const iconRetinaUrl =
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
      const iconUrl =
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
      const shadowUrl =
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";
      // @ts-expect-error _getIconUrl no está tipado pero hace falta limpiarlo
      delete leaflet.Icon.Default.prototype._getIconUrl;
      leaflet.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      const map = leaflet.map(containerRef.current).setView([lat, lng], zoom);
      leaflet
        .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 19,
        })
        .addTo(map);
      leaflet.marker([lat, lng]).addTo(map);
      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, zoom]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border border-line"
      style={{ height: alto }}
    />
  );
}
