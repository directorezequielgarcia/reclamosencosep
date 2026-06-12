import Link from "next/link";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { ControlForm } from "./ControlForm";

export const metadata = {
  title: "Controlá tu factura · Calculadora ENCOSEP",
  description:
    "Subí el PDF de tu factura de la SCPL y te decimos si los importes coinciden con el cuadro tarifario aprobado.",
};

export const dynamic = "force-dynamic";

export default function ControlarPage() {
  return (
    <>
      <SeccionHeader
        kicker="Calculadora ENCOSEP"
        titulo="Controlá tu factura"
        descripcion="Subí el PDF original de tu factura de la SCPL y la comparamos, concepto por concepto, con el cuadro tarifario aprobado por el Ente. Te marcamos dónde puede haber diferencias."
        variante="naranja"
      />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <Link
          href="/tarifas"
          className="text-xs text-navy-2 underline underline-offset-4"
        >
          ← Volver a la calculadora
        </Link>
        <div className="mt-4">
          <ControlForm />
        </div>
      </main>
    </>
  );
}
