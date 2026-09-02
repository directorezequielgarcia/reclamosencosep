"use client";

export function BotonImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-4 py-2 rounded-lg bg-navy-2 text-white font-semibold text-sm"
    >
      🖨️ Imprimir / Guardar PDF
    </button>
  );
}
