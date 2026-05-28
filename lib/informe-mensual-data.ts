/**
 * Recolección de datos para el Informe Mensual del Estado de los Servicios
 * Públicos (art. 5° inc. k Ord. 13.189/17).
 *
 * Esta función agrega lo que ocurrió en el mes desde todas las fuentes del
 * sistema (reclamos, expedientes, inspecciones publicadas, documentación
 * revisada por Adriana, encuestas, audiencias) y arma un objeto plano que
 * después alimenta tanto el editor en pantalla como el .docx final.
 */
import { prisma } from "@/lib/prisma";
import type { ServicioKind } from "@prisma/client";

export type MetricasServicio = {
  servicioId: string;
  kind: ServicioKind;
  nombre: string;
  nombreCorto: string;

  // Reclamos del mes (creados o actualizados)
  reclamosTotal: number;
  reclamosAbiertos: number;
  reclamosResueltos: number;
  reclamosPorBarrio: { barrio: string; total: number }[];

  // Expedientes
  expedientesEnCursoInicioMes: number;
  expedientesAbiertosEnMes: number;
  expedientesCerradosEnMes: number;
  expedientesActivos: {
    numero: string;
    caratula: string;
    asunto: string;
    estado: string;
  }[];

  // Inspecciones publicadas del mes
  inspeccionesPublicadas: number;
  inspeccionesPorTipo: Record<string, number>;
  inspeccionesPorBarrio: { barrio: string; total: number }[];

  // Documentación revisada por Adriana
  documentacionAprobada: number;
  documentacionObservada: number;
  documentacionRechazada: number;

  // Encuesta de satisfacción para este servicio (vecinos al cerrar reclamo)
  puntajePromedio: number | null;
  puntajeMuestras: number;
};

export type MetricasGenerales = {
  audienciasRealizadas: number;
  audienciasProgramadas: number;
  totalReclamosMes: number;
  totalInspeccionesMes: number;
  totalExpedientesMovidos: number;
  encuestaGeneralPromedio: {
    agua: number | null;
    energia: number | null;
    residuos: number | null;
    transporte: number | null;
  };
};

export type InformeMensualData = {
  mes: number;
  anio: number;
  desde: Date;
  hasta: Date;
  porServicio: MetricasServicio[];
  generales: MetricasGenerales;
};

/** Rango UTC ajustado a hora local Argentina (UTC-3). */
function rangoMes(anio: number, mes: number): { desde: Date; hasta: Date } {
  const desde = new Date(Date.UTC(anio, mes - 1, 1, 3, 0, 0));
  const hasta = new Date(Date.UTC(anio, mes, 1, 3, 0, 0));
  return { desde, hasta };
}

export async function recolectarDatosMes(
  anio: number,
  mes: number,
): Promise<InformeMensualData> {
  const { desde, hasta } = rangoMes(anio, mes);

  const servicios = await prisma.servicio.findMany({
    orderBy: { nombreCorto: "asc" },
  });

  const porServicio: MetricasServicio[] = [];

  for (const s of servicios) {
    // Reclamos creados en el mes para ese servicio
    const reclamosMes = await prisma.reclamo.findMany({
      where: {
        servicioId: s.id,
        createdAt: { gte: desde, lt: hasta },
      },
      select: { id: true, estado: true, barrio: true },
    });

    const reclamosAbiertos = reclamosMes.filter((r) =>
      ["RECIBIDO", "EN_REVISION", "DERIVADO", "EN_PROCESO"].includes(r.estado),
    ).length;
    const reclamosResueltos = reclamosMes.filter(
      (r) => r.estado === "RESUELTO",
    ).length;

    const barrioMap = new Map<string, number>();
    for (const r of reclamosMes) {
      const k = (r.barrio ?? "").trim();
      if (!k) continue;
      barrioMap.set(k, (barrioMap.get(k) ?? 0) + 1);
    }
    const reclamosPorBarrio = Array.from(barrioMap.entries())
      .map(([barrio, total]) => ({ barrio, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Expedientes (vía prestadora del servicio)
    const expedientes = await prisma.expediente.findMany({
      where: { prestadora: { servicios: { some: { id: s.id } } } },
      select: {
        numero: true,
        caratula: true,
        asunto: true,
        estado: true,
        createdAt: true,
        cerradoEn: true,
      },
    });

    const expedientesEnCursoInicioMes = expedientes.filter(
      (e) =>
        e.createdAt < desde &&
        (e.cerradoEn === null || e.cerradoEn >= desde),
    ).length;
    const expedientesAbiertosEnMes = expedientes.filter(
      (e) => e.createdAt >= desde && e.createdAt < hasta,
    ).length;
    const expedientesCerradosEnMes = expedientes.filter(
      (e) => e.cerradoEn !== null && e.cerradoEn >= desde && e.cerradoEn < hasta,
    ).length;

    const expedientesActivos = expedientes
      .filter(
        (e) =>
          e.estado === "ABIERTO" ||
          e.estado === "EN_TRAMITE" ||
          (e.cerradoEn !== null && e.cerradoEn >= desde),
      )
      .slice(0, 30)
      .map((e) => ({
        numero: e.numero,
        caratula: e.caratula,
        asunto: e.asunto,
        estado: e.estado,
      }));

    // Inspecciones publicadas del mes
    const inspeccionesMes = await prisma.inspeccion.findMany({
      where: {
        servicioId: s.id,
        estado: "PUBLICADA",
        fecha: { gte: desde, lt: hasta },
      },
      select: { tipo: true, barrio: true, direccion: true },
    });

    const tipoCount: Record<string, number> = {};
    for (const i of inspeccionesMes) {
      tipoCount[i.tipo] = (tipoCount[i.tipo] ?? 0) + 1;
    }
    const inspBarrioMap = new Map<string, number>();
    for (const i of inspeccionesMes) {
      const k = (i.barrio ?? i.direccion ?? "").trim();
      if (!k) continue;
      inspBarrioMap.set(k, (inspBarrioMap.get(k) ?? 0) + 1);
    }
    const inspeccionesPorBarrio = Array.from(inspBarrioMap.entries())
      .map(([barrio, total]) => ({ barrio, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Documentación revisada en el mes vinculada a alguna prestadora del servicio
    const docs = await prisma.documento.findMany({
      where: {
        prestadora: { servicios: { some: { id: s.id } } },
        revisadoEn: { gte: desde, lt: hasta },
      },
      select: { estado: true },
    });
    const documentacionAprobada = docs.filter((d) => d.estado === "APROBADO").length;
    const documentacionObservada = docs.filter(
      (d) => d.estado === "OBSERVADO" || d.estado === "INCOMPLETO",
    ).length;
    const documentacionRechazada = docs.filter(
      (d) => d.estado === "RECHAZADO",
    ).length;

    // Encuesta al cerrar reclamo (puntaje al Ente y a la prestadora promediados)
    const encuestaReclamos = await prisma.reclamo.findMany({
      where: {
        servicioId: s.id,
        encuestaEn: { gte: desde, lt: hasta },
        puntajePrestadora: { not: null },
      },
      select: { puntajePrestadora: true },
    });
    const sumaPuntajes = encuestaReclamos.reduce(
      (acc, r) => acc + (r.puntajePrestadora ?? 0),
      0,
    );
    const puntajeMuestras = encuestaReclamos.length;
    const puntajePromedio =
      puntajeMuestras > 0
        ? Math.round((sumaPuntajes / puntajeMuestras) * 10) / 10
        : null;

    porServicio.push({
      servicioId: s.id,
      kind: s.kind,
      nombre: s.nombre,
      nombreCorto: s.nombreCorto,
      reclamosTotal: reclamosMes.length,
      reclamosAbiertos,
      reclamosResueltos,
      reclamosPorBarrio,
      expedientesEnCursoInicioMes,
      expedientesAbiertosEnMes,
      expedientesCerradosEnMes,
      expedientesActivos,
      inspeccionesPublicadas: inspeccionesMes.length,
      inspeccionesPorTipo: tipoCount,
      inspeccionesPorBarrio,
      documentacionAprobada,
      documentacionObservada,
      documentacionRechazada,
      puntajePromedio,
      puntajeMuestras,
    });
  }

  // Cifras generales
  const audienciasRealizadas = await prisma.audienciaPublica.count({
    where: { realizadaEn: { gte: desde, lt: hasta }, estado: "REALIZADA" },
  });
  const audienciasProgramadas = await prisma.audienciaPublica.count({
    where: { fecha: { gte: desde, lt: hasta } },
  });
  const totalReclamosMes = porServicio.reduce(
    (s, sv) => s + sv.reclamosTotal,
    0,
  );
  const totalInspeccionesMes = porServicio.reduce(
    (s, sv) => s + sv.inspeccionesPublicadas,
    0,
  );
  const totalExpedientesMovidos = porServicio.reduce(
    (s, sv) => s + sv.expedientesAbiertosEnMes + sv.expedientesCerradosEnMes,
    0,
  );

  const encuestasGen = await prisma.encuestaServicios.findMany({
    where: { createdAt: { gte: desde, lt: hasta } },
    select: {
      puntajeAgua: true,
      puntajeEnergia: true,
      puntajeResiduos: true,
      puntajeTransporte: true,
    },
  });
  function prom(getter: (e: (typeof encuestasGen)[number]) => number | null) {
    const vals = encuestasGen
      .map(getter)
      .filter((n): n is number => n !== null);
    if (vals.length === 0) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  }

  return {
    mes,
    anio,
    desde,
    hasta,
    porServicio,
    generales: {
      audienciasRealizadas,
      audienciasProgramadas,
      totalReclamosMes,
      totalInspeccionesMes,
      totalExpedientesMovidos,
      encuestaGeneralPromedio: {
        agua: prom((e) => e.puntajeAgua),
        energia: prom((e) => e.puntajeEnergia),
        residuos: prom((e) => e.puntajeResiduos),
        transporte: prom((e) => e.puntajeTransporte),
      },
    },
  };
}
