import Link from "next/link";
import { auth } from "@/lib/auth";
import { whereReclamosByRol } from "@/lib/admin";
import { reporteDiarioPorTema } from "@/lib/reclamos-stats";
import { inicioDiaLocal, finDiaLocal } from "@/lib/horario";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { svcFromKind } from "@/lib/servicios";
import { BotonImprimir } from "./BotonImprimir";

export const metadata = { title: "Reporte diario · Panel ENCOSEP" };

type SP = { desde?: string; hasta?: string; periodo?: string };

export default async function ReporteDiarioPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const where = whereReclamosByRol(
    session!.user.rol,
    session!.user.prestadoraId,
  );

  const esRangoPersonalizado = Boolean(sp.desde || sp.hasta);
  const esSemana = !esRangoPersonalizado && sp.periodo === "semana";
  const esHoy = !esRangoPersonalizado && !esSemana;

  const desde = esRangoPersonalizado
    ? new Date(`${sp.desde ?? sp.hasta}T00:00:00`)
    : esSemana
      ? inicioDiaLocal(6)
      : inicioDiaLocal(0);
  const hasta = esRangoPersonalizado
    ? new Date(`${sp.hasta ?? sp.desde}T23:59:59`)
    : finDiaLocal(0);

  const reporte = await reporteDiarioPorTema(where, desde, hasta);

  const subtitulo = esRangoPersonalizado
    ? reporte.desde === reporte.hasta
      ? `Reclamos del ${reporte.desde}`
      : `Reclamos del ${reporte.desde} al ${reporte.hasta}`
    : esSemana
      ? `Reclamos de la última semana, del ${reporte.desde} al ${reporte.hasta}`
      : `Reclamos de hoy, ${reporte.hasta}`;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4 flex-wrap print:hidden">
        <div>
          <Link
            href="/admin/bandeja"
            className="text-xs text-navy-2 underline underline-offset-4"
          >
            ← Volver a la bandeja
          </Link>
          <h1 className="text-2xl font-extrabold text-navy mt-1">
            Reporte por tema y problemática
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-line-strong overflow-hidden text-sm">
            <PeriodoTab href="?periodo=hoy" activo={esHoy}>
              Hoy
            </PeriodoTab>
            <PeriodoTab href="?periodo=semana" activo={esSemana}>
              Última semana
            </PeriodoTab>
          </div>
          <BotonImprimir />
        </div>
      </header>

      {esRangoPersonalizado && (
        <p className="text-xs text-muted print:hidden -mt-3">
          Mostrando el rango de fechas filtrado en la Bandeja.{" "}
          <Link
            href="/admin/bandeja/reporte"
            className="text-navy-2 underline underline-offset-4"
          >
            Ver reporte de hoy en cambio
          </Link>
          .
        </p>
      )}

      <div className="rounded-2xl border border-line bg-paper p-6 print:border-0 print:p-0">
        <div className="text-center mb-6 pb-4 border-b border-line">
          <div className="text-[10px] font-bold tracking-widest opacity-60 uppercase">
            ENCOSEP
          </div>
          <h2 className="text-xl font-extrabold text-navy mt-1">
            Reporte de reclamos por tema y problemática
          </h2>
          <p className="text-sm text-muted mt-1">{subtitulo}</p>
          <p className="text-[11px] text-muted mt-0.5">
            Generado el {reporte.generadoEn} hs
          </p>
        </div>

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
                  <b className="font-extrabold">{t.cantidad}</b> {t.nombreCorto}
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
          <div className="flex flex-col gap-5">
            {reporte.temas.map((tema) => (
              <section
                key={tema.servicioId}
                className="rounded-xl border border-line overflow-hidden print:break-inside-avoid"
              >
                <div className="flex items-center gap-3 bg-paper-2 px-4 py-3">
                  <SvcIcon kind={svcFromKind(tema.kind)} size={32} />
                  <h3 className="flex-1 font-bold text-navy">{tema.nombre}</h3>
                  <span className="font-mono font-extrabold text-navy">
                    {tema.cantidad}
                  </span>
                </div>

                <div className="divide-y divide-line">
                  {tema.problematicas.map((p) => (
                    <div key={p.titulo}>
                      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-paper-2/50">
                        <h4 className="font-semibold text-navy text-sm">
                          {p.titulo}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-muted shrink-0">
                          <span className="font-mono font-bold text-navy">
                            {p.cantidad}
                          </span>
                          <span>
                            ({Math.round((p.cantidad / tema.cantidad) * 100)}%)
                          </span>
                        </div>
                      </div>
                      <div className="divide-y divide-line">
                        {p.reclamos.map((r) => (
                          <div key={r.id} className="px-4 py-2.5">
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <Link
                                href={`/admin/reclamo/${r.id}`}
                                className="font-mono font-bold text-navy hover:underline"
                              >
                                #{r.codigo}
                              </Link>
                              <EstadoBadge estado={r.estado} size="sm" />
                              <span className="text-muted">{r.fecha}</span>
                              <span className="ml-auto text-muted truncate max-w-[220px]">
                                {r.vecino}
                              </span>
                            </div>
                            <div className="text-xs text-muted mt-1">
                              {r.direccion}
                              {r.barrio ? `, ${r.barrio}` : ""}
                            </div>
                            {r.descripcion && (
                              <p className="text-xs text-navy/80 mt-1 line-clamp-2">
                                {r.descripcion}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PeriodoTab({
  href,
  activo,
  children,
}: {
  href: string;
  activo: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 font-semibold transition ${
        activo
          ? "bg-navy-2 text-white"
          : "bg-paper text-navy hover:bg-paper-2"
      }`}
    >
      {children}
    </Link>
  );
}
