"use client";

import { useEffect, useRef, useState } from "react";
import { buscarBarrios } from "@/lib/barrios";

// Input de texto libre con sugerencias del listado oficial de barrios de
// Comodoro Rivadavia — evita que el vecino tipee mal el nombre (y se
// generen barrios "inventados" en la base), sin bloquear a quien vive en
// una chacra o zona que no está en el listado oficial.
export function BuscadorBarrio({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  function manejarCambio(texto: string) {
    onChange(texto);
    setSugerencias(buscarBarrios(texto));
    setAbierto(true);
  }

  function elegir(barrio: string) {
    onChange(barrio);
    setSugerencias([]);
    setAbierto(false);
  }

  return (
    <div ref={contenedorRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => manejarCambio(e.target.value)}
        onFocus={() => {
          setSugerencias(buscarBarrios(value));
          setAbierto(true);
        }}
        placeholder="Pueyrredón"
        autoComplete="off"
        className="w-full px-3 py-3 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
      />
      {abierto && sugerencias.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full max-h-52 overflow-auto rounded-xl border border-line-strong bg-paper shadow-lg">
          {sugerencias.map((b) => (
            <li key={b}>
              <button
                type="button"
                onClick={() => elegir(b)}
                className="w-full text-left px-3 py-2 text-sm text-navy hover:bg-paper-2"
              >
                {b}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
