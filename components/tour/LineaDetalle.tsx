"use client";

import { useState } from "react";
import { MiniMapaLinea } from "./MiniMapaLinea";

// Mapea el número mostrado en el listado al/los código(s) de archivo real(es)
// del dataset oficial (algunas líneas tienen más de un ramal publicado por
// separado: 5/5U, 6A/6B, 8H/8AH).
const CODIGOS_ARCHIVO: Record<string, string[]> = {
  "1": ["1"],
  "2": ["2"],
  "3": ["3"],
  "4": ["4"],
  "5": ["5", "5U"],
  "6": ["6A", "6B"],
  "7": ["7"],
  "8": ["8H", "8AH"],
  "9": ["9"],
  "12": ["12"],
  "13": ["13"],
  "14": ["14"],
  "15": ["15"],
  "16": ["16"],
  "17": ["17"],
  "18": ["18"],
  "19": ["19"],
  "20": ["20"],
  "21": ["21"],
  "22": ["22"],
};

export function LineaDetalle({
  numero,
  resumen,
  tramos,
}: {
  numero: string;
  resumen: string;
  tramos: Array<{ etiqueta: string; texto: string }>;
}) {
  const [abierto, setAbierto] = useState(false);
  const codigosMapa = CODIGOS_ARCHIVO[numero] ?? [numero];

  return (
    <details
      id={`linea-${numero}`}
      className="group rounded-xl border border-line bg-paper open:border-[#7e57c2]/50 scroll-mt-24"
      onToggle={(e) => setAbierto((e.target as HTMLDetailsElement).open)}
    >
      <summary className="flex items-center gap-3 p-3 cursor-pointer list-none">
        <span className="shrink-0 w-9 h-9 rounded-full bg-[#7e57c2]/15 border-2 border-[#7e57c2]/60 text-[#7e57c2] font-extrabold text-sm flex items-center justify-center">
          {numero}
        </span>
        <span className="text-sm text-navy font-semibold flex-1">{resumen}</span>
        <span className="text-muted text-xs shrink-0 group-open:hidden">
          ver recorrido ▾
        </span>
        <span className="text-muted text-xs shrink-0 hidden group-open:inline">
          ocultar ▴
        </span>
      </summary>
      <div className="px-3 pb-3 pt-1 flex flex-col gap-3 border-t border-line">
        {abierto && <MiniMapaLinea codigos={codigosMapa} />}
        <div className="flex flex-col gap-2">
          {tramos.map((t) => (
            <div key={t.etiqueta}>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#7e57c2]">
                {t.etiqueta}
              </div>
              <p className="text-xs text-navy leading-relaxed mt-0.5">{t.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
