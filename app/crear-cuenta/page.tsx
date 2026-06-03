import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BrandStripe } from "@/components/ui/BrandStripe";
import { LogoEncosep } from "@/components/ui/LogoEncosep";
import { FormCrearCuenta } from "./form";

export const metadata = { title: "Crear cuenta · ENCOSEP" };

export default async function CrearCuentaPage() {
  const session = await auth();
  if (session) redirect("/inicio");

  return (
    <main className="flex flex-1 items-stretch">
      <div className="grid w-full md:grid-cols-[1fr_460px] flex-1">
        {/* PANEL INSTITUCIONAL IZQUIERDO */}
        <aside className="hidden md:flex flex-col justify-between bg-gradient-to-br from-navy via-navy-2 to-navy text-white p-10 lg:p-14">
          <div>
            <div className="bg-white rounded-2xl p-3 inline-block">
              <LogoEncosep size={120} />
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight mt-8">
              Creá tu cuenta
            </h2>
            <p className="text-base opacity-85 mt-3 leading-relaxed max-w-md">
              Con tu cuenta podés registrar reclamos sobre los servicios públicos
              y darles seguimiento desde el celular en cualquier momento.
            </p>
            <BrandStripe className="mt-6 max-w-[200px]" />
          </div>

          <ul className="mt-10 flex flex-col gap-3 text-sm opacity-90">
            <li className="flex items-start gap-3">
              <span className="text-svc-yellow text-lg leading-none">·</span>
              <span>Cargá fotos del problema desde tu celular</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-svc-green text-lg leading-none">·</span>
              <span>Seguí el estado de tu reclamo en tiempo real</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-svc-blue text-lg leading-none">·</span>
              <span>Recibí avisos cuando cambie su estado</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-svc-red text-lg leading-none">·</span>
              <span>Solicitá copia del expediente cuando lo necesites</span>
            </li>
          </ul>

          <div className="text-[11px] opacity-60 mt-8">
            EnCoSeP · Ente de Control de Servicios Públicos · Comodoro Rivadavia
          </div>
        </aside>

        {/* FORMULARIO DE REGISTRO */}
        <div className="flex flex-col justify-center bg-paper px-6 py-12 lg:py-16 overflow-y-auto">
          <div className="w-full max-w-sm mx-auto flex flex-col gap-6">
            <div className="md:hidden flex justify-center">
              <LogoEncosep size={88} />
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-bold tracking-widest text-muted uppercase">
                ENCOSEP · Comodoro Rivadavia
              </div>
              <h1 className="text-2xl font-extrabold leading-tight text-navy">
                Crear mi cuenta
              </h1>
              <BrandStripe />
              <p className="text-sm text-muted leading-relaxed mt-1">
                Es gratis y te toma menos de un minuto.
              </p>
            </div>

            <FormCrearCuenta />

            <div className="text-xs text-muted text-center pt-3 border-t border-line">
              ¿Ya tenés cuenta?{" "}
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
        </div>
      </div>
    </main>
  );
}
