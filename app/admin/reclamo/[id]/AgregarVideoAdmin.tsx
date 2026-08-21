"use client";

import { useState, useTransition } from "react";
import { SubirVideoReclamo, type VideoSubido } from "@/components/ui/SubirVideoReclamo";
import { agregarVideoAdmin } from "./actions";

// Mismo patrón que AgregarVideo (vecino): el video ya está en Blob cuando
// SubirVideoReclamo avisa onSubido, acá solo falta registrar el Adjunto.
export function AgregarVideoAdmin({ reclamoId }: { reclamoId: string }) {
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubido(video: VideoSubido) {
    setError(null);
    const fd = new FormData();
    fd.append("reclamoId", reclamoId);
    fd.append("url", video.url);
    fd.append("mimeType", video.mimeType);
    fd.append("bytes", String(video.bytes));
    startTransition(async () => {
      try {
        await agregarVideoAdmin(fd);
      } catch (e) {
        setError((e as Error).message || "No pudimos guardar el video.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <SubirVideoReclamo
        pathnamePrefix={`reclamos/${reclamoId}/videos/`}
        clientPayload={JSON.stringify({ scope: "reclamo", reclamoId })}
        onSubido={onSubido}
        deshabilitado={pendiente}
      />
      {pendiente && <p className="text-xs text-muted">Guardando video…</p>}
      {error && <p className="text-xs text-svc-red">{error}</p>}
    </div>
  );
}
