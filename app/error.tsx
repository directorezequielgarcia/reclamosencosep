"use client";

import { useEffect } from "react";
import { LogoEncosep } from "@/components/ui/LogoEncosep";

const WSP_NUMERO = "5492974303051";
const WSP_TEXTO =
  "Hola, quiero hacer un reclamo pero la web del ENCOSEP no me está cargando en este momento.";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper px-6 py-16 text-center">
      <LogoEncosep size={72} className="mb-6" />
      <h1 className="text-2xl font-bold text-navy mb-3">
        Estamos con un inconveniente técnico
      </h1>
      <p className="max-w-md text-navy-soft mb-1">
        El sistema del Portal de Reclamos no está respondiendo en este
        momento. No es un problema con tu conexión ni con tu reclamo: ya
        estamos al tanto y va a volver a funcionar en breve.
      </p>
      <p className="max-w-md text-navy-soft mb-8">
        Probá recargar en unos minutos.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="px-6 py-3 rounded-full bg-navy text-white text-sm font-bold hover:bg-navy-2 transition"
        >
          Reintentar
        </button>
        <a
          href={`https://wa.me/${WSP_NUMERO}?text=${encodeURIComponent(WSP_TEXTO)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 rounded-full bg-svc-green text-white text-sm font-bold hover:scale-105 transition"
        >
          Hacer mi reclamo por WhatsApp
        </a>
      </div>
    </div>
  );
}
