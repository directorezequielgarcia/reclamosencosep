import Link from "next/link";

/**
 * Breadcrumb consistente para páginas de detalle del panel admin.
 * Renderiza una secuencia de migas separadas por › con el último item
 * sin link (la página actual).
 */
export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Navegación"
      className="text-xs text-muted flex items-center gap-1 flex-wrap"
    >
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {it.href && !last ? (
              <Link
                href={it.href}
                className="hover:underline hover:text-navy"
              >
                {it.label}
              </Link>
            ) : (
              <span className={last ? "text-navy font-semibold" : ""}>
                {it.label}
              </span>
            )}
            {!last && <span className="opacity-50">›</span>}
          </span>
        );
      })}
    </nav>
  );
}
