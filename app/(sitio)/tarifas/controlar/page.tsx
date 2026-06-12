import Link from "next/link";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { ControlForm } from "./ControlForm";

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
            .
          </div>
        </div>
        <ControlForm />
      </main>
    </>
  );
}
