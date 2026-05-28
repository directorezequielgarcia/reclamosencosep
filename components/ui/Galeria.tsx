"use client";

/**
 * Galería de fotos con lightbox modal.
 * Renderiza una grilla compacta y, al hacer click en una foto, abre un
 * visor a pantalla completa con flechas anterior/siguiente, contador y
 * cierre por tecla Escape o click en el fondo.
 */
import { useCallback, useEffect, useState } from "react";

export type GaleriaFoto = {
  id: string;
  url: string;
  descripcion?: string | null;
};

export function Galeria({
  fotos,
  titulo,
}: {
  fotos: GaleriaFoto[];
  titulo?: string;
}) {
  const [idx, setIdx] = useState<number | null>(null);
  const abierta = idx !== null;

  const cerrar = useCallback(() => setIdx(null), []);
  const anterior = useCallback(
    () => setIdx((i) => (i === null ? null : (i - 1 + fotos.length) % fotos.length)),
    [fotos.length],
  );
  const siguiente = useCallback(
    () => setIdx((i) => (i === null ? null : (i + 1) % fotos.length)),
    [fotos.length],
  );

  // Atajos de teclado y bloqueo de scroll del body cuando el lightbox está abierto
  useEffect(() => {
    if (!abierta) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") cerrar();
      else if (e.key === "ArrowLeft") anterior();
      else if (e.key === "ArrowRight") siguiente();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [abierta, cerrar, anterior, siguiente]);

  if (fotos.length === 0) return null;

  const fotoActiva = idx !== null ? fotos[idx] : null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {fotos.map((f, i) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setIdx(i)}
            className="block rounded-lg overflow-hidden border border-line hover:border-navy-2 transition group relative aspect-square"
            aria-label={f.descripcion ?? `Foto ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={f.url}
              alt={f.descripcion ?? `Foto ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition"
              loading="lazy"
            />
            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-bold rounded px-1.5 py-0.5">
              {i + 1}/{fotos.length}
            </span>
          </button>
        ))}
      </div>

      {fotoActiva && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={cerrar}
          role="dialog"
          aria-modal="true"
          aria-label={titulo ?? "Galería de fotos"}
        >
          {/* Cerrar */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cerrar();
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white text-xl font-bold hover:bg-white/25 backdrop-blur"
            aria-label="Cerrar galería"
          >
            ×
          </button>

          {/* Contador y descripción */}
          <div className="absolute top-4 left-4 text-white text-xs font-semibold bg-black/40 rounded-full px-3 py-1 backdrop-blur">
            {idx! + 1} / {fotos.length}
            {titulo && <span className="opacity-70 ml-2">· {titulo}</span>}
          </div>

          {/* Anterior */}
          {fotos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                anterior();
              }}
              className="absolute left-2 sm:left-4 w-11 h-11 rounded-full bg-white/15 text-white text-2xl font-bold hover:bg-white/25 backdrop-blur"
              aria-label="Anterior"
            >
              ‹
            </button>
          )}

          {/* Imagen + descripción */}
          <div
            className="flex flex-col items-center max-w-5xl w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotoActiva.url}
              alt={fotoActiva.descripcion ?? "Foto"}
              className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            {fotoActiva.descripcion && (
              <div className="mt-3 text-white text-sm text-center max-w-2xl px-4">
                {fotoActiva.descripcion}
              </div>
            )}
            <a
              href={fotoActiva.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-2 text-xs text-white/70 underline underline-offset-4 hover:text-white"
            >
              Abrir original ↗
            </a>
          </div>

          {/* Siguiente */}
          {fotos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                siguiente();
              }}
              className="absolute right-2 sm:right-4 w-11 h-11 rounded-full bg-white/15 text-white text-2xl font-bold hover:bg-white/25 backdrop-blur"
              aria-label="Siguiente"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}
