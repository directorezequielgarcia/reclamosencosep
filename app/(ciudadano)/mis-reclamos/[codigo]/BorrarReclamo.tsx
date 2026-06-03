"use client";

import { borrarReclamo } from "./actions";

// Borrado del reclamo por el propio vecino — solo disponible mientras el
// reclamo no fue revisado (estado RECIBIDO). Pide confirmación para evitar
// borrados accidentales.
export function BorrarReclamo({ codigo }: { codigo: string }) {
  return (
    <form
      action={borrarReclamo}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "¿Seguro que querés borrar este reclamo? Esta acción no se puede deshacer.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="codigo" value={codigo} />
      <button
        type="submit"
        className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-svc-red text-svc-red font-bold text-sm hover:bg-svc-red/10 transition"
      >
        Borrar reclamo
      </button>
    </form>
  );
}
