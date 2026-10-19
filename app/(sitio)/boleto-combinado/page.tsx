import Link from "next/link";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { MigajasSitio, VolverInicio } from "@/components/ui/MigajasSitio";
import { ConsultaBoletoCombinado } from "./ConsultaBoletoCombinado";

export const metadata = {
  title: "Consultá tu boleto combinado · ENCOSEP",
  description:
    "Averiguá si las dos líneas de colectivo que usás combinan y si te corresponde el segundo viaje gratis en Comodoro Rivadavia.",
};

export default function BoletoCombinadoPage() {
  return (
    <>
      <SeccionHeader
        kicker="Transporte"
        titulo="Consultá tu boleto combinado"
        descripcion="Elegí las dos líneas que usaste y te decimos si combinan y si el segundo viaje te tendría que salir gratis."
        variante="naranja"
      />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <MigajasSitio items={[{ label: "Boleto combinado" }]} />
        <ConsultaBoletoCombinado />
        <p className="mt-6 text-xs text-muted leading-relaxed">
          Información orientativa, armada por el ENCOSEP a partir de la planilla de combinaciones que maneja el
          Ente. No es un listado oficial de la Municipalidad y puede tener diferencias. El boleto combinado rige
          desde el 1 de octubre de 2026 según la Ordenanza 15.889/21. Si te cobraron dos pasajes y creés que
          no correspondía,{" "}
          <Link href="/reclamo/nuevo?svc=transporte" className="font-bold text-navy underline">
            hacé tu reclamo
          </Link>
          .
        </p>
        <VolverInicio />
      </main>
    </>
  );
}
