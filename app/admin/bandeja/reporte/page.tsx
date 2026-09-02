import Link from "next/link";
import { auth } from "@/lib/auth";
import { whereReclamosByRol } from "@/lib/admin";
import { flattenReporte, reporteDiarioPorTema } from "@/lib/reclamos-stats";
import {
  construirSubtitulo,
  mergeWhereServicio,
  resolverRangoReporte,
  type ReporteSP,
} from "@/lib/reportes-reclamos";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { SVC_META, SVC_ORDER, svcFromKind, type SvcKey } from "@/lib/servicios";
import { BotonImprimir } from "./BotonImprimir";

export const metadata = { title: "Reporte de reclamos · Panel ENCOSEP" };

export default async function ReporteDiarioPage({
  searchParams,
}: {
  searchParams: Promise<ReporteSP>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const rolWhere = whereReclamosByRol(
    session!.user.rol,
    session!.user.prestadoraId,
  );

  const rango = resolverRangoReporte(sp);
  const where = mergeWhereServicio(rolWhere, sp.svc);
  const reporte = await reporteDiarioPorTema(where, rango.desde, rango.hasta);
  const filas = flattenReporte(reporte);
  const subtitulo = construirSubtitulo(rango, reporte.desde, reporte.hasta);
  const svcLabel =
    sp.svc && sp.svc in SVC_META ? SVC_META[sp.svc as SvcKey].label : null;

  const qs = new URLSearchParams();
  if (rango.esRangoPersonalizado) {
    if (sp.desde) qs.set("desde", sp.desde);
    if (sp.hasta) qs.set("hasta", sp.hasta);
  } else {
    qs.set("periodo", rango.periodo);
  }
  if (sp.svc) qs.set("svc", sp.svc);
  const qsStr = qs.toString();

  return (
    <div className="flex flex-col gap-5">
      <header className="print:hidden">
        <Link
          href="/admin/bandeja"
          className="text-xs text-navy-2 underline underline-offset-4"
        >
          ← Volver a la bandeja
        </Link>
        <h1 className="text-2xl font-extrabold text-navy mt-1">
          Reporte de reclamos por tema y problemática
        </h1>
      </header>

      <form
        method="GET"
        className="flex flex-wrap gap-2 items-end p-3 rounded-xl border border-line bg-paper print:hidden"
      >
        <Field label="Período">
          <select
            name="periodo"
            defaultValue={rango.periodo}
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy focus:outline-none focus:border-navy-2"
          >
            <option value="hoy">Diario (hoy)</option>
            <option value="semana">Semanal (últimos 7 días)</option>
            <option value="mes">Mensual (últimos 30 días)</option>
          </select>
        </Field>
        <Field label="Servicio">
          <select
            name="svc"
            defaultValue={sp.svc ?? ""}
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy focus:outline-none focus:border-navy-2"
          >
            <option value="">Todos los servicios</option>
            {SVC_ORDER.map((k) => (
              <option key={k} value={k}>
                {SVC_META[k].label}
              </option>
            ))}
          </select>
        </Field>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-navy-2 text-white font-semibold text-sm"
        >
          Generar reporte
        </button>
        {rango.esRangoPersonalizado && (
          <span className="text-xs text-muted self-center">
            Usando el rango filtrado en la Bandeja ({reporte.desde} al {reporte.hasta}).{" "}
            <Link
              href="/admin/bandeja/reporte"
              className="text-navy-2 underline underline-offset-4"
            >
              Quitar
            </Link>
          </span>
        )}
      </form>

      <div className="flex flex-wrap gap-2 print:hidden">
        <a
          href={`/api/reportes/reclamos/exportar-word?${qsStr}&formato=oficio`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy text-white text-sm font-bold hover:opacity-90"
        >
          📄 Word — OFICIO
        </a>
        <a
          href={`/api/reportes/reclamos/exportar-word?${qsStr}&formato=a4`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-line-strong text-navy text-sm font-bold hover:bg-paper-2"
        >
          📄 Word — A4
        </a>
        <a
          href={`/api/reportes/reclamos/exportar-excel?${qsStr}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-line-strong text-navy text-sm font-bold hover:bg-paper-2"
        >
          📊 Excel (Anexo)
        </a>
        <div className="ml-auto">
          <BotonImprimir />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-paper p-6 print:border-0 print:p-0">
        <div className="text-center mb-6 pb-4 border-b border-line">
          <div className="text-[10px] font-bold tracking-widest opacity-60 uppercase">
            ENCOSEP
          </div>
          <h2 className="text-xl font-extrabold text-navy mt-1">
            Reporte de reclamos por tema y problemática
          </h2>
          <p className="text-sm text-muted mt-1">
            {subtitulo}
            {svcLabel ? ` — Servicio: ${svcLabel}` : ""}
          </p>
          <p className="text-[11px] text-muted mt-0.5">
            Generado el {reporte.generadoEn} hs
          </p>
        </div>

        {/* --- Resumen ejecutivo --- */}
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
          Resumen ejecutivo
        </h3>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <div className="text-center px-4">
            <span className="text-3xl font-extrabold text-navy">
              {reporte.total}
            </span>
            <span className="text-sm text-muted ml-2">
              {reporte.total === 1
                ? "reclamo en el período"
                : "reclamos en el período"}
            </span>
          </div>
          {reporte.temas.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {reporte.temas.map((t) => (
                <span
                  key={t.servicioId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-paper-2 text-xs text-navy"
                >
                  <b className="font-extrabold">{t.cantidad}</b> {t.nombreCorto}{" "}
                  <span className="text-muted">
                    ({reporte.total > 0 ? Math.round((t.cantidad / reporte.total) * 100) : 0}
                    %)
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {reporte.temas.length === 0 ? (
          <div className="text-center text-muted text-sm py-10">
            No hay reclamos registrados en este período.
          </div>
        ) : (
          <div className="flex flex-col gap-5 mb-8">
            {reporte.temas.map((tema) => (
              <section
                key={tema.servicioId}
                className="rounded-xl border border-line overflow-hidden print:break-inside-avoid"
              >
                <div className="flex items-center gap-3 bg-paper-2 px-4 py-3">
                  <SvcIcon kind={svcFromKind(tema.kind)} size={32} />
                  <h4 className="flex-1 font-bold text-navy">{tema.nombre}</h4>
                  <span className="font-mono font-extrabold text-navy">
                    {tema.cantidad}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead className="text-[11px] uppercase tracking-wider text-muted bg-paper-2/50">
                    <tr>
                      <th className="text-left font-semibold py-2 px-4">
                        Problemática (causa)
                      </th>
                      <th className="text-right font-semibold py-2 px-4">
                        Cantidad
                      </th>
                      <th className="text-right font-semibold py-2 px-4">
                        % del tema
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tema.problematicas.map((p) => (
                      <tr key={p.titulo} className="border-t border-line">
                        <td className="py-2 px-4 text-navy">{p.titulo}</td>
                        <td className="py-2 px-4 text-right font-mono font-semibold text-navy">
                          {p.cantidad}
                        </td>
                        <td className="py-2 px-4 text-right text-muted">
                          {Math.round((p.cantidad / tema.cantidad) * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}
          </div>
        )}

        {/* --- Anexo --- */}
        <div className="print:break-before-page pt-4 border-t border-line">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-1 mt-4">
            Anexo — Detalle de reclamos
          </h3>
          <p className="text-xs text-muted mb-3">
            Listado individual del período, del más reciente al más antiguo.
            También disponible en Excel con filtros por columna (servicio,
            problemática, zona, estado).
          </p>
          {filas.length === 0 ? (
            <div className="text-center text-muted text-sm py-6">
              No hay reclamos para detallar.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-muted bg-paper-2">
                  <tr>
                    <th className="text-left font-semibold py-2 px-3">Código</th>
                    <th className="text-left font-semibold py-2 px-3">Fecha</th>
                    <th className="text-left font-semibold py-2 px-3">Servicio</th>
                    <th className="text-left font-semibold py-2 px-3">Problemática</th>
                    <th className="text-left font-semibold py-2 px-3">Estado</th>
                    <th className="text-left font-semibold py-2 px-3">Dirección</th>
                    <th className="text-left font-semibold py-2 px-3">Vecino</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f, i) => (
                    <tr key={`${f.codigo}-${i}`} className="border-t border-line">
                      <td className="py-2 px-3">
                        <span className="font-mono font-bold text-navy whitespace-nowrap">
                          #{f.codigo}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-muted whitespace-nowrap">
                        {f.fecha}
                      </td>
                      <td className="py-2 px-3 text-navy whitespace-nowrap">{f.tema}</td>
                      <td className="py-2 px-3 text-navy max-w-[220px]">
                        {f.problematica}
                      </td>
                      <td className="py-2 px-3">
                        <EstadoBadge estado={f.estado} size="sm" />
                      </td>
                      <td className="py-2 px-3 text-muted max-w-[200px] truncate">
                        {f.direccion}
                        {f.barrio ? `, ${f.barrio}` : ""}
                      </td>
                      <td className="py-2 px-3 text-muted whitespace-nowrap max-w-[160px] truncate">
                        {f.vecino}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </span>
      {children}
    </label>
  );
}
