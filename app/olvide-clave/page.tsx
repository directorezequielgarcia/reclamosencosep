import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BrandStripe } from "@/components/ui/BrandStripe";
import { LogoEncosep } from "@/components/ui/LogoEncosep";
import { FormOlvideClave } from "./form";

export const metadata = { title: "Olvidé mi clave · ENCOSEP" };

export default async function OlvideClavePage() {
  const session = await auth();
  if (session) redirect("/inicio");

  return (
    <main className="flex flex-1 items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex justify-center">
          <LogoEncosep size={88} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-bold tracking-widest text-muted uppercase text-center">
            ENCOSEP · Comodoro Rivadavia
          </div>
          <h1 className="text-2xl font-extrabold leading-tight text-navy text-center">
            ¿Olvidaste tu clave?
          </h1>
          <BrandStripe className="mx-auto" />
          <p className="text-sm text-muted leading-relaxed mt-2 text-center">
            Ingresá tu DNI y te enviamos un link al email registrado para que
            puedas elegir una nueva clave.
          </p>
        </div>

        <FormOlvideClave />

        <div className="rounded-xl border border-line bg-paper-2 px-4 py-3 text-xs text-muted leading-relaxed">
          <p className="font-semibold text-navy mb-1">¿No tenés email registrado?</p>
          <p>
            Presentate en la sede del Ente con tu DNI o llamá al teléfono de
            contacto institucional. Te reseteamos la clave en el momento.
          </p>
        </div>

        <Link
          href="/ingresar"
          className="text-center text-xs text-muted underline underline-offset-4"
        >
          ← Volver a ingresar
        </Link>
      </div>
    </main>
  );
}
