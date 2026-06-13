"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type NavItem = { href: string; label: string };

function esActivo(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

// Navegación de escritorio con resaltado de la sección activa.
export function NavDesktop({ nav }: { nav: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="hidden lg:flex items-center gap-1 ml-2">
      {nav.map((n) => {
        const activo = esActivo(pathname, n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={activo ? "page" : undefined}
            className={
              "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition " +
              (activo
                ? "bg-navy text-white"
                : "text-navy hover:bg-paper-2")
            }
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

// Botón hamburguesa + panel desplegable para celular/tablet.
export function MenuMobile({
  nav,
  telHref,
  telLabel,
}: {
  nav: NavItem[];
  telHref: string;
  telLabel: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-line-strong text-navy hover:bg-paper-2"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          {open ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </>
          ) : (
            <>
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </>
          )}
        </svg>
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-20 bg-black/20"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 right-0 top-full z-30 bg-paper border-t border-line shadow-lg">
            <nav className="flex flex-col p-2 max-h-[75vh] overflow-y-auto">
              {nav.map((n) => {
                const activo = esActivo(pathname, n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    aria-current={activo ? "page" : undefined}
                    className={
                      "px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider " +
                      (activo
                        ? "bg-navy text-white"
                        : "text-navy hover:bg-paper-2")
                    }
                  >
                    {n.label}
                  </Link>
                );
              })}
              <Link
                href={telHref}
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-svc-red text-white text-sm font-bold"
              >
                <span aria-hidden>📞</span> {telLabel}
              </Link>
            </nav>
          </div>
        </>
      ) : null}
    </div>
  );
}
