"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Barra de control (no se imprime) para las vistas "/imprimir": deja elegir
 * el tamaño de página (A4 u Oficio) antes de abrir el diálogo de impresión
 * del navegador — desde ahí el usuario elige destino "Guardar como PDF".
 */
export function ImpresionControles({
  volverHref,
  volverLabel,
}: {
  volverHref: string;
  volverLabel: string;
}) {
  const [pagina, setPagina] = useState<"a4" | "oficio">("a4");

  return (
    <>
      <style>{`
        @media print {
          @page { size: ${pagina === "oficio" ? "8.5in 13in" : "A4"}; margin: 2cm 2.2cm; }
          body * { visibility: hidden; }
          #doc, #doc * { visibility: visible; }
          #doc { position: absolute; left: 0; top: 0; width: 100%; }
          .foja { page-break-before: always; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="no-print sticky top-0 z-10 bg-navy text-white px-5 py-3 flex flex-wrap items-center gap-3 justify-between">
        <Link href={volverHref} className="text-sm underline">
          {volverLabel}
        </Link>
        <div className="flex items-center gap-3">
          <label className="text-xs flex items-center gap-1.5">
            Tamaño de página
            <select
              value={pagina}
              onChange={(e) => setPagina(e.target.value as "a4" | "oficio")}
              className="text-navy text-xs rounded px-2 py-1"
            >
              <option value="a4">A4</option>
              <option value="oficio">Oficio</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg bg-svc-orange text-white font-bold text-sm"
          >
            🖨️ Imprimir / Guardar PDF
          </button>
        </div>
      </div>
    </>
  );
}
