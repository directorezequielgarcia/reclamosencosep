import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ESTADO_META, TONE_CLASS, whereReclamosByRol } from "@/lib/admin";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { svcFromKind } from "@/lib/servicios";
import { resumenVisitas } from "@/lib/visitas";
import { resumenReclamos } from "@/lib/reclamos-stats";
import type { ReclamoEstado } from "@prisma/client";

export const metadata = { title: "Dashboard · Panel ENCOSEP" };

export default async function DashboardPage() {
  const session = await auth();
  const where = whereReclamosByRol(
    session!.user.rol,
    session!.user.prestadoraId,
  );

  const [porEstado, porServicio, recientes, total, visitas, reclamosHoy] = await Promise.all([
    prisma.reclamo.groupBy({
      by: ["estado"],
      where,
      _count: { _all: true },
    }),
    prisma.reclamo.groupBy({
      by: ["servicioId"],
      where,
      _count: { _all: true },
    }),
    prisma.reclamo.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { servicio: true, prestadora: true, ciudadano: true },
    }),
    prisma.reclamo.count({ where }),
    resumenVisitas(),
    resumenReclamos(where),
  ]);

  const servicios = await prisma.servicio.findMany();
  const svcById = new Map(servicios.map((s) => [s.id, s]));

  const estadoMap = new Map(porEstado.map((p) => [p.estado, p._count._all]));
  const abiertos =
    (estadoMap.get("RECIBIDO") ?? 0) +
    (estadoMap.get("EN_REVISION") ?? 0) +
    (estadoMap.get("DERIVADO") ?? 0) +
    (estadoMap.get("EN_PROCESO") ?? 0);
  const resueltos = estadoMap.get("RESUELTO") ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold text-navy">Resumen general</h1>
        <p className="text-sm text-muted mt-1">
          Vista global de los reclamos bajo control del Ente.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Total" value={total} />
        <Kpi label="Abiertos" value={abiertos} tone="warning" />
        <Kpi label="Resueltos" value={resueltos} tone="success" />
        <Kpi label="Recibidos hoy" value={reclamosHoy.hoy} />
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <Card titulo="Por estado">
          <div className="flex flex-col gap-2">
            {(Object.keys(ESTADO_META) as ReclamoEstado[]).map((e) => {
              const n = estadoMap.get(e) ?? 0;
              return (
                <div
                  key={e}
                  className="flex items-center gap-3 text-sm py-1.5"
                >
                  <EstadoBadge estado={e} size="sm" />
                  <div className="flex-1 h-2 bg-paper-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${TONE_CLASS[ESTADO_META[e].tone].split(" ")[0]}`}
                      style={{
                        width:
                          total === 0
                            ? "0%"
                            : `${Math.round((n / total) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono font-bold text-navy">
                    {n}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card titulo="Por servicio">
          <div className="grid grid-cols-2 gap-3">
            {porServicio.map((p) => {
              const svc = svcById.get(p.servicioId);
              if (!svc) return null;
              const kind = svcFromKind(svc.kind);
              return (
                <div
                  key={p.servicioId}
                  className="flex items-center gap-3 p-2 rounded-lg border border-line bg-paper"
                >
                  <SvcIcon kind={kind} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted">{svc.nombreCorto}</div>
                    <div className="text-xl font-extrabold text-navy leading-tight">
                      {p._count._all}
                    </div>
                  </div>
                </div>
              );
            })}
            {porServicio.length === 0 && (
              <div className="col-span-2 text-sm text-muted text-center py-6">
                Aún no hay reclamos registrados.
              </div>
            )}
          </div>
        </Card>
      </section>

      <Card titulo="Últimos reclamos" right={<Link href="/admin/bandeja" className="text-xs text-navy-2 underline underline-offset-4">Ver bandeja</Link>}>
        {recientes.length === 0 ? (
          <div className="text-sm text-muted text-center py-6">
            Sin reclamos por ahora.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted">
              <tr className="border-b border-line">
                <th className="text-left font-semibold py-2">Código</th>
                <th className="text-left font-semibold py-2">Servicio</th>
                <th className="text-left font-semibold py-2">Vecino</th>
                <th className="text-left font-semibold py-2">Dirección</th>
                <th className="text-left font-semibold py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {recientes.map((r) => {
                const svc = svcFromKind(r.servicio.kind);
                return (
                  <tr key={r.id} className="border-b border-line last:border-0 hover:bg-paper-2">
                    <td className="py-2">
                      <Link
                        href={`/admin/reclamo/${r.id}`}
                        className="font-mono font-bold text-navy hover:underline"
                      >
                        #{r.codigo}
                      </Link>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <SvcIcon kind={svc} size={28} />
                        <span className="text-navy">{r.servicio.nombreCorto}</span>
                      </div>
                    </td>
                    <td className="py-2 text-navy truncate max-w-[140px]">
                      {r.ciudadano.nombre} {r.ciudadano.apellido}
                    </td>
                    <td className="py-2 text-muted truncate max-w-[200px]">
                      {r.direccion}
                    </td>
                    <td className="py-2">
                      <EstadoBadge estado={r.estado} size="sm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Card titulo={`Reclamos de hoy · ${reclamosHoy.fecha}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <MiniKpi label="Nuevos hoy" value={reclamosHoy.hoy} />
          <MiniKpi label="Fuera de horario hábil" value={reclamosHoy.hoyFueraDeHorario} />
          <MiniKpi label="Esta semana (7 días)" value={reclamosHoy.semana} />
        </div>
        <p className="text-[11px] text-muted mb-3 leading-relaxed">
          ENCOSEP atiende en horario hábil (lun. a vie. de 8 a 15 hs). &ldquo;Fuera
          de horario&rdquo; son reclamos que un vecino cargó hoy fuera de esa
          franja (a la noche, un fin de semana) — quedan esperando igual, y
          se ven acá apenas se abre el horario de atención.
        </p>
        {reclamosHoy.porTipoHoy.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {reclamosHoy.porTipoHoy.map((t) => (
              <span
                key={t.nombre}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-paper-2 text-xs text-navy"
              >
                <b className="font-extrabold">{t.cantidad}</b> {t.nombreCorto}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted text-center py-2">
            Todavía no hay reclamos nuevos hoy.
          </div>
        )}
      </Card>

      <Card titulo="Visitas al sitio">
        <p className="text-[11px] text-muted mb-3 leading-relaxed">
          Cada visita es una carga de página del sitio público o del área del
          vecino (no cuenta este panel admin). &ldquo;Únicos&rdquo; son
          dispositivos/redes distintas en el período — no se guarda la IP
          real, solo un hash. Si una misma persona entra varias veces al día
          suma varias &ldquo;visitas&rdquo; pero un solo &ldquo;único&rdquo;.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <MiniKpi label="Hoy" value={visitas.hoy} />
          <MiniKpi label="Visitantes únicos hoy" value={visitas.unicosHoy} />
          <MiniKpi label="Fuera de horario hábil" value={visitas.hoyFueraDeHorario} />
          <MiniKpi label="Últimos 7 días" value={visitas.semana} />
          <MiniKpi label="Únicos (7 días)" value={visitas.unicosSemana} />
        </div>
        <div className="flex items-end gap-1.5 h-24">
          {visitas.serie.map((d) => {
            const max = Math.max(1, ...visitas.serie.map((x) => x.visitas));
            const alturaPct = Math.round((d.visitas / max) * 100);
            return (
              <div
                key={d.fecha}
                className="flex-1 flex flex-col items-center gap-1"
                title={`${d.fecha}: ${d.visitas} visita${d.visitas === 1 ? "" : "s"}`}
              >
                <div className="w-full h-20 flex items-end">
                  <div
                    className="w-full bg-navy-2/70 hover:bg-navy-2 rounded-t-sm transition-colors"
                    style={{ height: `${Math.max(alturaPct, d.visitas > 0 ? 6 : 0)}%` }}
                  />
                </div>
                <span className="text-[9px] text-muted">{d.fecha}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "warning" | "success";
}) {
  const cls =
    tone === "warning"
      ? "border-svc-yellow/60"
      : tone === "success"
        ? "border-svc-green/50"
        : "border-line";
  return (
    <div
      className={`rounded-2xl border-2 ${cls} bg-paper p-4 flex flex-col gap-1`}
    >
      <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </div>
      <div className="text-3xl font-extrabold text-navy leading-none">
        {value}
      </div>
    </div>
  );
}

function MiniKpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-line bg-paper-2 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </div>
      <div className="text-xl font-extrabold text-navy leading-tight">{value}</div>
    </div>
  );
}

function Card({
  titulo,
  children,
  right,
}: {
  titulo: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-navy uppercase tracking-wider">
          {titulo}
        </h2>
        {right}
      </div>
      {children}
    </div>
  );
}
