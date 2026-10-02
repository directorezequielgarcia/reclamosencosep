import { editarReclamo } from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

// Edición del título y el relato por el propio vecino (reclamo no cerrado).
// Usa <details> para no ocupar lugar hasta que se necesita.
export function EditarReclamo({
  codigo,
  titulo,
  descripcion,
}: {
  codigo: string;
  titulo: string;
  descripcion: string;
}) {
  return (
    <details className="rounded-2xl border border-line bg-paper p-4 group">
      <summary className="cursor-pointer text-sm font-bold text-navy-2 list-none">
        ✏️ Editar mi reclamo
      </summary>
      <form action={editarReclamo} className="mt-3 flex flex-col gap-3">
        <input type="hidden" name="codigo" value={codigo} />
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-navy">Título (máx. 60)</span>
          <input
            name="titulo"
            defaultValue={titulo}
            maxLength={60}
            required
            className="w-full px-3 py-2 rounded-xl border border-line-strong bg-paper text-navy text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-navy">Lo que contaste (máx. 5000)</span>
          <textarea
            name="descripcion"
            defaultValue={descripcion}
            maxLength={5000}
            required
            rows={10}
            className="w-full px-3 py-2 rounded-xl border border-line-strong bg-paper text-navy text-sm"
          />
        </label>
        <p className="text-[11px] text-muted">
          El Ente conserva la versión anterior y se entera de que cambiaste el texto.
        </p>
        <SubmitButton
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-navy-2 text-white font-bold text-sm"
          pendingText="Guardando…"
        >
          Guardar cambios
        </SubmitButton>
      </form>
    </details>
  );
}
