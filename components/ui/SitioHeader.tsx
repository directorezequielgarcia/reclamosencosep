import Link from "next/link";
import { LogoEncosep } from "./LogoEncosep";
import { NavDesktop, MenuMobile } from "./SitioNav";
import { auth, signOut } from "@/lib/auth";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/acciones", label: "Acciones" },
  { href: "/atencion-usuarios", label: "Atención" },
  { href: "/control-prestadoras", label: "Prestadoras" },
  { href: "/tarifas", label: "Calculadora" },
  { href: "/boletines", label: "Boletines" },
  { href: "/audiencias", label: "Audiencias" },
  { href: "/indicadores", label: "Indicadores" },
  { href: "/contacto", label: "Contacto" },
];

// Destino del panel propio según el rol, para que el usuario logueado
// pueda volver a "su lado" del sistema desde cualquier página del sitio.
const INSTITUCIONALES = ["PEM", "CONCEJO_DELIBERANTE", "AUTORIDAD_APLICACION"];
function panelDeRol(rol: string): { href: string; label: string } {
  if (rol === "CIUDADANO") return { href: "/inicio", label: "Mis reclamos" };
  if (INSTITUCIONALES.includes(rol))
    return { href: "/institucional", label: "Mi panel" };
  return { href: "/admin", label: "Mi panel" };
}

export async function SitioHeader() {
  const session = await auth();

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  const usuario = session?.user
    ? {
        nombre: session.user.name ?? "Usuario",
        inicial: (session.user.name ?? "U").charAt(0).toUpperCase(),
        panel: panelDeRol(session.user.rol),
      }
    : null;

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

        <div
          className="hidden sm:block w-11 h-11 shrink-0 -ml-3 rounded-full overflow-hidden border-2 border-[#7e57c2]/50 bg-white"
          title="Zorrito, guía del ENCOSEP"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/imagenes/zorrito/zorrito-parado.png"
            alt="Zorrito, guía del ENCOSEP"
            className="w-full h-full object-cover object-top"
          />
        </div>

        <NavDesktop nav={NAV} />

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="tel:08003331175"
            className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full bg-svc-red text-white text-xs font-bold"
          >
            <span aria-hidden>📞</span>
            <span>0800 333 1175</span>
          </Link>
          {usuario ? (
            <div className="flex items-center gap-2">
              <Link
                href={usuario.panel.href}
                className="flex items-center gap-2 rounded-full border border-line-strong pl-1 pr-3 py-1 text-navy hover:bg-paper-2"
                title={`${usuario.nombre} · ${usuario.panel.label}`}
              >
                <span className="w-7 h-7 rounded-full bg-navy-2 text-white flex items-center justify-center text-xs font-bold">
                  {usuario.inicial}
                </span>
                <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">
                  {usuario.panel.label}
                </span>
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-line-strong text-navy font-semibold text-xs hover:bg-paper-2"
                >
                  Salir
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/acceso"
              className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-line-strong text-navy font-semibold text-xs"
            >
              Acceder
            </Link>
          )}
          <MenuMobile
            nav={NAV}
            telHref="tel:08003331175"
            telLabel="0800 333 1175"
          />
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
    </header>
  );
}
