import Link from "next/link";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { SVC_ORDER, SVC_META } from "@/lib/servicios";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { MigajasSitio, VolverInicio } from "@/components/ui/MigajasSitio";

export const metadata = {
  title: "Portal de Reclamos · ENCOSEP",
  description:
    "Registrá y seguí reclamos sobre los servicios públicos bajo control del ENCOSEP de Comodoro Rivadavia.",
};

export default function ReclamosLanding() {
  return (
    <>
      <SeccionHeader
        kicker="Atención al Usuario"
        titulo="Portal de Reclamos"
        descripcion="Registrá tu reclamo sobre los servicios públicos bajo control del Ente. Vas a tener un número de seguimiento, podés adjuntar fotos y ubicación, y vas a ver en tiempo real cómo va el trámite."
        variante="naranja"
      />
      <main className="max-w-5xl mx-auto px-6 py-10">
      <MigajasSitio
        items={[
          { label: "Atención al Usuario", href: "/atencion-usuarios" },
          { label: "Reclamos" },
        ]}
      />
      <div className="grid md:grid-cols-2 gap-10 items-start">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/crear-cuenta"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-svc-red text-white font-bold text-base shadow-md shadow-svc-red/30 hover:opacity-90"
            >
              Crear cuenta y reclamar
            </Link>
            <Link
              href="/ingresar?callbackUrl=/inicio"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-line-strong text-navy font-semibold"
            >
              Ya tengo cuenta, ingresar
            </Link>
          </div>

          <div className="text-xs text-muted">
            <Link
              href="/atencion-usuarios"
              className="underline underline-offset-4 text-navy-2"
            >
              Otras vías de atención al usuario →
            </Link>
          </div>

          <div className="mt-4 text-xs text-muted">
            ¿Sos prestadora?{" "}
            <Link
              href="/prestadoras"
              className="underline underline-offset-4 text-navy-2"
            >
              Entrá al Portal de Prestadoras
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-paper-2 p-6">
          <div className="text-xs font-bold tracking-widest uppercase text-muted mb-3">
            Servicios sobre los que podés reclamar
          </div>
          <div className="grid grid-cols-2 gap-4">
            {SVC_ORDER.map((k) => {
              const m = SVC_META[k];
              return (
                <div
                  key={k}
                  className="flex items-center gap-3 p-2 rounded-xl bg-paper border border-line"
                >
                  <SvcIcon kind={k} size={44} />
                  <div className="leading-tight">
                    <div className="text-sm font-bold text-navy">{m.short}</div>
                    <div className="text-[11px] text-muted">{m.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-xs text-muted leading-relaxed">
            El reclamo se deriva automáticamente a la prestadora responsable.
            El Ente queda como contralor del cumplimiento del plazo de
            respuesta (SLA 72hs por defecto).
          </div>
        </div>
      </div>

      <Link
        href="/tarifas"
        className="mt-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 rounded-2xl border border-svc-orange/40 bg-svc-orange/10 p-5 hover:bg-svc-orange/15 transition"
      >
        <div className="text-3xl" aria-hidden>
          🧮
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-navy">
            Calculadora ENCOSEP — ¿querés controlar lo que te cobran?
          </div>
          <div className="text-xs text-muted leading-relaxed mt-0.5">
            Ingresás tu consumo de luz, los m² de tu casa y si tenés cloacas, y
            te decimos cuánto debería dar tu factura según el cuadro tarifario
            vigente — y cómo te quedaría con los aumentos pedidos.
          </div>
        </div>
        <div className="text-svc-red font-bold text-sm whitespace-nowrap">
          Abrir calculadora →
        </div>
      </Link>
      <VolverInicio
        volverA={{
          label: "Volver a Atención al Usuario",
          href: "/atencion-usuarios",
        }}
      />
      </main>
    </>
  );
}
