import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BrandStripe } from "@/components/ui/BrandStripe";
import { LogoEncosep } from "@/components/ui/LogoEncosep";

export const metadata = { title: "¿Quién sos hoy? · ENCOSEP" };

// Pantalla de entrada. Orienta a cada tipo de usuario a su acceso.
// IMPORTANTE: elegir el perfil ORIENTA, no autoriza. Los permisos los da el
// rol del usuario una vez autenticado (cada acceso pide usuario y clave).
type Perfil = {
  key: string;
  titulo: string;
  detalle: string;
  emoji: string;
  href: string;
  destacado?: boolean;
};

const PERFILES: Perfil[] = [
  {
    key: "vecino",
    titulo: "Usuario",
    detalle: "Soy vecino y quiero hacer o seguir un reclamo",
    emoji: "🧑",
    href: "/crear-cuenta",
    destacado: true,
  },
  {
    key: "team",
    titulo: "Team EnCoSep",
    detalle: "Equipo del Ente de Control",
    emoji: "🛡️",
    href: "/ingresar?perfil=team",
  },
  {
    key: "prestadora",
    titulo: "Prestadora",
    detalle: "Empresa concesionaria del servicio",
    emoji: "🏢",
    href: "/ingresar?perfil=prestadora",
  },
  {
    key: "autoridad",
    titulo: "Autoridad de Aplicación",
    detalle: "Organismo que aplica las sanciones",
    emoji: "⚖️",
    href: "/ingresar?perfil=autoridad",
  },
  {
    key: "pem",
    titulo: "PEM",
    detalle: "Poder Ejecutivo Municipal",
    emoji: "🏛️",
    href: "/ingresar?perfil=pem",
  },
  {
    key: "concejo",
    titulo: "Concejo Deliberante",
    detalle: "Presidencia y concejales",
    emoji: "🗳️",
    href: "/ingresar?perfil=concejo",
  },
];

export default async function AccesoPage() {
  const session = await auth();
  if (session) redirect("/inicio");

  return (
    <main className="flex flex-1 flex-col items-center bg-paper px-6 py-10">
      <div className="w-full max-w-2xl flex flex-col gap-7">
        <header className="flex flex-col items-center text-center gap-3">
          <LogoEncosep size={84} />
          <div className="text-[10px] font-bold tracking-widest text-muted uppercase">
            ENCOSEP · Comodoro Rivadavia
          </div>
          <h1 className="text-3xl font-extrabold leading-tight text-navy">
            ¿Quién sos hoy?
          </h1>
          <BrandStripe className="max-w-[180px]" />
          <p className="text-sm text-muted leading-relaxed max-w-md">
            Elegí tu perfil para entrar. Cada acceso te pide tu usuario y clave.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          {PERFILES.map((p) => (
            <Link
              key={p.key}
              href={p.href}
              className={`flex items-center gap-3 rounded-2xl border p-4 transition active:scale-[0.98] ${
                p.destacado
                  ? "border-svc-red/40 bg-svc-red/5 hover:bg-svc-red/10 sm:col-span-2"
                  : "border-line bg-paper hover:bg-paper-2"
              }`}
            >
              <span className="text-3xl leading-none shrink-0" aria-hidden>
                {p.emoji}
              </span>
              <span className="flex flex-col">
                <span className="text-base font-extrabold text-navy">
                  {p.titulo}
                </span>
                <span className="text-xs text-muted leading-snug">
                  {p.detalle}
                </span>
              </span>
            </Link>
          ))}
        </div>

        <div className="text-xs text-muted text-center border-t border-line pt-4">
          ¿Sos vecino y ya tenés cuenta?{" "}
          <Link
            href="/ingresar"
            className="text-navy font-bold underline underline-offset-4"
          >
            Ingresar
          </Link>
        </div>

        <Link
          href="/"
          className="text-center text-xs text-muted underline underline-offset-4"
        >
          ← Volver al sitio institucional
        </Link>
      </div>
    </main>
  );
}
