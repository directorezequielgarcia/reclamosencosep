"use client";

import { useState, useTransition } from "react";
import { SubirVideoReclamo, type VideoSubido } from "@/components/ui/SubirVideoReclamo";
import { agregarVideoReclamo } from "./actions";

// El video ya está en Blob cuando SubirVideoReclamo avisa onSubido — acá solo
// falta que el server registre el Adjunto. Se llama a la Server Action
// directo (sin <form>, no hace falta progressive enhancement: esto ya
// depende de JS para la subida a Blob).
export function AgregarVideo({
  codigo,
  reclamoId,
}: {
  codigo: string;
  reclamoId: string;
}) {
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubido(video: VideoSubido) {
    setError(null);
    const fd = new FormData();
    fd.append("codigo", codigo);
    fd.append("url", video.url);
    fd.append("mimeType", video.mimeType);
    fd.append("bytes", String(video.bytes));
    startTransition(async () => {
      try {
        await agregarVideoReclamo(fd);
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
