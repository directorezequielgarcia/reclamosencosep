import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { BrandStripe } from "@/components/ui/BrandStripe";
import { LogoEncosep } from "@/components/ui/LogoEncosep";

export const metadata = { title: "Ingresar · ENCOSEP" };

const AREAS = [
  { src: "/imagenes/areas/agua.png", label: "Agua y Saneamiento" },
  { src: "/imagenes/areas/energia.png", label: "Energía Eléctrica y Alumbrado" },
  { src: "/imagenes/areas/residuos.png", label: "Gestión de Residuos" },
  { src: "/imagenes/areas/transporte.png", label: "Transporte Público" },
];

// Guía de procedimiento para reclamos — versión digital de la cartilla
// institucional del Ente. El reclamo nace ante la prestadora; el ENCOSEP
// interviene si la empresa no contesta o la respuesta no satisface.
const PASOS_GUIA: { titulo: string; texto: string; destacado?: string }[] = [
  {
    titulo: "Iniciá el reclamo ante la empresa prestadora",
    texto:
      "Presentá tu reclamo directamente ante la prestadora del servicio: SCPL, Urbana, Transporte Patagonia o Transporte Diadema, según corresponda.",
    destacado:
      "Importante: pedí siempre la constancia del trámite y el número de reclamo.",
  },
  {
    titulo: "Tiempos de espera",
    texto:
      "La empresa tiene un plazo de 15 días para contestar tu reclamo.",
  },
  {
    titulo: "¿Qué pasa si la prestadora no contesta?",
    texto:
      "Si la prestadora no responde dentro del plazo, o si la respuesta no te resulta satisfactoria, podés llevar el reclamo al ENCOSEP: por e-mail a info@encosepcomodoro.gob.ar o personalmente en las oficinas de Pasaje Valdivia 435.",
  },
  {
    titulo: "Nuestra parte",
    texto:
      "El ENCOSEP da inicio a un nuevo procedimiento de solicitud de información respecto del caso.",
  },
  {
    titulo: "¿Cuánto debo esperar?",
    texto:
      "En un plazo de 15 días, la empresa concesionaria debe proporcionar la información solicitada, para continuar el proceso y arribar a una resolución teniendo en cuenta todos los datos aportados.",
  },
  {
    titulo: "Resolución del ENCOSEP",
    texto:
      "El Ente de Control de Servicios Públicos emite su resolución sobre el caso.",
  },
];

export default async function IngresarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string; reset?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/inicio");

  const sp = await searchParams;
  const error = sp.error;
  const resetOk = sp.reset === "ok";
  const callbackUrl = sp.callbackUrl ?? "/inicio";

  async function login(formData: FormData) {
    "use server";
    const dni = String(formData.get("dni") ?? "").replace(/[.\s]/g, "");
    const password = String(formData.get("password") ?? "");
    await signIn("credentials", {
      dni,
      password,
      redirectTo: "/inicio",
    });
  }

  return (
    <main className="flex flex-1 flex-col">
      <div className="grid w-full md:grid-cols-[1fr_440px] items-stretch">
        {/* PANEL INSTITUCIONAL IZQUIERDO */}
        <aside className="hidden md:flex flex-col justify-between gap-8 bg-gradient-to-br from-navy via-navy-2 to-navy text-white p-8 lg:p-12">
          <div>
            <div className="bg-white rounded-2xl p-3 inline-block">
              <LogoEncosep size={92} />
            </div>
            <h2 className="text-3xl font-extrabold leading-tight mt-6">
              Portal de Reclamos
            </h2>
            <p className="text-sm opacity-85 mt-2 leading-relaxed max-w-md">
              Registrá un reclamo sobre cualquiera de los servicios públicos
              bajo control del Ente y seguí tu trámite en tiempo real.
            </p>
            <BrandStripe className="mt-5 max-w-[200px]" />
          </div>

          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase opacity-70 mb-2.5">
              Servicios sobre los que podés reclamar
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {AREAS.map((a) => (
                <div
                  key={a.src}
                  className="bg-white/95 rounded-xl px-3 py-2 flex items-center gap-2.5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.src}
                    alt={a.label}
                    className="w-9 h-9 object-contain shrink-0"
                  />
                  <div className="text-xs font-bold text-navy leading-tight">
                    {a.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] opacity-60">
            EnCoSeP · Ente de Control de Servicios Públicos · Comodoro Rivadavia
          </div>
        </aside>

        {/* FORM DE LOGIN DERECHA */}
        <div className="flex flex-col justify-center bg-paper px-6 py-10">
          <div className="w-full max-w-sm mx-auto flex flex-col gap-6">
            {/* Logo arriba — visible solo en mobile (en desktop está en el aside) */}
            <div className="md:hidden flex justify-center">
              <LogoEncosep size={88} />
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-bold tracking-widest text-muted uppercase">
                ENCOSEP · Comodoro Rivadavia
              </div>
              <h1 className="text-2xl font-extrabold leading-tight text-navy">
                Ingresá con tu DNI
              </h1>
              <BrandStripe />
              <p className="text-sm text-muted leading-relaxed mt-1">
                Necesitamos identificarte para registrar y darle seguimiento a
                tu reclamo.
              </p>
            </div>

            <form action={login} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-navy">
                  DNI{" "}
                  <span className="text-muted font-normal">
                    (o CUIT, si sos prestadora)
                  </span>
                </span>
                <input
                  name="dni"
                  type="text"
                  inputMode="numeric"
                  autoComplete="username"
                  required
                  placeholder="27345678 · ó 30528775409"
                  className="w-full px-3 py-3 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-navy">Clave</span>
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-3 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
                />
              </label>

              {resetOk ? (
                <div className="text-sm text-svc-green bg-svc-green/10 border border-svc-green/30 rounded-lg px-3 py-2">
                  Tu clave fue actualizada. Ingresá con la nueva.
                </div>
              ) : null}
              {error ? (
                <div className="text-sm text-svc-red bg-svc-red/10 border border-svc-red/30 rounded-lg px-3 py-2">
                  No pudimos validarte. Revisá DNI y clave.
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl bg-svc-red text-white font-bold uppercase tracking-wider hover:opacity-90 transition shadow-md shadow-svc-red/30"
              >
                Ingresar
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <Link
                  href="/olvide-clave"
                  className="text-navy underline underline-offset-4"
                >
                  Olvidé mi clave
                </Link>
                <Link
                  href="/crear-cuenta"
                  className="text-navy font-semibold underline underline-offset-4"
                >
                  Crear mi cuenta →
                </Link>
              </div>
            </form>

            <div className="text-xs text-muted text-center pt-3 border-t border-line">
              <div className="font-semibold text-navy mb-1">
                Usuarios de prueba
              </div>
              <div>
                Vecino: DNI{" "}
                <span className="font-mono">40555666</span> · clave{" "}
                <span className="font-mono">demo1234</span>
              </div>
              <div className="mt-0.5">
                Operador SCPL: CUIT{" "}
                <span className="font-mono">30528775409</span> · clave{" "}
                <span className="font-mono">scpl-2026</span>
              </div>
            </div>

            <Link
              href="/"
              className="text-center text-xs text-muted underline underline-offset-4"
            >
              ← Volver al sitio institucional
            </Link>
            <input type="hidden" value={callbackUrl} readOnly hidden />
          </div>
        </div>
      </div>

      {/* GUÍA DE PROCEDIMIENTO — cartilla institucional, paso a paso */}
      <section className="bg-paper-2 border-t border-line px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-9">
            <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted">
              Antes de empezar
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-navy mt-2">
              Guía de procedimiento para reclamos
            </h2>
            <p className="text-sm text-muted mt-2 max-w-2xl mx-auto leading-relaxed">
              Así avanza un reclamo, paso a paso: desde que lo presentás ante la
              prestadora hasta la resolución del Ente.
            </p>
            <BrandStripe className="mx-auto mt-4 max-w-[160px]" />
          </div>

          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PASOS_GUIA.map((p, i) => (
              <PasoGuia
                key={i}
                n={i + 1}
                titulo={p.titulo}
                texto={p.texto}
                destacado={p.destacado}
              />
            ))}
          </ol>

          <p className="text-center text-xs text-muted mt-9 leading-relaxed">
            ENCOSEP · Pasaje Valdivia 435 · info@encosepcomodoro.gob.ar
            <br />
            <span className="font-semibold">encosepcomodoro.gob.ar</span>
          </p>
        </div>
      </section>
    </main>
  );
}

function PasoGuia({
  n,
  titulo,
  texto,
  destacado,
}: {
  n: number;
  titulo: string;
  texto: string;
  destacado?: string;
}) {
  return (
    <li className="relative rounded-2xl border border-line bg-paper p-5 pt-7">
      {/* Número del paso, sobresaliendo del borde superior */}
      <div className="absolute -top-3.5 left-5 w-9 h-9 rounded-full bg-navy text-white text-sm font-extrabold flex items-center justify-center shadow-md ring-4 ring-paper-2">
        {n}
      </div>
      <h3 className="text-sm font-extrabold text-navy">{titulo}</h3>
      <p className="text-xs text-navy/85 leading-relaxed mt-1.5">{texto}</p>
      {destacado ? (
        <p className="text-xs font-semibold text-svc-red bg-svc-red/10 border border-svc-red/25 rounded-lg px-2.5 py-1.5 mt-2.5">
          {destacado}
        </p>
      ) : null}
    </li>
  );
}
