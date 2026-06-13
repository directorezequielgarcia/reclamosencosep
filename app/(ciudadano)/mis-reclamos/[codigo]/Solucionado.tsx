"use client";

import { marcarSolucionado } from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

// El vecino avisa que su reclamo se solucionó. Pide confirmación.
export function Solucionado({ codigo }: { codigo: string }) {
  return (
    <form
      action={marcarSolucionado}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "¿Confirmás que tu reclamo se solucionó? Lo marcaremos como resuelto.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="codigo" value={codigo} />
      <SubmitButton
        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-svc-green text-white font-bold text-sm hover:opacity-90 transition"
        pendingText="Guardando…"
      >
        ✓ Mi reclamo se solucionó
      </SubmitButton>
    </form>
  );
}
