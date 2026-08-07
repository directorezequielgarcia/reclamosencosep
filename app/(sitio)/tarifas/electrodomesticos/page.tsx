import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { MigajasSitio, VolverInicio } from "@/components/ui/MigajasSitio";
import { cuadrosPublicados } from "@/lib/tarifas-db";
import { ElectrodomesticosForm } from "./ElectrodomesticosForm";

export const metadata = {
  title: "Calculadora ENCOSEP · Consumo por electrodoméstico",
  description:
    "Estimá cuántos kWh por mes consume cada electrodoméstico de tu casa y cuánto te sale en pesos con la tarifa vigente en Comodoro Rivadavia.",
};

export const dynamic = "force-dynamic";

export default async function ElectrodomesticosPage() {
  const cuadros = await cuadrosPublicados();

  return (
    <>
      <SeccionHeader
        kicker="Transparencia tarifaria"
        titulo="¿Cuánto consume cada electrodoméstico?"
        descripcion="Elegí los artefactos de tu casa, cuántos tenés y cuánto los usás: te mostramos cuántos kWh por mes consumen y una estimación en pesos con la tarifa vigente."
        variante="naranja"
      />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <MigajasSitio
          items={[
            { label: "Calculadora", href: "/tarifas" },
            { label: "Consumo por electrodoméstico" },
          ]}
        />
        <div className="mb-6 rounded-xl border border-line bg-paper-2 px-4 py-3 text-xs text-muted">
          Los datos técnicos de cada artefacto (potencia y consumo horario)
          son los que usa el{" "}
          <a
            href="https://www.enre.gov.ar/calculadora/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            ENRE
          </a>{" "}
          en su calculadora de consumo. Acá los cruzamos con el cuadro
          tarifario real de Comodoro Rivadavia para estimar el costo en
          pesos.
        </div>
        <ElectrodomesticosForm cuadros={cuadros} />
        <VolverInicio />
      </main>
    </>
  );
}
