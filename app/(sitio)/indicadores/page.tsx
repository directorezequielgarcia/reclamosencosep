import { prisma } from "@/lib/prisma";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { SVC_META, SVC_ORDER, svcFromKind } from "@/lib/servicios";
import { ESTADO_META, TONE_CLASS } from "@/lib/admin";
import type { ReclamoEstado } from "@prisma/client";

export const metadata = { title: "Indicadores · ENCOSEP" };
export const revalidate = 60; // se rearma cada minuto en prod (datos casi en vivo)

const SVC_COLORS_HEX: Record<string, string> = {
  agua: "#4ba8c2",
  energia: "#e88a3c",
  residuos: "#4a8b3a",
  transporte: "#7e57c2",
};

export default async function IndicadoresPage() {
  const ahora = new Date();
  const anoActual = ahora.getFullYear();
  const desdeAno = new Date(anoActual, 0, 1);

  const [total, totalAno, porEstado, porServicio, porPrestadora, encuesta, reclamosCerrados] =
    await Promise.all([
      prisma.reclamo.count(),
      prisma.reclamo.count({ where: { createdAt: { gte: desdeAno } } }),
      prisma.reclamo.groupBy({ by: ["estado"], _count: { _all: true } }),
      prisma.reclamo.groupBy({
        by: ["servicioId"],
        where: { createdAt: { gte: desdeAno } },
        _count: { _all: true },
      }),
      prisma.reclamo.groupBy({
        by: ["prestadoraId", "estado"],
        _count: { _all: true },
        where: { prestadoraId: { not: null } },
      }),
      prisma.encuestaServicios.aggregate({
        _avg: {
          puntajeAgua: true,
          puntajeEnergia: true,
          puntajeResiduos: true,
          puntajeTransporte: true,
        },
        _count: { _all: true },
      }),
      prisma.reclamo.findMany({
        where: { cerradoEn: { not: null } },
        select: { createdAt: true, cerradoEn: true },
      }),
    ]);

  const servicios = await prisma.servicio.findMany();
  const prestadoras = await prisma.prestadora.findMany();

  const totalAnoNonZero = Math.max(totalAno, 1);
  const distribServicios = SVC_ORDER.map((k) => {
    const meta = SVC_META[k];
    const svc = servicios.find((s) => s.kind === meta.kind);
    const grupo = svc ? porServicio.find((g) => g.servicioId === svc.id) : null;
    const n = grupo?._count._all ?? 0;
    return {
      key: k,
      label: meta.short,
      total: n,
      pct: Math.round((n / totalAnoNonZero) * 100),
      color: SVC_COLORS_HEX[k],
    };
  }).sort((a, b) => b.total - a.total);

  const estadoMap = new Map(porEstado.map((p) => [p.estado, p._count._all]));
  const resueltos = estadoMap.get("RESUELTO") ?? 0;
  const cerradosSinSolucion = estadoMap.get("CERRADO_SIN_SOLUCION") ?? 0;
  const abiertos =
    (estadoMap.get("RECIBIDO") ?? 0) +
    (estadoMap.get("EN_REVISION") ?? 0) +
    (estadoMap.get("DERIVADO") ?? 0) +
    (estadoMap.get("EN_PROCESO") ?? 0);

  // Tiempo medio de resolución (en horas)
  let tiempoMedioHoras = 0;
  if (reclamosCerrados.length > 0) {
    const sum = reclamosCerrados.reduce((acc, r) => {
      if (!r.cerradoEn) return acc;
      return acc + (r.cerradoEn.getTime() - r.createdAt.getTime());
    }, 0);
    tiempoMedioHoras = Math.round(sum / reclamosCerrados.length / (1000 * 60 * 60));
  }

  // Cumplimiento por prestadora
  const cumplimiento = prestadoras
    .map((p) => {
      const grupos = porPrestadora.filter((g) => g.prestadoraId === p.id);
      const totalP = grupos.reduce((s, g) => s + g._count._all, 0);
      const resP = grupos
        .filter((g) => g.estado === "RESUELTO")
        .reduce((s, g) => s + g._count._all, 0);
      const pct = totalP === 0 ? null : Math.round((resP / totalP) * 100);
      return { nombre: p.razonSocial, total: totalP, resueltos: resP, pct };
    })
    .filter((p) => p.total > 0)
    .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));

  return (
    <>
      <SeccionHeader
        kicker="Datos en tiempo real"
        titulo="Indicadores públicos"
        descripcion="Información agregada y anonimizada sobre la gestión del Ente: reclamos, resolución por prestadora y satisfacción del usuario. Actualizado cada minuto."
      />

      <main className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8">
        {/* CIFRAS DE INTERÉS — estilo de la referencia */}
        <section className="rounded-3xl overflow-hidden shadow-xl">
          <div className="bg-gradient-to-br from-svc-red via-[#9b2b2e] to-navy text-white p-8 md:p-10">
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-80">
              Reclamos año {anoActual}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-1">
              Cifras de interés
            </h2>
            <div className="text-sm opacity-80 mt-1">
              {totalAno} reclamo{totalAno === 1 ? "" : "s"} registrado
              {totalAno === 1 ? "" : "s"} en lo que va del año.
            </div>

            <div className="mt-8 flex flex-col gap-5">
              {distribServicios.map((d) => (
                <div key={d.key} className="grid grid-cols-[140px_1fr_50px] items-center gap-4">
                  <div className="text-sm font-bold uppercase tracking-wider">
                    {d.label}
                  </div>
                  <div className="h-7 bg-white/15 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(d.pct, 1)}%`,
                        background: d.color,
                      }}
                    />
                  </div>
                  <div className="text-right font-extrabold text-base">
                    {d.pct}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* KPIs GENERALES */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Total histórico" value={total} />
          <Kpi label={`Año ${anoActual}`} value={totalAno} tone="info" />
          <Kpi label="Resueltos" value={resueltos} tone="success" />
          <Kpi
            label="Tiempo medio"
            value={tiempoMedioHoras ? `${tiempoMedioHoras}h` : "—"}
            tone="neutral"
          />
        </section>

        {/* POR ESTADO */}
        <section className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-3">
            Estado de los reclamos
          </h2>
          <div className="flex flex-col gap-2">
            {(Object.keys(ESTADO_META) as ReclamoEstado[]).map((e) => {
              const n = estadoMap.get(e) ?? 0;
              const pct = total === 0 ? 0 : Math.round((n / total) * 100);
              const m = ESTADO_META[e];
              return (
                <div key={e} className="grid grid-cols-[180px_1fr_60px] items-center gap-3">
                  <span
                    className={`inline-flex items-center text-[10px] uppercase tracking-wider font-bold rounded-full border px-2 py-1 ${TONE_CLASS[m.tone]}`}
                  >
                    {m.label}
                  </span>
                  <div className="h-3 bg-paper-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-navy-2 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-right font-mono font-bold text-navy">
                    {n}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* CUMPLIMIENTO PRESTADORAS */}
        <section className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-3">
            Cumplimiento por prestadora
          </h2>
          {cumplimiento.length === 0 ? (
            <div className="text-sm text-muted">
              Aún no hay reclamos asignados a prestadoras.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {cumplimiento.map((p) => (
                <li
                  key={p.nombre}
                  className="grid grid-cols-[1fr_120px_60px] items-center gap-3"
                >
                  <span className="text-sm text-navy font-semibold">
                    {p.nombre}
                  </span>
                  <div className="h-3 bg-paper-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-svc-green rounded-full"
                      style={{ width: `${p.pct ?? 0}%` }}
                    />
                  </div>
                  <span className="text-right text-xs font-mono text-navy">
                    {p.pct ?? 0}% ({p.resueltos}/{p.total})
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted mt-3 leading-relaxed">
            Porcentaje de reclamos derivados que la prestadora resolvió respecto
            del total que tiene asignados.
          </p>
        </section>

        {/* SATISFACCIÓN */}
        <section className="rounded-2xl border border-line bg-paper-2 p-6">
          <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-3">
            Satisfacción del usuario
          </h2>
          <div className="text-sm text-muted">
            {encuesta._count._all === 0 ? (
              <>
                Aún no hay respuestas a la encuesta de satisfacción.{" "}
                <a
                  href="/encuesta"
                  className="text-navy-2 font-bold underline underline-offset-4"
                >
                  Respondé la encuesta →
                </a>
              </>
            ) : (
              <>
                <div className="text-navy">
                  Promedios sobre {encuesta._count._all} respuesta
                  {encuesta._count._all === 1 ? "" : "s"} ciudadanas (escala 1
                  al 5):
                </div>
                <div className="grid sm:grid-cols-2 gap-2 mt-3">
                  {[
                    { k: "Agua y Saneamiento", v: encuesta._avg.puntajeAgua },
                    { k: "Energía Eléctrica", v: encuesta._avg.puntajeEnergia },
                    { k: "Residuos", v: encuesta._avg.puntajeResiduos },
                    { k: "Transporte", v: encuesta._avg.puntajeTransporte },
                  ].map((row) => (
                    <div
                      key={row.k}
                      className="flex items-center justify-between rounded-lg border border-line bg-paper px-3 py-2"
                    >
                      <span className="text-sm text-navy">{row.k}</span>
                      <span className="text-lg font-extrabold text-navy">
                        {row.v ? row.v.toFixed(1) : "—"}
                        {row.v ? <span className="text-sm text-muted"> / 5</span> : null}
                      </span>
                    </div>
                  ))}
                </div>
                <a
                  href="/encuesta"
                  className="inline-block mt-4 text-navy-2 font-bold underline underline-offset-4 text-sm"
                >
                  Sumá tu respuesta →
                </a>
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function Kpi({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "info" | "success";
}) {
  const cls =
    tone === "info"
      ? "border-svc-blue/60"
      : tone === "success"
        ? "border-svc-green/50"
        : "border-line";
  return (
    <div className={`rounded-2xl border-2 ${cls} bg-paper p-4`}>
      <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </div>
      <div className="text-3xl font-extrabold text-navy leading-none mt-1">
        {value}
      </div>
    </div>
  );
}
