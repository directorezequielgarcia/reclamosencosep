import Link from "next/link";

export type Miga = { label: string; href?: string };

// Migaja de navegación del sitio público (arriba de cada página interna).
// Antepone "Inicio" automáticamente. El último ítem es la página actual.
export function MigajasSitio({ items }: { items: Miga[] }) {
  const todas: Miga[] = [{ label: "Inicio", href: "/" }, ...items];
  return (
    <nav
      aria-label="Migas de pan"
      className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted"
    >
      {todas.map((m, i) => (
        <span key={`${m.label}-${i}`} className="flex items-center gap-2">
          {m.href ? (
            <Link href={m.href} className="hover:text-navy font-semibold">
              {m.label}
            </Link>
          ) : (
            <span className="text-navy font-semibold">{m.label}</span>
          )}
          {i < todas.length - 1 ? <span aria-hidden>/</span> : null}
        </span>
      ))}
    </nav>
  );
}

// Bloque "volver" al pie de cada página interna. `volverA` agrega un botón
// principal hacia la sección padre; siempre se ofrece "Ir al inicio".
export function VolverInicio({ volverA }: { volverA?: Miga }) {
  return (
    <div className="mt-10 flex flex-wrap gap-3">
      {volverA ? (
        <Link
          href={volverA.href ?? "/"}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-navy-2 text-white font-bold text-sm"
        >
          ← {volverA.label}
        </Link>
      ) : null}
      <Link
        href="/"
        className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-line-strong text-navy font-bold text-sm hover:bg-paper-2"
      >
        Ir al inicio
      </Link>
    </div>
  );
}
