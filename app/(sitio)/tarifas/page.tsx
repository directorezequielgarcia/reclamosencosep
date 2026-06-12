import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { CalculadoraTarifas } from "./CalculadoraTarifas";
import { cuadrosPublicados } from "@/lib/tarifas-db";

export const metadata = {
  title: "Calculadora ENCOSEP · Tarifas",
  description:
    "Calculá tu factura estimada de luz, agua y cloacas según el cuadro tarifario aprobado por el ENCOSEP de Comodoro Rivadavia.",
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
        descripcion="Ingresá tu categoría de usuario, tu consumo de luz y los metros cuadrados de tu casa: te mostramos cuánto debería dar tu factura según el último cuadro tarifario aprobado. Además podés sumar agua y cloacas para estimar tu factura completa y controlar lo que te cobran."
        variante="naranja"
      />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-6 rounded-xl border border-line bg-paper-2 px-4 py-3 text-xs text-muted">
          Cuadro vigente: <b className="text-navy">{vigente.nombre}</b>
          {vigente.expediente ? ` · ${vigente.expediente}` : ""}
          {vigente.fuente ? ` · ${vigente.fuente}` : ""}
        </div>
        <CalculadoraTarifas cuadros={cuadros} />
      </main>
    </>
  );
}
