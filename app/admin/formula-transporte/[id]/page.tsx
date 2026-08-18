import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { puedeGestionarFormulaTransporte } from "@/lib/admin";
import { getFormulaRow } from "@/lib/formula-transporte-db";
import {
  KILOMETRAJE_100PCT_PLIEGO_ANEXO_IA,
  calcularFormula,
  datosFormulaVacios,
  type DatosFormula,
} from "@/lib/formula-transporte";
import { accionActualizarFormula, accionEliminarFormula } from "../actions";
import { CamposFormula } from "../CamposFormula";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const dynamic = "force-dynamic";

export default async function DetalleFormulaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session)
    redirect(`/ingresar?callbackUrl=/admin/formula-transporte/${id}`);
  if (!puedeGestionarFormulaTransporte(session.user.rol)) redirect("/admin");

  const row = await getFormulaRow(id);
  if (!row) notFound();

  const datos: DatosFormula = {
    ...datosFormulaVacios(row.periodo),
    ...(row.datos as object),
  };
  const r = calcularFormula(datos);

  const pctVsPliego =
    datos.kilometrajeProgramado > 0
      ? (datos.kilometrajeProgramado / KILOMETRAJE_100PCT_PLIEGO_ANEXO_IA) * 100
      : null;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <Link
          href="/admin/formula-transporte"
          className="text-xs text-navy-2 underline underline-offset-4"
        >
          ← Volver
        </Link>
        <h1 className="text-2xl font-extrabold text-navy mt-2">
          Fórmula Transporte — {row.periodo}
        </h1>
        <p className="text-sm text-muted mt-1">{row.fuente ?? "Sin fuente registrada"}</p>
      </div>

      {/* Resultado calculado */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-line bg-paper p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-muted">
            Costo/Km total
          </div>
          <div className="text-2xl font-extrabold text-navy mt-1">
            ${r.costoKmTotal.toLocaleString("es-AR")}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-paper p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-muted">
            Costo del Servicio del mes
          </div>
          <div className="text-2xl font-extrabold text-navy mt-1">
            ${r.costoServicioMes.toLocaleString("es-AR")}
          </div>
          <div className="text-[11px] text-muted mt-1">
            Costo/Km × Kilometraje a Pagar certificado
          </div>
        </div>
        <div className="rounded-xl border border-line bg-paper p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-muted">
            Compensación estimada
          </div>
          <div className="text-2xl font-extrabold text-navy mt-1">
            ${r.compensacionEstimada.toLocaleString("es-AR")}
          </div>
          <div className="text-[11px] text-muted mt-1">
            max(0, Costo del Servicio − Recaudación digital)
          </div>
        </div>
      </div>

      {pctVsPliego !== null && (
        <div className="rounded-xl border border-line bg-paper-2 p-4 text-sm text-navy">
          El Kilometraje Programado cargado ({datos.kilometrajeProgramado.toLocaleString("es-AR")} km) equivale al{" "}
          <b>{pctVsPliego.toFixed(1)}%</b> del parámetro técnico del 100% del
          pliego (Anexo I A: {KILOMETRAJE_100PCT_PLIEGO_ANEXO_IA.toLocaleString("es-AR")} km/mes).
        </div>
      )}

      {/* Comparación con la prestadora */}
      <div className="rounded-xl border border-svc-blue/40 bg-svc-blue/5 p-4">
        <h2 className="text-sm font-bold text-navy mb-2">
          Lo que presentó la prestadora
        </h2>
        {datos.prestadoraKilometrajeRecorrido == null ? (
          <p className="text-sm text-muted">
            No hay datos cargados de la prestadora para este período.
          </p>
        ) : (
          <div className="flex flex-col gap-2 text-sm">
            <div>
              Km declarado por GRUPO MR S.R.L.:{" "}
              <b>{datos.prestadoraKilometrajeRecorrido.toLocaleString("es-AR")}</b>{" "}
              vs. Km certificado por la Autoridad de Aplicación:{" "}
              <b>{datos.kilometrajeAPagarCertificado.toLocaleString("es-AR")}</b>
            </div>
            {r.diferenciaKmVsPrestadora !== null && (
              <div
                className={
                  Math.abs(r.diferenciaKmVsPrestadora) < 0.01
                    ? "text-svc-green font-semibold"
                    : "text-svc-red font-semibold"
                }
              >
                Diferencia: {r.diferenciaKmVsPrestadora > 0 ? "+" : ""}
                {r.diferenciaKmVsPrestadora.toLocaleString("es-AR")} km
              </div>
            )}
            {datos.prestadoraIngresosDeclarados != null && (
              <div>
                Ingresos declarados por la prestadora: $
                {datos.prestadoraIngresosDeclarados.toLocaleString("es-AR")} vs.
                recaudación digital cargada: $
                {datos.recaudacionDigitalTotal.toLocaleString("es-AR")}
              </div>
            )}
            {datos.prestadoraObservaciones && (
              <div className="text-muted italic">
                &quot;{datos.prestadoraObservaciones}&quot;
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desglose de los 18 rubros */}
      <div className="rounded-2xl border border-line bg-paper overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper-2 text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 w-10">N°</th>
              <th className="px-4 py-3">Rubro</th>
              <th className="px-4 py-3">Cómo se calcula</th>
              <th className="px-4 py-3 text-right">Costo/Km</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {r.rubros.map((rb) => (
              <tr key={rb.id} className="align-top">
                <td className="px-4 py-3 text-muted">{rb.numero}</td>
                <td className="px-4 py-3 font-semibold text-navy">
                  {rb.nombre}
                  {rb.autocalculable && (
                    <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-svc-green/15 text-navy border border-svc-green/40">
                      auto
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted">{rb.explicacion}</td>
                <td className="px-4 py-3 text-right font-semibold text-navy">
                  ${rb.costoKm.toLocaleString("es-AR")}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-paper-2 font-extrabold text-navy">
              <td className="px-4 py-3" colSpan={3}>
                Costo/Km total
              </td>
              <td className="px-4 py-3 text-right">
                ${r.costoKmTotal.toLocaleString("es-AR")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Edición */}
      <details className="rounded-2xl border border-line bg-paper p-5">
        <summary className="cursor-pointer text-sm font-bold text-navy">
          Editar datos de este período
        </summary>
        <form action={accionActualizarFormula} className="flex flex-col gap-6 mt-4">
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="periodo" value={row.periodo} />

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Estado
              </span>
              <select
                name="estado"
                defaultValue={row.estado}
                className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
              >
                <option value="BORRADOR">Borrador</option>
                <option value="CERTIFICADO">
                  Certificado (según Autoridad de Aplicación)
                </option>
                <option value="PUBLICADO">Publicado</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Fuente
              </span>
              <input
                name="fuente"
                maxLength={400}
                defaultValue={row.fuente ?? ""}
                className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
              />
            </label>
          </div>

          <CamposFormula d={datos} />

          <div className="flex items-center gap-3 pt-2 border-t border-line">
            <SubmitButton className="inline-flex items-center px-5 py-2.5 rounded-xl bg-svc-red text-white font-bold text-sm shadow-md shadow-svc-red/30 hover:opacity-90">
              Guardar cambios
            </SubmitButton>
          </div>
        </form>

        <form action={accionEliminarFormula} className="mt-4 pt-4 border-t border-line">
          <input type="hidden" name="id" value={row.id} />
          <SubmitButton className="px-3 py-1.5 rounded-lg border border-svc-red/40 text-svc-red font-semibold text-xs hover:bg-svc-red/10">
            Eliminar este período
          </SubmitButton>
        </form>
      </details>
    </div>
  );
}
