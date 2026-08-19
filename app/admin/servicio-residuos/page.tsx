import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { puedeGestionarReclamos } from "@/lib/admin";
import { BuscadorServicioResiduos } from "./buscador-client";

export const metadata = { title: "Servicio de Residuos y Barrido · Panel ENCOSEP" };

export default async function ServicioResiduosPage() {
  const session = await auth();
  if (!session) redirect("/ingresar?callbackUrl=/admin/servicio-residuos");
  if (!puedeGestionarReclamos(session.user.rol)) redirect("/admin");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold text-navy">
          Recolección y Barrido — consulta por barrio/calle
        </h1>
        <p className="text-sm text-muted mt-1 max-w-3xl">
          Uso interno para responder reclamos de &ldquo;no pasó el
          recolector&rdquo; o &ldquo;no barrieron mi calle&rdquo;. Datos
          digitalizados del Pliego de Higiene Urbana (Concesionaria Clear
          Urbana S.A.) y de las fichas de recorrido del Ente. No es
          información pública — es para uso del equipo de reclamos.
        </p>
      </header>
      <BuscadorServicioResiduos />
    </div>
  );
}
