import Link from "next/link";
import { LogoEncosep } from "./LogoEncosep";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/acciones", label: "Acciones" },
  { href: "/atencion-usuarios", label: "Atención al Usuario" },
  { href: "/control-prestadoras", label: "Control a Prestadoras" },
  { href: "/boletines", label: "Boletines" },
  { href: "/audiencias", label: "Audiencias" },
  { href: "/indicadores", label: "Indicadores" },
  { href: "/contacto", label: "Contacto" },
];

export function SitioHeader() {
  return (
    <header className="bg-paper border-b border-line sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center shrink-0 -ml-1 rounded-2xl hover:opacity-90 transition"
          aria-label="EnCoSeP — Ir al inicio"
        >
          <LogoEncosep size={72} />
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-2">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-navy hover:bg-paper-2 transition"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="tel:08003331175"
            className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full bg-svc-red text-white text-xs font-bold"
          >
            <span aria-hidden>📞</span>
            <span>0800 333 1175</span>
          </Link>
          <Link
            href="/ingresar"
            className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-line-strong text-navy font-semibold text-xs"
          >
            Ingresar
          </Link>
        </div>
      </div>

      {/* Banda multicolor institucional */}
      <div className="flex h-[3px]">
        <span className="flex-1 bg-svc-orange" />
        <span className="flex-1 bg-svc-green" />
        <span className="flex-1 bg-svc-yellow" />
        <span className="flex-1 bg-svc-blue" />
        <span className="flex-1 bg-svc-red" />
      </div>

      {/* Nav mobile */}
      <nav className="lg:hidden flex items-center justify-center gap-0 overflow-x-auto border-t border-line bg-paper-2">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-navy whitespace-nowrap"
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
