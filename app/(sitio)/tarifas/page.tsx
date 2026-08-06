import Link from "next/link";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { CalculadoraTarifas } from "./CalculadoraTarifas";
import { GlosarioCategorias } from "./GlosarioCategorias";
import { InstructivoFactura } from "./InstructivoFactura";
import { ExplicacionCuadros } from "./ExplicacionCuadros";
import { MigajasSitio, VolverInicio } from "@/components/ui/MigajasSitio";
import { cuadrosPublicados } from "@/lib/tarifas-db";
import { ZorritoTour } from "@/components/tour/ZorritoTour";

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
        <MigajasSitio items={[{ label: "Calculadora" }]} />
        <div id="calculadora-que-podes-hacer" className="mb-6 rounded-2xl border border-line bg-paper p-5">
          <div className="text-sm font-bold text-navy mb-3">
            ¿Qué podés hacer acá?
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex gap-3">
              <div className="text-2xl" aria-hidden>🧮</div>
              <div>
                <div className="text-sm font-bold text-navy">
                  Estimar tu factura
                </div>
                <div className="text-xs text-muted leading-relaxed">
                  Cargá tu consumo y datos, y mirá cuánto debería darte la
                  factura.
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-2xl" aria-hidden>📄</div>
              <div>
                <div className="text-sm font-bold text-navy">
                  Controlar tu factura
                </div>
                <div className="text-xs text-muted leading-relaxed">
                  Subí el PDF o una foto y te marcamos dónde puede haber
                  diferencias.
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-2xl" aria-hidden>⚖️</div>
              <div>
                <div className="text-sm font-bold text-navy">
                  Comparar dos facturas
                </div>
                <div className="text-xs text-muted leading-relaxed">
                  Subí la anterior y la actual: te decimos cuánto es por
                  consumo y cuánto por tarifa.
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-2xl" aria-hidden>📊</div>
              <div>
                <div className="text-sm font-bold text-navy">
                  Comparar cuadros
                </div>
                <div className="text-xs text-muted leading-relaxed">
                  Cuánto subió respecto del cuadro anterior y cuánto subiría con
                  el aumento pedido.
                </div>
              </div>
            </div>
          </div>
        </div>

        <Link
          id="calculadora-controlar-factura"
          href="/tarifas/controlar"
          className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 rounded-2xl border border-svc-blue/40 bg-svc-blue/10 p-5 hover:bg-svc-blue/15 transition"
        >
          <div className="text-3xl" aria-hidden>
            📄
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-navy">
              ¿Ya tenés tu factura? Controlala
            </div>
            <div className="text-xs text-muted leading-relaxed mt-0.5">
              Subí el PDF o una foto de tu factura de la SCPL y la comparamos
              concepto por concepto con el cuadro vigente, marcándote dónde puede
              haber diferencias. Si no la tenés, cargá tus datos abajo.
            </div>
          </div>
          <div className="text-svc-red font-bold text-sm whitespace-nowrap">
            Controlar factura →
          </div>
        </Link>

        <Link
          id="calculadora-comparar-facturas"
          href="/tarifas/comparar"
          className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 rounded-2xl border border-[#7e57c2]/40 bg-[#7e57c2]/10 p-5 hover:bg-[#7e57c2]/15 transition"
        >
          <div className="text-3xl" aria-hidden>
            ⚖️
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-navy">
              ¿Te aumentó mucho? Compará dos facturas
            </div>
            <div className="text-xs text-muted leading-relaxed mt-0.5">
              Subí tu factura anterior y la actual, y te separamos el aumento
              entre mayor consumo y actualización de tarifas.
            </div>
          </div>
          <div className="text-[#7e57c2] font-bold text-sm whitespace-nowrap">
            Comparar facturas →
          </div>
        </Link>

        <div className="mb-6 rounded-xl border border-line bg-paper-2 px-4 py-3 text-xs text-muted">
          Cuadro vigente: <b className="text-navy">{vigente.nombre}</b>
          {vigente.expediente ? ` · ${vigente.expediente}` : ""}
          {vigente.fuente ? ` · ${vigente.fuente}` : ""}
        </div>
        <div id="calculadora-form">
          <CalculadoraTarifas cuadros={cuadros} />
        </div>

        <div className="mt-6">
          <GlosarioCategorias />
        </div>

        <div className="mt-10 flex flex-col gap-8">
          <ExplicacionCuadros />
          <InstructivoFactura />
        </div>

        <VolverInicio />
      </main>

      <ZorritoTour
        storageKey="zorrito-tour-calculadora-v1"
        pasos={[
          {
            pose: "parado",
            texto:
              "¡Hola! Soy el Zorrito de ENCOSEP 🦊. Te ayudo a usar la Calculadora de tarifas.",
          },
          {
            targetId: "calculadora-que-podes-hacer",
            pose: "parado",
            texto:
              "Acá podés estimar tu factura, controlar la que ya te llegó, o comparar cuadros tarifarios.",
          },
          {
            targetId: "calculadora-controlar-factura",
            pose: "parado",
            texto:
              "Si ya tenés tu factura de la SCPL, subí el PDF o una foto y te marco dónde puede haber diferencias.",
          },
          {
            targetId: "calculadora-comparar-facturas",
            pose: "parado",
            texto:
              "¿Te aumentó mucho de un mes a otro? Subí las dos facturas acá y te digo cuánto es por consumo y cuánto por tarifa.",
          },
          {
            targetId: "calculadora-form",
            pose: "agachado",
            texto:
              "O si preferís, cargá acá tu categoría, consumo y metros cuadrados: te muestro cuánto debería dar tu factura.",
          },
          {
            pose: "agachado",
            texto:
              "¡Listo! Cuando quieras volver a verme, tocá mi carita en el botón de abajo.",
          },
        ]}
      />
    </>
  );
}
