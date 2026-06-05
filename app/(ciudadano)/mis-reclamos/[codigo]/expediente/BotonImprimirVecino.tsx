"use client";

export function BotonImprimirVecino() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-4 py-2 rounded-lg bg-svc-orange text-white font-bold text-sm"
    >
      🖨️ Imprimir / Guardar PDF
    </button>
  );
}
