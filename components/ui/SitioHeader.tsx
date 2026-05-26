import Link from "next/link";
import { BrandStripe } from "./BrandStripe";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/atencion-usuarios", label: "Atención al Usuario" },
  { href: "/control-prestadoras", label: "Control a Prestadoras" },
  { href: "/contacto", label: "Contacto" },
];

export function SitioHeader({ activo }: { activo?: string }) {
  return (
    <header className="bg-paper border-b border-line sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-11 h-11 rounded-full border-2 border-navy-2 flex items-center justify-center text-navy-2 font-extrabold text-lg leading-none">
            E
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="text-base font-extrabold text-navy">EnCoSeP</div>
            <div className="text-[10px] text-muted font-semibold uppercase tracking-widest">
              Ente · Comodoro Rivadavia
            </div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {NAV.map((n) => {
            const on = activo === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  on
                    ? "text-navy bg-paper-2"
                    : "text-muted hover:text-navy hover:bg-paper-2"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/reclamos"
            className="hidden sm:inline-flex items-center justify-center px-3 py-2 rounded-lg bg-svc-red text-white font-semibold text-xs"
          >
            Hacer un reclamo
          </Link>
          <Link
            href="/ingresar"
            className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-line-strong text-navy font-semibold text-xs"
          >
            Ingresar
          </Link>
        </div>
      </div>
      <BrandStripe height={3} className="rounded-none" />
    </header>
  );
}
