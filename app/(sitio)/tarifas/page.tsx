import Link from "next/link";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { CalculadoraTarifas } from "./CalculadoraTarifas";
import { InstructivoFactura } from "./InstructivoFactura";
import { ExplicacionCuadros } from "./ExplicacionCuadros";
import { cuadrosPublicados } from "@/lib/tarifas-db";

export const metadata = {
  title: "Calculadora ENCOSEP · Tarifas",
  description:
    "Calculá tu factura estimada de luz, agua y cloacas según el cuadro tarifario vigente en Comodoro Rivadavia.",
};

// Los cuadros pueden cambiar desde el panel admin: sin cache estática.
export const dynamic = "force-dynamic";

export default async function TarifasPage() {
  const cuadros = await cuadrosPublicados();
  const vigente = cuadros.find((c) => c.estado === "VIGENTE") ?? cuadros[0];

  return (
    <>
      <SeccionHeader
        kicker="Transparencia tarifaria"
        titulo="Calculadora ENCOSEP"
        descripcion="Ingresá tu categoría de usuario, tu consumo de luz y los metros cuadrados de tu casa: te mostramos cuánto debería dar tu factura según el último cuadro tarifario vigente. Además podés sumar agua y cloacas para estimar tu factura completa y controlar lo que te cobran."
        variante="naranja"
      />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-6 rounded-xl border border-line bg-paper-2 px-4 py-3 text-xs text-muted">
          Cuadro vigente: <b className="text-navy">{vigente.nombre}</b>
          {vigente.expediente ? ` · ${vigente.expediente}` : ""}
          {vigente.fuente ? ` · ${vigente.fuente}` : ""}
        </div>
        <CalculadoraTarifas cuadros={cuadros} />

        <Link
          href="/tarifas/controlar"
          className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 rounded-2xl border border-svc-blue/40 bg-svc-blue/10 p-5 hover:bg-svc-blue/15 transition"
        >
          <div className="text-3xl" aria-hidden>
            📄
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-navy">
              ¿Ya tenés tu factura? Controlala
            </div>
            <div className="text-xs text-muted leading-relaxed mt-0.5">
              Subí el PDF de tu factura de la SCPL y la comparamos concepto por
              concepto con el cuadro vigente, marcándote dónde puede haber
              diferencias.
            </div>
          </div>
          <div className="text-svc-red font-bold text-sm whitespace-nowrap">
            Controlar factura →
          </div>
        </Link>

        <div className="mt-10 flex flex-col gap-8">
          <ExplicacionCuadros />
          <InstructivoFactura />
        </div>
      </main>
    </>
  );
}
