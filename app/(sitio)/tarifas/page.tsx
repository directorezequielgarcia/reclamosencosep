import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { CalculadoraTarifas } from "./CalculadoraTarifas";
import { cuadroVigente } from "@/lib/tarifas";

export const metadata = {
  title: "Calculadora ENCOSEP · Tarifas",
  description:
    "Calculá tu factura estimada de luz, agua y cloacas según el cuadro tarifario aprobado por el ENCOSEP de Comodoro Rivadavia.",
};

export default function TarifasPage() {
  const cuadro = cuadroVigente();
  return (
    <>
      <SeccionHeader
        kicker="Transparencia tarifaria"
        titulo="Calculadora ENCOSEP"
        descripcion="Ingresá tu consumo de luz, los metros cuadrados de tu casa y si tenés cloacas. Te mostramos cuánto debería dar tu factura según el último cuadro tarifario aprobado por el Ente. Sirve para controlar lo que te cobran."
        variante="naranja"
      />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-6 rounded-xl border border-line bg-paper-2 px-4 py-3 text-xs text-muted">
          Cuadro aplicado: <b className="text-navy">{cuadro.nombre}</b> ·{" "}
          {cuadro.expediente} · {cuadro.fuente}
        </div>
        <CalculadoraTarifas />
      </main>
    </>
  );
}
