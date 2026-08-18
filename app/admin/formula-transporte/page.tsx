import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { puedeGestionarFormulaTransporte } from "@/lib/admin";
import { listarFormulas } from "@/lib/formula-transporte-db";
import { calcularFormula, datosFormulaVacios } from "@/lib/formula-transporte";
import type { FormulaTransporteEstado } from "@prisma/client";

export const dynamic = "force-dynamic";

const ESTADO_BADGE: Record<FormulaTransporteEstado, string> = {
  BORRADOR: "bg-paper-3 text-muted border-line-strong",
  CERTIFICADO: "bg-svc-yellow/20 text-navy border-svc-yellow/60",
  PUBLICADO: "bg-svc-green/15 text-navy border-svc-green/50",
};

const ESTADO_LABEL: Record<FormulaTransporteEstado, string> = {
  BORRADOR: "Borrador",
  CERTIFICADO: "Certificado (Aut. Aplicación)",
  PUBLICADO: "Publicado",
};

export default async function AdminFormulaTransportePage() {
  const session = await auth();
  if (!session) redirect("/ingresar?callbackUrl=/admin/formula-transporte");
  if (!puedeGestionarFormulaTransporte(session.user.rol)) redirect("/admin");

  let filas: Awaited<ReturnType<typeof listarFormulas>> = [];
  let tablaFalta = false;
  try {
    filas = await listarFormulas();
  } catch {
    tablaFalta = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">
            Fórmula tarifaria — Transporte (Grupo MR S.R.L.)
          </h1>
          <p className="text-sm text-muted mt-1 max-w-2xl">
            Costo/Km del contrato de concesión (Ordenanza 17.335/25, 18
            rubros), mes a mes. Permite comparar el Kilometraje certificado
            por la Autoridad de Aplicación contra el reportado por la
            prestadora.
          </p>
        </div>
        <Link
          href="/admin/formula-transporte/nuevo"
          className="inline-flex items-center px-4 py-2 rounded-xl bg-svc-red text-white font-bold text-sm shadow-md shadow-svc-red/30 hover:opacity-90"
        >
          + Cargar período
        </Link>
      </div>

      {tablaFalta ? (
        <div className="rounded-xl border border-svc-red/40 bg-svc-red/10 p-4 text-sm text-navy">
          La tabla todavía no existe en la base. Falta aplicar la migración
          de Prisma (<code>formula_transporte</code>).
        </div>
      ) : filas.length === 0 ? (
        <div className="rounded-xl border border-line bg-paper p-6 text-sm text-navy">
          Todavía no hay ningún período cargado. Usá &quot;Cargar
          período&quot; para el primer mes.
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-paper overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-paper-2 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Período</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Costo/Km</th>
                <th className="px-4 py-3 text-right">Costo del servicio (mes)</th>
                <th className="px-4 py-3 text-right">Km vs. prestadora</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filas.map((f) => {
                const datos = { ...datosFormulaVacios(f.periodo), ...(f.datos as object) };
                const r = calcularFormula(datos as ReturnType<typeof datosFormulaVacios>);
                return (
                  <tr key={f.id} className="align-top">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/formula-transporte/${f.id}`}
                        className="font-semibold text-navy underline underline-offset-2"
                      >
                        {f.periodo}
                      </Link>
                      <div className="text-xs text-muted">{f.fuente ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold ${ESTADO_BADGE[f.estado]}`}
                      >
                        {ESTADO_LABEL[f.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-navy font-semibold">
                      ${r.costoKmTotal.toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3 text-right text-navy">
                      ${r.costoServicioMes.toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.diferenciaKmVsPrestadora === null ? (
                        <span className="text-muted">Sin dato prestadora</span>
                      ) : (
                        <span
                          className={
                            Math.abs(r.diferenciaKmVsPrestadora) < 0.01
                              ? "text-svc-green font-semibold"
                              : "text-svc-red font-semibold"
                          }
                        >
                          {r.diferenciaKmVsPrestadora > 0 ? "+" : ""}
                          {r.diferenciaKmVsPrestadora.toLocaleString("es-AR")} km
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/formula-transporte/${f.id}`}
                        className="px-3 py-1.5 rounded-lg border border-line-strong text-navy font-semibold text-xs hover:bg-paper-2"
                      >
                        Ver / editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
