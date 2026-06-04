import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LogoEncosep } from "@/components/ui/LogoEncosep";
import { BrandStripe } from "@/components/ui/BrandStripe";

export const metadata = { title: "Panel institucional · ENCOSEP" };

// Perfiles que pueden ver el panel institucional (consulta).
const ROLES_INSTITUCIONALES = [
  "PEM",
  "CONCEJO_DELIBERANTE",
  "AUTORIDAD_APLICACION",
  "DIRECTOR",
  "GESTOR_ENTE",
  "SUPER_ADMIN",
];

type Acceso = {
  emoji: string;
  titulo: string;
  detalle: string;
  href: string;
  proximamente?: boolean;
};

const REPORTES: Acceso[] = [
  {
    emoji: "📊",
    titulo: "Indicadores",
    detalle: "Estado de los servicios y métricas de reclamos.",
    href: "/indicadores",
  },
  {
    emoji: "📝",
    titulo: "Encuestas de satisfacción",
    detalle: "Cómo evalúan los vecinos cada servicio público.",
    href: "/encuesta",
  },
  {
    emoji: "📍",
    titulo: "Problemas por barrio y servicio",
    detalle: "Reclamos agregados por zona y por servicio.",
    href: "/indicadores",
  },
  {
    emoji: "📣",
    titulo: "Agenda y audiencias públicas",
    detalle: "Calendario de audiencias y actividades del Ente.",
    href: "/audiencias",
  },
];

const NORMATIVA: Acceso[] = [
  { emoji: "💧", titulo: "Agua y cloacas", detalle: "Marco regulatorio — SCPL", href: "/areas-fiscalizadas/agua" },
  { emoji: "⚡", titulo: "Energía y alumbrado", detalle: "Marco regulatorio — SCPL", href: "/areas-fiscalizadas/energia" },
  { emoji: "♻️", titulo: "Residuos / higiene urbana", detalle: "Marco regulatorio — Urbana", href: "/areas-fiscalizadas/residuos" },
  { emoji: "🚌", titulo: "Transporte urbano", detalle: "Marco regulatorio — Patagonia / Diadema", href: "/areas-fiscalizadas/transporte" },
];

const CANALES: Acceso[] = [
  {
    emoji: "✉️",
    titulo: "Presentar nota",
    detalle: "Enviar una nota formal al ENCOSEP.",
    href: "#",
    proximamente: true,
  },
  {
    emoji: "🛠️",
    titulo: "Solicitar asistencia técnica",
    detalle: "Pedir asistencia técnica al Ente.",
    href: "#",
    proximamente: true,
  },
];

function Grilla({ items }: { items: Acceso[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((a) => {
        const inner = (
          <div className="flex items-start gap-3 rounded-2xl border border-line bg-paper p-4 h-full hover:shadow-md hover:border-navy-2/40 transition">
            <span className="text-2xl leading-none shrink-0" aria-hidden>
              {a.emoji}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-navy leading-tight">
                {a.titulo}
                {a.proximamente && (
                  <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-muted bg-paper-2 px-1.5 py-0.5 rounded-full">
                    Próximamente
                  </span>
                )}
              </span>
              <span className="text-xs text-muted leading-snug mt-0.5">
                {a.detalle}
              </span>
            </div>
          </div>
        );
        if (a.proximamente) {
          return (
            <div key={a.titulo} className="opacity-60 cursor-default">
              {inner}
            </div>
          );
        }
        return (
          <Link key={a.titulo} href={a.href}>
            {inner}
          </Link>
        );
      })}
    </div>
  );
}

export default async function InstitucionalPage() {
  const session = await auth();
  if (!session) redirect("/ingresar");
  if (!ROLES_INSTITUCIONALES.includes(session.user.rol)) redirect("/inicio");

  return (
    <main className="flex flex-1 flex-col items-center bg-paper px-6 py-10">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        <header className="flex items-center gap-3">
          <LogoEncosep size={64} />
          <div className="flex flex-col">
            <div className="text-[10px] font-bold tracking-widest text-muted uppercase">
              ENCOSEP · Comodoro Rivadavia
            </div>
            <h1 className="text-2xl font-extrabold text-navy leading-tight">
              Panel institucional
            </h1>
            <BrandStripe className="max-w-[160px] mt-1" />
          </div>
        </header>

        <p className="text-sm text-muted leading-relaxed -mt-2">
          Acceso de consulta para autoridades. Acá tenés en un solo lugar los
          reportes del Ente, la normativa de cada servicio concesionado y los
          canales para comunicarte con el ENCOSEP.
        </p>

        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted">
            Reportes
          </h2>
          <Grilla items={REPORTES} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted">
            Normativa por servicio concesionado
          </h2>
          <Grilla items={NORMATIVA} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted">
            Canales con el ENCOSEP
          </h2>
          <Grilla items={CANALES} />
        </section>

        <Link
          href="/inicio"
          className="text-center text-xs text-muted underline underline-offset-4"
        >
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
}
