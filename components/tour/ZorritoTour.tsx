"use client";

import { useCallback, useEffect, useState } from "react";

type PoseZorrito = "parado" | "agachado" | "colectivo";

type PasoTour = {
  // Si no hay targetId, es un paso "centrado" (bienvenida / cierre) sin resaltado.
  targetId?: string;
  pose: PoseZorrito;
  texto: string;
};

const POSES: Record<PoseZorrito, string> = {
  parado: "/imagenes/zorrito/zorrito-parado.png",
  agachado: "/imagenes/zorrito/zorrito-agachado.png",
  colectivo: "/imagenes/zorrito/zorrito-colectivo.png",
};

/**
 * Tour guiado con la mascota del ENCOSEP (el Zorrito). Resalta elementos de
 * la página por su id y muestra un panel fijo abajo con texto + navegación.
 * Se auto-abre la primera vez (por storageKey) y siempre queda disponible
 * desde el botón flotante circular.
 */
export function ZorritoTour({
  storageKey,
  pasos,
}: {
  storageKey: string;
  pasos: PasoTour[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState(0);
  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const visto = window.localStorage.getItem(storageKey);
    if (!visto) {
      const t = setTimeout(() => setAbierto(true), 800);
      return () => clearTimeout(t);
    }
  }, [storageKey]);

  const actualizarResaltado = useCallback(() => {
    const targetId = pasos[paso]?.targetId;
    if (!targetId) {
      setRect(null);
      return;
    }
    const el = document.getElementById(targetId);
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }, 350);
  }, [paso, pasos]);

  useEffect(() => {
    if (!abierto) return;
    actualizarResaltado();
    window.addEventListener("resize", actualizarResaltado);
    window.addEventListener("scroll", actualizarResaltado, true);
    return () => {
      window.removeEventListener("resize", actualizarResaltado);
      window.removeEventListener("scroll", actualizarResaltado, true);
    };
  }, [abierto, actualizarResaltado]);

  function cerrar() {
    setAbierto(false);
    setPaso(0);
    window.localStorage.setItem(storageKey, "1");
  }

  if (pasos.length === 0) return null;
  const actual = pasos[paso];
  const esUltimo = paso === pasos.length - 1;

  return (
    <>
      {/* Botón flotante — centrado abajo para no chocar con WhatsApp (izq) y Reclamos (der) */}
      <button
        type="button"
        onClick={() => {
          setPaso(0);
          setAbierto(true);
        }}
        aria-label="Abrir guía del Zorrito ENCOSEP"
        title="Guía del Zorrito ENCOSEP"
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-20 h-20 rounded-full border-2 border-[#7e57c2] bg-white shadow-2xl shadow-[#7e57c2]/30 overflow-hidden hover:scale-105 transition"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={POSES.parado}
          alt="Zorrito, guía del ENCOSEP"
          className="w-full h-full object-cover object-top"
        />
      </button>

      {abierto && (
        <>
          {rect && (
            <div
              aria-hidden
              className="fixed z-40 rounded-xl ring-4 ring-[#7e57c2] ring-offset-2 pointer-events-none transition-all duration-300"
              style={{
                top: rect.top - 6,
                left: rect.left - 6,
                width: rect.width + 12,
                height: rect.height + 12,
              }}
            />
          )}

          <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
            <div className="w-full max-w-lg rounded-2xl border-2 border-[#7e57c2]/60 bg-paper shadow-2xl p-4 flex gap-3">
              <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden border-2 border-[#7e57c2]/50 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={POSES[actual.pose]}
                  alt=""
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-navy leading-snug">{actual.texto}</p>
                <div className="flex items-center justify-between mt-3 gap-2">
                  <button
                    type="button"
                    onClick={cerrar}
                    className="text-xs text-muted underline underline-offset-4"
                  >
                    {esUltimo ? "Cerrar" : "Saltar"}
                  </button>
                  <div className="flex gap-2">
                    {paso > 0 && (
                      <button
                        type="button"
                        onClick={() => setPaso((p) => p - 1)}
                        className="px-3 py-1.5 rounded-lg border border-line-strong text-navy text-xs font-semibold"
                      >
                        Atrás
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => (esUltimo ? cerrar() : setPaso((p) => p + 1))}
                      className="px-4 py-1.5 rounded-lg bg-[#7e57c2] text-white text-xs font-bold"
                    >
                      {esUltimo ? "¡Listo!" : "Siguiente"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
