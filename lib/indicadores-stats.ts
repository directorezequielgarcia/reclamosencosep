import { prisma } from "@/lib/prisma";
import { SVC_META, SVC_ORDER } from "@/lib/servicios";
import type { Prisma, ReclamoEstado, ServicioKind } from "@prisma/client";

export type FiltroIndicadores = {
  desde?: string;
  hasta?: string;
  svc?: string;
};

// Único lugar donde se resuelven los filtros de fecha/servicio de /indicadores
// (página, export a Word y vista de impresión usan exactamente los mismos números).
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

export async function getIndicadoresStats(sp: FiltroIndicadores) {
  const { desde, hasta, svcLabel, whereFiltro } = resolverFiltroIndicadores(sp);

  const [
    total,
    totalPeriodo,
    porEstado,
    porServicio,
    porPrestadora,
    reclamosCerrados,
    todosReclamos,
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
        barrio: true,
        lat: true,
        lng: true,
        servicio: { select: { kind: true } },
        adjuntos: { select: { id: true }, take: 1 },
      },
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
    return { key: k, label: meta.short, total: n, pct: Math.round((n / totalPeriodoNonZero) * 100) };
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

  const porBarrio = new Map<string, number>();
  let conFoto = 0;
  let conGps = 0;
  let conBarrio = 0;
  for (const r of todosReclamos) {
    const b = (r.barrio ?? "").trim() || "Sin barrio especificado";
    porBarrio.set(b, (porBarrio.get(b) ?? 0) + 1);
    if (b !== "Sin barrio especificado") conBarrio++;
    if (r.adjuntos.length > 0) conFoto++;
    if (r.lat !== null && r.lng !== null) conGps++;
  }
  const topBarrios = [...porBarrio.entries()]
    .filter(([nombre]) => nombre !== "Sin barrio especificado")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

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
    pctFoto,
    pctGps,
    pctBarrio,
  };
}

export type IndicadoresStats = Awaited<ReturnType<typeof getIndicadoresStats>>;
