import Link from "next/link";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { MigajasSitio, VolverInicio } from "@/components/ui/MigajasSitio";
import { ControlForm } from "./ControlForm";
import { ZorritoTour } from "@/components/tour/ZorritoTour";

export const metadata = {
  title: "Controlá tu factura · Calculadora ENCOSEP",
  description:
    "Subí el PDF de tu factura de la SCPL y te decimos si los importes coinciden con el cuadro tarifario vigente.",
};

export const dynamic = "force-dynamic";

export default function ControlarPage() {
  return (
    <>
      <SeccionHeader
        kicker="Calculadora ENCOSEP"
        titulo="Controlá tu factura"
        descripcion="Subí el PDF original de tu factura de la SCPL —o una foto bien sacada— y la comparamos, concepto por concepto, con el cuadro tarifario vigente. Te marcamos dónde puede haber diferencias."
        variante="naranja"
      />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <MigajasSitio
          items={[
            { label: "Calculadora", href: "/tarifas" },
            { label: "Controlar factura" },
          ]}
        />
        <div className="rounded-2xl border border-line bg-paper-2 p-4 flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="text-sm text-navy flex-1">
            <b>¿Tenés tu factura a mano?</b> Subí el <b>PDF</b> o una <b>foto</b>{" "}
            acá abajo y la controlamos sola. Si no la tenés, podés{" "}
            <Link
              href="/tarifas"
              className="font-bold underline underline-offset-2 text-svc-red"
            >
              cargar tus datos a mano en la calculadora
            </Link>
            . Y si lo que te preocupa es <b>cuánto aumentó</b> de un mes a
            otro,{" "}
            <Link
              href="/tarifas/comparar"
              className="font-bold underline underline-offset-2 text-[#7e57c2]"
            >
              comparala con la factura anterior
            </Link>
            .
          </div>
        </div>
        <ControlForm />

        <VolverInicio
          volverA={{ label: "Volver a la Calculadora", href: "/tarifas" }}
        />
      </main>

      <ZorritoTour
        storageKey="zorrito-tour-controlar-v1"
        pasos={[
          {
            pose: "parado",
            texto:
              "¡Hola de nuevo! Soy el Zorrito 🦊. Te explico cómo controlar tu factura en tres pasos.",
          },
          {
            targetId: "controlar-subir-archivo",
            pose: "agachado",
            texto:
              "Primero, subí acá el PDF que te llega por mail —es lo más preciso— o una foto bien enfocada y con buena luz de tu factura de la SCPL.",
          },
          {
            targetId: "controlar-boton-controlar",
            pose: "parado",
            texto:
              "Cuando termine de leerla, tocá acá para compararla, concepto por concepto, con el cuadro tarifario vigente.",
          },
          {
            pose: "agachado",
            texto:
              "Te voy a marcar con ⚠️ los conceptos que no coinciden con el cuadro. Y si no puedo leer algún dato —pasa seguido con fotos o escaneos—, te aviso cuál falta para que lo cargues vos.",
          },
        ]}
      />
    </>
  );
}
