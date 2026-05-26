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
    <main className="flex flex-1 items-stretch">
      <div className="grid w-full md:grid-cols-[1fr_440px] flex-1">
        {/* PANEL INSTITUCIONAL IZQUIERDO */}
        <aside className="hidden md:flex flex-col justify-between bg-gradient-to-br from-navy via-navy-2 to-navy text-white p-10 lg:p-14">
          <div>
            <div className="bg-white rounded-2xl p-3 inline-block">
              <LogoEncosep size={120} />
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight mt-8">
              Portal de Reclamos
            </h2>
            <p className="text-base opacity-85 mt-3 leading-relaxed max-w-md">
              Registrá un reclamo sobre cualquiera de los servicios públicos
              bajo control del Ente y seguí tu trámite en tiempo real.
            </p>
            <BrandStripe className="mt-6 max-w-[200px]" />
          </div>

          <div className="mt-10">
            <div className="text-[10px] font-bold tracking-widest uppercase opacity-70 mb-3">
              Servicios sobre los que podés reclamar
            </div>
            <div className="grid grid-cols-2 gap-3">
              {AREAS.map((a) => (
                <div
                  key={a.src}
                  className="bg-white/95 rounded-2xl p-3 flex items-center gap-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.src}
                    alt={a.label}
                    className="w-14 h-14 object-contain shrink-0"
                  />
                  <div className="text-xs font-bold text-navy leading-tight">
                    {a.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] opacity-60 mt-8">
            EnCoSeP · Ente de Control de Servicios Públicos · Comodoro Rivadavia
          </div>
        </aside>

        {/* FORM DE LOGIN DERECHA */}
        <div className="flex flex-col justify-center bg-paper px-6 py-12 lg:py-16">
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
    </main>
  );
}
