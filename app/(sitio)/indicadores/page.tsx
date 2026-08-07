import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { SVC_META, SVC_ORDER, svcFromKind } from "@/lib/servicios";
import { ESTADO_META, TONE_CLASS } from "@/lib/admin";
import { MapaCalor, type PuntoCalor } from "@/components/mapa/MapaCalor";
import { MigajasSitio, VolverInicio } from "@/components/ui/MigajasSitio";
import type { Prisma, ReclamoEstado } from "@prisma/client";

export const metadata = { title: "Indicadores · ENCOSEP" };
export const revalidate = 60; // se rearma cada minuto en prod (datos casi en vivo)

const SVC_COLORS_HEX: Record<string, string> = {
  agua: "#4ba8c2",
  energia: "#e88a3c",
  residuos: "#4a8b3a",
  transporte: "#7e57c2",
};

const fechaISO = (d: Date) => d.toISOString().slice(0, 10);

type SP = {
  desde?: string;
  hasta?: string;
  svc?: string;
};

export default async function IndicadoresPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const ahora = new Date();
  const anoActual = ahora.getFullYear();

  // Filtros: por defecto, año en curso y todos los servicios.
  const desde = sp.desde ? new Date(`${sp.desde}T00:00:00`) : new Date(anoActual, 0, 1);
  const hasta = sp.hasta ? new Date(`${sp.hasta}T23:59:59`) : ahora;
  const svcFiltro = sp.svc && sp.svc in SVC_META ? SVC_META[sp.svc as keyof typeof SVC_META].kind : null;
  const hayFiltros = Boolean(sp.desde || sp.hasta || sp.svc);
  const qs = new URLSearchParams({
    desde: sp.desde ?? fechaISO(desde),
    hasta: sp.hasta ?? fechaISO(hasta),
    ...(sp.svc ? { svc: sp.svc } : {}),
  }).toString();

  const whereFiltro: Prisma.ReclamoWhereInput = {
    createdAt: { gte: desde, lte: hasta },
    ...(svcFiltro ? { servicio: { kind: svcFiltro } } : {}),
  };

  const [
    total,
    totalPeriodo,
    porEstado,
    porServicio,
    porPrestadora,
    encuesta,
    reclamosCerrados,
    reclamosConGps,
    todosReclamos,
    encuestaReclamos,
  ] = await Promise.all([
    prisma.reclamo.count(),
    prisma.reclamo.count({ where: whereFiltro }),
    prisma.reclamo.groupBy({ by: ["estado"], where: whereFiltro, _count: { _all: true } }),
    prisma.reclamo.groupBy({
      by: ["servicioId"],
      where: whereFiltro,
      _count: { _all: true },
    }),
    prisma.reclamo.groupBy({
      by: ["prestadoraId", "estado"],
      _count: { _all: true },
      where: { ...whereFiltro, prestadoraId: { not: null } },
    }),
    prisma.encuestaServicios.aggregate({
      where: { createdAt: { gte: desde, lte: hasta } },
      _avg: {
        puntajeAgua: true,
        puntajeEnergia: true,
        puntajeResiduos: true,
        puntajeTransporte: true,
      },
      _count: { _all: true },
    }),
    prisma.reclamo.findMany({
      where: { ...whereFiltro, cerradoEn: { not: null } },
      select: { createdAt: true, cerradoEn: true },
    }),
    prisma.reclamo.findMany({
      where: { ...whereFiltro, lat: { not: null }, lng: { not: null } },
      select: {
        codigo: true,
        titulo: true,
        lat: true,
        lng: true,
        estado: true,
        servicio: { select: { kind: true } },
      },
      take: 5000,
    }),
    prisma.reclamo.findMany({
      where: whereFiltro,
      select: {
        barrio: true,
        titulo: true,
        lat: true,
        lng: true,
        createdAt: true,
        servicio: { select: { kind: true } },
        adjuntos: { select: { id: true }, take: 1 },
      },
    }),
    prisma.reclamo.aggregate({
      where: { ...whereFiltro, encuestaEn: { not: null } },
      _avg: { puntajeEnte: true, puntajePrestadora: true },
      _count: { _all: true },
    }),
  ]);

  const puntos: PuntoCalor[] = reclamosConGps
    .filter((r) => r.lat !== null && r.lng !== null)
    .map((r) => ({
      lat: r.lat as number,
      lng: r.lng as number,
      estado: r.estado,
      codigo: r.codigo,
      titulo: r.titulo,
      servicio: r.servicio.kind as PuntoCalor["servicio"],
    }));

  // ==== INDICADORES DE ZONIFICACIÓN Y TIPIFICACIÓN ====

  // Top barrios
  const porBarrio = new Map<string, number>();
  // Top tipos de reclamo (título)
  const porTitulo = new Map<string, { count: number; svc: string }>();
  // Cruce barrio × servicio
  const barrioPorSvc = new Map<string, Map<string, number>>();
  // Tendencia mensual (últimos 6 meses)
  const mesLabel = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const ultimos6Meses: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    ultimos6Meses.push(mesLabel(d));
  }
  const porMes = new Map<string, number>(ultimos6Meses.map((m) => [m, 0]));
  // Día de la semana (0 = Domingo)
  const porDiaSem: number[] = [0, 0, 0, 0, 0, 0, 0];
  // Calidad del reporte
  let conFoto = 0;
  let conGps = 0;
  let conBarrio = 0;

  for (const r of todosReclamos) {
    const b = (r.barrio ?? "").trim() || "Sin barrio especificado";
    porBarrio.set(b, (porBarrio.get(b) ?? 0) + 1);
    if (b !== "Sin barrio especificado") conBarrio++;

    const t = (r.titulo ?? "").trim();
    if (t) {
      const cur = porTitulo.get(t);
      if (cur) cur.count++;
      else
        porTitulo.set(t, {
          count: 1,
          svc: (r.servicio.kind as string).toLowerCase(),
        });
    }

    if (b !== "Sin barrio especificado") {
      if (!barrioPorSvc.has(b)) barrioPorSvc.set(b, new Map());
      const sm = barrioPorSvc.get(b)!;
      const sk = r.servicio.kind as string;
      sm.set(sk, (sm.get(sk) ?? 0) + 1);
    }

    const mes = mesLabel(r.createdAt);
    if (porMes.has(mes)) porMes.set(mes, (porMes.get(mes) ?? 0) + 1);

    porDiaSem[r.createdAt.getDay()]++;

    if (r.adjuntos.length > 0) conFoto++;
    if (r.lat !== null && r.lng !== null) conGps++;
  }

  const topBarrios = [...porBarrio.entries()]
    .filter(([nombre]) => nombre !== "Sin barrio especificado")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const maxBarrios = Math.max(1, ...topBarrios.map(([, n]) => n));

  const topTitulos = [...porTitulo.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);
  const maxTitulos = Math.max(1, ...topTitulos.map(([, v]) => v.count));

  const topBarriosConSvc = topBarrios.slice(0, 5).map(([nombre, count]) => {
    const sm = barrioPorSvc.get(nombre);
    if (!sm) return { nombre, count, top: [] as Array<{ svc: string; n: number }> };
    const top = [...sm.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([svc, n]) => ({ svc, n }));
    return { nombre, count, top };
  });

  const maxPorMes = Math.max(1, ...[...porMes.values()]);
  const maxPorDia = Math.max(1, ...porDiaSem);
  const totalRec = Math.max(1, todosReclamos.length);
  const pctFoto = Math.round((conFoto / totalRec) * 100);
  const pctGps = Math.round((conGps / totalRec) * 100);
  const pctBarrio = Math.round((conBarrio / totalRec) * 100);

  const servicios = await prisma.servicio.findMany();
  const prestadoras = await prisma.prestadora.findMany();

  const totalPeriodoNonZero = Math.max(totalPeriodo, 1);
  const distribServicios = SVC_ORDER.map((k) => {
    const meta = SVC_META[k];
    const svc = servicios.find((s) => s.kind === meta.kind);
    const grupo = svc ? porServicio.find((g) => g.servicioId === svc.id) : null;
    const n = grupo?._count._all ?? 0;
    return {
      key: k,
      label: meta.short,
      total: n,
      pct: Math.round((n / totalPeriodoNonZero) * 100),
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
        <MigajasSitio items={[{ label: "Indicadores" }]} />

        {/* FILTROS — por rango de fechas y servicio, para armar capturas de informes */}
        <form
          method="GET"
          className="flex flex-wrap gap-2 items-end p-3 rounded-xl border border-line bg-paper"
        >
          <Field label="Desde">
            <input
              type="date"
              name="desde"
              defaultValue={sp.desde ?? fechaISO(desde)}
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy focus:outline-none focus:border-navy-2"
            />
          </Field>
          <Field label="Hasta">
            <input
              type="date"
              name="hasta"
              defaultValue={sp.hasta ?? fechaISO(hasta)}
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy focus:outline-none focus:border-navy-2"
            />
          </Field>
          <Field label="Servicio">
            <select
              name="svc"
              defaultValue={sp.svc ?? ""}
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy focus:outline-none focus:border-navy-2"
            >
              <option value="">Todos</option>
              {SVC_ORDER.map((k) => (
                <option key={k} value={k}>
                  {SVC_META[k].short}
                </option>
              ))}
            </select>
          </Field>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-navy-2 text-white font-semibold text-sm"
          >
            Filtrar
          </button>
          {hayFiltros && (
            <Link
              href="/indicadores"
              className="px-4 py-2 rounded-lg border border-line-strong text-sm text-navy"
            >
              Limpiar filtros
            </Link>
          )}
          <div className="flex gap-2 ml-auto">
            <Link
              href={`/api/indicadores/exportar?${qs}`}
              className="px-4 py-2 rounded-lg border border-line-strong text-sm text-navy font-semibold"
            >
              ⬇ Descargar Word
            </Link>
            <Link
              href={`/indicadores/imprimir?${qs}`}
              className="px-4 py-2 rounded-lg border border-line-strong text-sm text-navy font-semibold"
            >
              🖨️ Descargar PDF
            </Link>
          </div>
        </form>

        {/* CIFRAS DE INTERÉS — estilo de la referencia */}
        <section className="rounded-3xl overflow-hidden shadow-xl">
          <div className="bg-gradient-to-br from-svc-red via-[#9b2b2e] to-navy text-white p-8 md:p-10">
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-80">
              {fechaISO(desde) === fechaISO(new Date(anoActual, 0, 1)) && !sp.hasta
                ? `Reclamos año ${anoActual}`
                : `Reclamos del ${desde.toLocaleDateString("es-AR")} al ${hasta.toLocaleDateString("es-AR")}`}
              {svcFiltro ? ` · ${SVC_META[sp.svc as keyof typeof SVC_META].short}` : ""}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-1">
              Cifras de interés
            </h2>
            <div className="text-sm opacity-80 mt-1">
              {totalPeriodo} reclamo{totalPeriodo === 1 ? "" : "s"} registrado
              {totalPeriodo === 1 ? "" : "s"} en el período seleccionado.
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
          <Kpi label="En el período" value={totalPeriodo} tone="info" />
          <Kpi label="Resueltos" value={resueltos} tone="success" />
          <Kpi
            label="Tiempo medio"
            value={tiempoMedioHoras ? `${tiempoMedioHoras}h` : "—"}
            tone="neutral"
          />
        </section>

        {/* MAPA DE CALOR */}
        <section className="rounded-2xl border border-line bg-paper p-6">
          <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-base font-extrabold text-navy uppercase tracking-wider">
              Mapa de calor de reclamos
            </h2>
            <span className="text-xs text-muted">
              {puntos.length} reclamo{puntos.length === 1 ? "" : "s"} con
              ubicación GPS
            </span>
          </div>
          {puntos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line-strong bg-paper-2 p-8 text-center text-muted text-sm">
              Aún no hay reclamos con ubicación GPS cargada.
            </div>
          ) : (
            <>
              <MapaCalor puntos={puntos} alto={460} />
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <div className="rounded-xl border border-line bg-paper-2 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
                    Intensidad
                  </div>
                  <div
                    className="h-3 rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, #4a8b3a 0%, #f0bc40 33%, #e88a3c 66%, #c4393c 100%)",
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-muted mt-1">
                    <span>Pocos reclamos</span>
                    <span>Muchos reclamos</span>
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-paper-2 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
                    Color del punto = servicio
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <Leyenda color="#4ba8c2" label="Agua y Saneamiento" />
                    <Leyenda color="#f0bc40" label="Energía" />
                    <Leyenda color="#4a8b3a" label="Residuos" />
                    <Leyenda color="#7e57c2" label="Transporte" />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted mt-3 leading-relaxed">
                Datos anonimizados: el mapa muestra ubicación y servicio, sin
                nombre ni DNI. Click en un punto para ver el código del reclamo.
              </p>
            </>
          )}
        </section>

        {/* POR ESTADO */}
        <section className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-3">
            Estado de los reclamos
          </h2>
          <div className="flex flex-col gap-2">
            {(Object.keys(ESTADO_META) as ReclamoEstado[]).map((e) => {
              const n = estadoMap.get(e) ?? 0;
              const pct = totalPeriodo === 0 ? 0 : Math.round((n / totalPeriodo) * 100);
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

        {/* TOP BARRIOS */}
        <section className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-1">
            Top 10 barrios con más reclamos
          </h2>
          <p className="text-xs text-muted mb-4">
            Zonificación: dónde se concentran los problemas. Útil para
            priorizar inspecciones territoriales.
          </p>
          {topBarrios.length === 0 ? (
            <div className="text-sm text-muted">
              Aún no hay reclamos con barrio cargado.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {topBarrios.map(([nombre, count], i) => {
                const pct = Math.round((count / maxBarrios) * 100);
                return (
                  <li
                    key={nombre}
                    className="grid grid-cols-[24px_1fr_60px] items-center gap-3"
                  >
                    <span className="text-[11px] text-muted font-mono">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                      <div className="h-7 bg-paper-2 rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-svc-orange to-svc-red rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                        <span className="absolute inset-0 flex items-center px-3 text-sm font-bold text-white drop-shadow">
                          {nombre}
                        </span>
                      </div>
                    </div>
                    <span className="text-right font-mono font-bold text-navy">
                      {count}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* TOP TIPOS DE RECLAMO */}
        <section className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-1">
            Top 10 tipos de reclamo
          </h2>
          <p className="text-xs text-muted mb-4">
            Tipificación: qué problemas son los más reportados por los vecinos.
            Cada barra está coloreada según el servicio al que pertenece.
          </p>
          {topTitulos.length === 0 ? (
            <div className="text-sm text-muted">
              Aún no hay reclamos cargados.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {topTitulos.map(([titulo, v], i) => {
                const pct = Math.round((v.count / maxTitulos) * 100);
                const color = SVC_COLORS_HEX[v.svc] ?? "#1d3550";
                return (
                  <li
                    key={titulo}
                    className="grid grid-cols-[24px_1fr_60px] items-center gap-3"
                  >
                    <span className="text-[11px] text-muted font-mono">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                      <div className="h-7 bg-paper-2 rounded-full overflow-hidden relative">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: color }}
                        />
                        <span className="absolute inset-0 flex items-center px-3 text-xs font-bold text-white drop-shadow truncate">
                          {titulo}
                        </span>
                      </div>
                    </div>
                    <span className="text-right font-mono font-bold text-navy">
                      {v.count}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* CRUCE BARRIO × SERVICIO */}
        {topBarriosConSvc.length > 0 && (
          <section className="rounded-2xl border border-line bg-paper p-6">
            <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-1">
              Top 5 barrios — qué servicio falla más en cada uno
            </h2>
            <p className="text-xs text-muted mb-4">
              Cruce zonificación × tipificación: el servicio principal que
              genera reclamos en cada barrio crítico.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {topBarriosConSvc.map((b) => (
                <div
                  key={b.nombre}
                  className="rounded-xl border border-line bg-paper-2 p-3"
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="text-sm font-bold text-navy">{b.nombre}</h3>
                    <span className="text-xs font-mono text-muted">
                      {b.count} reclamos
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {b.top.map((s) => {
                      const color =
                        SVC_COLORS_HEX[s.svc.toLowerCase()] ?? "#1d3550";
                      const pct = Math.round((s.n / b.count) * 100);
                      const label =
                        s.svc === "AGUA"
                          ? "Agua"
                          : s.svc === "ENERGIA"
                            ? "Energía"
                            : s.svc === "RESIDUOS"
                              ? "Residuos"
                              : "Transporte";
                      return (
                        <div
                          key={s.svc}
                          className="grid grid-cols-[80px_1fr_36px] items-center gap-2 text-xs"
                        >
                          <span className="text-navy">{label}</span>
                          <div className="h-2.5 bg-paper-3 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: color }}
                            />
                          </div>
                          <span className="text-right font-mono text-navy">
                            {s.n}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TENDENCIA MENSUAL */}
        <section className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-1">
            Tendencia · Últimos 6 meses
          </h2>
          <p className="text-xs text-muted mb-4">
            Reclamos cargados por mes. Sirve para ver estacionalidad
            (verano vs invierno) y detectar picos.
          </p>
          <div className="flex items-end gap-2 h-40">
            {[...porMes.entries()].map(([mes, n]) => {
              const pct = (n / maxPorMes) * 100;
              const [a, m] = mes.split("-").map(Number);
              const fecha = new Date(a, m - 1, 1);
              const lbl = fecha.toLocaleDateString("es-AR", {
                month: "short",
              });
              return (
                <div
                  key={mes}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="text-xs font-mono font-bold text-navy">
                    {n}
                  </div>
                  <div className="w-full flex-1 bg-paper-2 rounded-t-lg overflow-hidden flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-navy to-navy-2 rounded-t-lg transition-all"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted">
                    {lbl}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* DÍA DE LA SEMANA */}
        <section className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-1">
            Reclamos por día de la semana
          </h2>
          <p className="text-xs text-muted mb-4">
            En qué día se concentra más la carga. Útil para planificar guardias
            y disponibilidad del equipo.
          </p>
          <div className="flex items-end gap-2 h-32">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(
              (d, i) => {
                const n = porDiaSem[i];
                const pct = (n / maxPorDia) * 100;
                return (
                  <div
                    key={d}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div className="text-xs font-mono font-bold text-navy">
                      {n}
                    </div>
                    <div className="w-full flex-1 bg-paper-2 rounded-t-lg overflow-hidden flex items-end">
                      <div
                        className="w-full bg-svc-blue rounded-t-lg"
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted">
                      {d}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </section>

        {/* SATISFACCIÓN ENTE vs PRESTADORA (encuesta de cierre) */}
        {encuestaReclamos._count._all > 0 && (
          <section className="rounded-2xl border border-line bg-paper p-6">
            <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-1">
              Satisfacción post-reclamo · Ente vs Prestadora
            </h2>
            <p className="text-xs text-muted mb-4">
              Calificaciones que dejaron los vecinos al cerrarse su reclamo
              ({encuestaReclamos._count._all} respuesta
              {encuestaReclamos._count._all === 1 ? "" : "s"}).
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <PuntajeCard
                label="Atención del Ente"
                valor={encuestaReclamos._avg.puntajeEnte}
                color="navy-2"
              />
              <PuntajeCard
                label="Atención de la prestadora"
                valor={encuestaReclamos._avg.puntajePrestadora}
                color="orange"
              />
            </div>
          </section>
        )}

        {/* CALIDAD DEL REPORTE */}
        <section className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-1">
            Calidad del reporte
          </h2>
          <p className="text-xs text-muted mb-4">
            Qué porcentaje de los reclamos tiene cada elemento de respaldo. A
            mayor calidad, mayor capacidad de gestión y de auditoría.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            <CalidadCard label="Con foto adjunta" pct={pctFoto} />
            <CalidadCard label="Con GPS o geolocalización" pct={pctGps} />
            <CalidadCard label="Con barrio especificado" pct={pctBarrio} />
          </div>
        </section>

        {/* SATISFACCIÓN GENERAL (encuesta /encuesta) */}
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

        <VolverInicio />
      </main>
    </>
  );
}

function PuntajeCard({
  label,
  valor,
  color,
}: {
  label: string;
  valor: number | null;
  color: "navy-2" | "orange";
}) {
  const bg = color === "navy-2" ? "bg-navy-2" : "bg-svc-orange";
  return (
    <div className="rounded-xl border border-line bg-paper-2 p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-3xl font-extrabold text-navy">
          {valor ? valor.toFixed(1) : "—"}
        </span>
        <span className="text-sm text-muted">/ 5</span>
      </div>
      <div className="mt-2 h-2 bg-paper-3 rounded-full overflow-hidden">
        <div
          className={`h-full ${bg} rounded-full`}
          style={{ width: `${((valor ?? 0) / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}

function CalidadCard({ label, pct }: { label: string; pct: number }) {
  const tone =
    pct >= 70
      ? "text-svc-green border-svc-green/40"
      : pct >= 40
        ? "text-svc-orange border-svc-orange/40"
        : "text-svc-red border-svc-red/40";
  return (
    <div className={`rounded-xl border-2 ${tone} bg-paper p-4`}>
      <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </div>
      <div className="text-3xl font-extrabold mt-1">{pct}%</div>
      <div className="mt-2 h-2 bg-paper-3 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background:
              pct >= 70 ? "#4a8b3a" : pct >= 40 ? "#e88a3c" : "#c4393c",
          }}
        />
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

function Leyenda({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full"
        style={{ background: color }}
      />
      <span className="text-navy">{label}</span>
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
