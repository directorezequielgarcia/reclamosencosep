import Link from "next/link";

/**
 * Botón flotante de RECLAMOS (FAB) — visible en todas las páginas públicas.
 * Replicado del sitio institucional ENCOSEP.
 */
export function FabReclamos() {
  return (
    <Link
      href="/reclamos"
      aria-label="Hacer un reclamo"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-svc-red text-white text-sm font-bold uppercase tracking-wider shadow-2xl shadow-svc-red/40 hover:scale-105 transition"
    >
      <span className="text-xl leading-none" aria-hidden>
        ＋
      </span>
      <span>Reclamos</span>
    </Link>
  );
}
