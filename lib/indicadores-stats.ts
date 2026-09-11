import { prisma } from "@/lib/prisma";
import { SVC_META, SVC_ORDER, SVC_COLOR_HEX } from "@/lib/servicios";
import type { Prisma, ReclamoEstado, ServicioKind } from "@prisma/client";

export type FiltroIndicadores = {
  desde?: string;
  hasta?: string;
  svc?: string;
};

// Único lugar donde se resuelven los filtros de fecha/servicio de /indicadores
// (página pública, panel de consulta, export a Word/Excel y vista de
// impresión usan exactamente los mismos números).
export function resolverFiltroIndicadores(sp: FiltroIndicadores) {
  const ahora = new Date();
  const anoActual = ahora.getFullYear();
  const desde = sp.desde ? new Date(`${sp.desde}T00:00:00`) : new Date(anoActual, 0, 1);
  const hasta = sp.hasta ? new Date(`${sp.hasta}T23:59:59`) : ahora;
  const svcFiltro: ServicioKind | null =
    sp.svc && sp.svc in SVC_META ? SVC_META[sp.svc as keyof typeof SVC_META].kind : null;
  const svcLabel = sp.svc && sp.svc in SVC_META ? SVC_META[sp.svc as keyof typeof SVC_META].short : null;

  const whereFiltro: Prisma.ReclamoWhereInput = {
    createdAt: { gte: desde, lte: hasta },
    ...(svcFiltro ? { servicio: { kind: svcFiltro } } : {}),
  };

  return { ahora, anoActual, desde, hasta, svcFiltro, svcLabel, whereFiltro };
}

const mesLabel = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export type PuntoIndicador = {
  lat: number;
  lng: number;
  estado: ReclamoEstado;
  codigo: string;
  titulo: string;
  servicio: ServicioKind;
};

export async function getIndicadoresStats(sp: FiltroIndicadores) {
  const { ahora, desde, hasta, svcLabel, whereFiltro } = resolverFiltroIndicadores(sp);

  const [
    total,
    totalPeriodo,
    porEstado,
    porServicio,
    porPrestadora,
    reclamosCerrados,
    todosReclamos,
    encuesta,
    encuestaCierre,
  ] = await Promise.all([
    prisma.reclamo.count(),
    prisma.reclamo.count({ where: whereFiltro }),
    prisma.reclamo.groupBy({ by: ["estado"], where: whereFiltro, _count: { _all: true } }),
    prisma.reclamo.groupBy({ by: ["servicioId"], where: whereFiltro, _count: { _all: true } }),
    prisma.reclamo.groupBy({
      by: ["prestadoraId", "estado"],
      _count: { _all: true },
      where: { ...whereFiltro, prestadoraId: { not: null } },
    }),
    prisma.reclamo.findMany({
      where: { ...whereFiltro, cerradoEn: { not: null } },
      select: { createdAt: true, cerradoEn: true },
    }),
    prisma.reclamo.findMany({
      where: whereFiltro,
      select: {
        codigo: true,
        titulo: true,
        barrio: true,
        lat: true,
        lng: true,
        estado: true,
        createdAt: true,
        servicio: { select: { kind: true } },
        adjuntos: { select: { id: true }, take: 1 },
      },
    }),
    // Satisfacción general (encuesta pública /encuesta) — no depende del
    // servicio filtrado, es una encuesta libre no ligada a un reclamo puntual.
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
    // Satisfacción post-cierre de reclamo (Ente vs Prestadora).
    prisma.reclamo.aggregate({
      where: { ...whereFiltro, encuestaEn: { not: null } },
      _avg: { puntajeEnte: true, puntajePrestadora: true },
      _count: { _all: true },
    }),
  ]);

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
      color: SVC_COLOR_HEX[meta.kind],
    };
  }).sort((a, b) => b.total - a.total);

  const estadoMap = new Map(porEstado.map((p) => [p.estado, p._count._all]));
  const estadoBreakdown: { estado: ReclamoEstado; n: number; pct: number }[] = [];
  const ESTADOS: ReclamoEstado[] = [
    "RECIBIDO",
    "EN_REVISION",
    "DERIVADO",
    "EN_PROCESO",
    "RESUELTO",
    "CERRADO_SIN_SOLUCION",
    "RECHAZADO",
  ];
  for (const e of ESTADOS) {
    const n = estadoMap.get(e) ?? 0;
    estadoBreakdown.push({
      estado: e,
      n,
      pct: totalPeriodo === 0 ? 0 : Math.round((n / totalPeriodo) * 100),
    });
  }
  const resueltos = estadoMap.get("RESUELTO") ?? 0;

  let tiempoMedioHoras = 0;
  if (reclamosCerrados.length > 0) {
    const sum = reclamosCerrados.reduce((acc, r) => {
      if (!r.cerradoEn) return acc;
      return acc + (r.cerradoEn.getTime() - r.createdAt.getTime());
    }, 0);
    tiempoMedioHoras = Math.round(sum / reclamosCerrados.length / (1000 * 60 * 60));
  }

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

  // ==== ZONIFICACIÓN, TIPIFICACIÓN, MAPA, TENDENCIA — una sola pasada sobre todosReclamos ====
  const porBarrio = new Map<string, number>();
  const porTitulo = new Map<string, { count: number; svc: ServicioKind }>();
  const barrioPorSvc = new Map<string, Map<ServicioKind, number>>();
  const ultimos6Meses: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    ultimos6Meses.push(mesLabel(d));
  }
  const porMes = new Map<string, number>(ultimos6Meses.map((m) => [m, 0]));
  const porDiaSem: number[] = [0, 0, 0, 0, 0, 0, 0];
  const puntos: PuntoIndicador[] = [];
  let conFoto = 0;
  let conGps = 0;
  let conBarrio = 0;

  for (const r of todosReclamos) {
    const kind = r.servicio.kind;
    const b = (r.barrio ?? "").trim() || "Sin barrio especificado";
    porBarrio.set(b, (porBarrio.get(b) ?? 0) + 1);
    if (b !== "Sin barrio especificado") conBarrio++;

    const t = (r.titulo ?? "").trim();
    if (t) {
      const cur = porTitulo.get(t);
      if (cur) cur.count++;
      else porTitulo.set(t, { count: 1, svc: kind });
    }

    if (b !== "Sin barrio especificado") {
      if (!barrioPorSvc.has(b)) barrioPorSvc.set(b, new Map());
      const sm = barrioPorSvc.get(b)!;
      sm.set(kind, (sm.get(kind) ?? 0) + 1);
    }

    const mes = mesLabel(r.createdAt);
    if (porMes.has(mes)) porMes.set(mes, (porMes.get(mes) ?? 0) + 1);

    porDiaSem[r.createdAt.getDay()]++;

    if (r.adjuntos.length > 0) conFoto++;
    if (r.lat !== null && r.lng !== null) {
      conGps++;
      puntos.push({
        lat: r.lat,
        lng: r.lng,
        estado: r.estado,
        codigo: r.codigo,
        titulo: r.titulo,
        servicio: kind,
      });
    }
  }

  const topBarrios = [...porBarrio.entries()]
    .filter(([nombre]) => nombre !== "Sin barrio especificado")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const topTitulos = [...porTitulo.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  const topBarriosConSvc = topBarrios.slice(0, 5).map(([nombre, count]) => {
    const sm = barrioPorSvc.get(nombre);
    if (!sm) return { nombre, count, top: [] as Array<{ svc: ServicioKind; n: number }> };
    const top = [...sm.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([svc, n]) => ({ svc, n }));
    return { nombre, count, top };
  });

  const totalRec = Math.max(1, todosReclamos.length);
  const pctFoto = Math.round((conFoto / totalRec) * 100);
  const pctGps = Math.round((conGps / totalRec) * 100);
  const pctBarrio = Math.round((conBarrio / totalRec) * 100);

  return {
    desde,
    hasta,
    svcLabel,
    total,
    totalPeriodo,
    distribServicios,
    estadoBreakdown,
    resueltos,
    tiempoMedioHoras,
    cumplimiento,
    topBarrios,
    topTitulos,
    topBarriosConSvc,
    porMes,
    porDiaSem,
    puntos,
    pctFoto,
    pctGps,
    pctBarrio,
    encuesta: {
      count: encuesta._count._all,
      avgAgua: encuesta._avg.puntajeAgua,
      avgEnergia: encuesta._avg.puntajeEnergia,
      avgResiduos: encuesta._avg.puntajeResiduos,
      avgTransporte: encuesta._avg.puntajeTransporte,
    },
    encuestaCierre: {
      count: encuestaCierre._count._all,
      avgEnte: encuestaCierre._avg.puntajeEnte,
      avgPrestadora: encuestaCierre._avg.puntajePrestadora,
    },
  };
}

export type IndicadoresStats = Awaited<ReturnType<typeof getIndicadoresStats>>;

export type EncuestaFila = {
  id: string;
  createdAt: Date;
  barrio: string | null;
  puntajeAgua: number | null;
  puntajeEnergia: number | null;
  puntajeResiduos: number | null;
  puntajeTransporte: number | null;
  responsabilidad: string | null;
  comentario: string | null;
};

// Filas individuales de la encuesta de satisfacción, filtradas por fecha.
// Excluye explícitamente dniHash (identificador del vecino, aunque hasheado).
export async function getEncuestaFilas(
  filtro: Pick<FiltroIndicadores, "desde" | "hasta">,
): Promise<{ desde: Date; hasta: Date; filas: EncuestaFila[] }> {
  const { desde, hasta } = resolverFiltroIndicadores(filtro);
  const filas = await prisma.encuestaServicios.findMany({
    where: { createdAt: { gte: desde, lte: hasta } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      barrio: true,
      puntajeAgua: true,
      puntajeEnergia: true,
      puntajeResiduos: true,
      puntajeTransporte: true,
      responsabilidad: true,
      comentario: true,
    },
  });
  return { desde, hasta, filas };
}
