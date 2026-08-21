"use client";

/**
 * Sube un video directo desde el navegador a Vercel Blob (bypasea el límite
 * de ~4.5 MB de las funciones serverless de Vercel). Al terminar, informa la
 * URL resultante vía onSubido — quien use este componente decide qué hacer
 * con ella (guardarla en el estado de un wizard, disparar un form, etc.).
 */
import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

const ACEPTA_VIDEO = "video/mp4,video/webm,video/quicktime,video/3gpp";
const MAX_VIDEO_MB = 50;

export type VideoSubido = { url: string; mimeType: string; bytes: number };

export function SubirVideoReclamo({
  pathnamePrefix,
  clientPayload,
  onSubido,
  deshabilitado,
  etiqueta = "🎥 Grabar o subir un video",
}: {
  pathnamePrefix: string;
  clientPayload: string;
  onSubido: (video: VideoSubido) => void;
  deshabilitado?: boolean;
  etiqueta?: string;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    setError(null);
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(`El video pesa demasiado (máx ${MAX_VIDEO_MB} MB).`);
      return;
    }

    setSubiendo(true);
    setProgreso(0);
    try {
      const nombre = `${crypto.randomUUID()}-${file.name}`;
      const blob = await upload(`${pathnamePrefix}${nombre}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload/reclamo-video",
        clientPayload,
        contentType: file.type,
        onUploadProgress: ({ percentage }) => setProgreso(percentage),
      });
      onSubido({ url: blob.url, mimeType: file.type, bytes: file.size });
    } catch (err) {
      setError(
        (err as Error).message || "No pudimos subir el video. Probá de nuevo.",
      );
    } finally {
      setSubiendo(false);
    }
  }

  const inactivo = deshabilitado || subiendo;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border border-dashed border-line-strong bg-paper-2 text-navy text-sm font-semibold ${
          inactivo ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-paper"
        }`}
      >
        {subiendo ? `Subiendo… ${progreso}%` : etiqueta}
        <input
          ref={inputRef}
          type="file"
          accept={ACEPTA_VIDEO}
          className="hidden"
          disabled={inactivo}
          onChange={onChange}
        />
      </label>
      {error && <p className="text-xs text-svc-red">{error}</p>}
    </div>
  );
}
