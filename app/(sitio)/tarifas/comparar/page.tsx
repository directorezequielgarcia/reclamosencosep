import Link from "next/link";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { MigajasSitio, VolverInicio } from "@/components/ui/MigajasSitio";
import { CompararForm } from "./CompararForm";
import { ZorritoTour } from "@/components/tour/ZorritoTour";

export const metadata = {
  title: "Comparar dos facturas · Calculadora ENCOSEP",
  description:
    "Subí dos facturas de la SCPL de distintos períodos y te mostramos cuánto del aumento es por mayor consumo y cuánto por actualización de tarifas.",
};

export const dynamic = "force-dynamic";

export default function CompararPage() {
  return (
    <>
      <SeccionHeader
        kicker="Calculadora ENCOSEP"
        titulo="Comparar dos facturas"
        descripcion="Subí una factura anterior y una actual de la SCPL —PDF o foto— y te separamos el aumento en dos partes: cuánto es por mayor consumo y cuánto por actualización del cuadro tarifario."
        variante="naranja"
      />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <MigajasSitio
          items={[
            { label: "Calculadora", href: "/tarifas" },
            { label: "Comparar dos facturas" },
          ]}
        />
        <div className="rounded-2xl border border-line bg-paper-2 p-4 flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="text-sm text-navy flex-1">
            <b>¿Te aumentó mucho la factura?</b> Subí la de este mes y la del
            mes anterior y te decimos si es porque consumiste más, porque
            subió la tarifa, o las dos cosas. Si solo tenés una factura,{" "}
            <Link
              href="/tarifas/controlar"
              className="font-bold underline underline-offset-2 text-svc-red"
            >
              controlala contra el cuadro vigente
            </Link>
            .
          </div>
        </div>
        <CompararForm />

        <VolverInicio
          volverA={{ label: "Volver a la Calculadora", href: "/tarifas" }}
        />
      </main>

      <ZorritoTour
        storageKey="zorrito-tour-comparar-v1"
        pasos={[
          {
            pose: "parado",
            texto:
              "¡Hola! Soy el Zorrito 🦊. Te explico cómo comparar dos facturas para entender un aumento.",
          },
          {
            targetId: "comparar-boton-comparar",
            pose: "agachado",
            texto:
              "Subí las dos facturas —PDF o foto—, en cualquier orden: yo detecto solo cuál es la anterior y cuál la actual por el período. Después tocá acá para compararlas.",
          },
          {
            pose: "agachado",
            texto:
              "Te voy a mostrar cuánto del aumento es por mayor consumo (kWh o m²/m³) y cuánto por actualización de tarifas, concepto por concepto. Si no puedo leer algún dato, te aviso cuál cargar vos.",
          },
        ]}
      />
    </>
  );
}
