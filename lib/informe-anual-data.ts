/**
 * Recolección de datos para el Informe Anual de Gestión (art. 5° Ord. 13.189/17).
 * Levanta agregados del período (mensuales publicados + cifras crudas) para
 * alimentar tanto el editor en pantalla como el .docx final.
 */
import { prisma } from "@/lib/prisma";

export type ResumenServicioAnual = {
  servicioId: string;
  nombre: string;
  nombreCorto: string;
  reclamosTotal: number;
  reclamosResueltos: number;
  expedientesAbiertos: number;
  expedientesCerrados: number;
  inspeccionesPublicadas: number;
  documentacionAprobada: number;
  documentacionObservada: number;
  documentacionRechazada: number;
  puntajePromedio: number | null;
  puntajeMuestras: number;
};

export type MesDelPeriodo = {
  mes: number;
  anio: number;
  label: string;
  reclamos: number;
  inspecciones: number;
  encuestaRespuestas: number;
  informeMensualEstado: "BORRADOR" | "PUBLICADO" | "ARCHIVADO" | "SIN_GENERAR";
  informeMensualId: string | null;
};

export type InformeAnualData = {
  periodoDesde: Date;
  periodoHasta: Date;
  porServicio: ResumenServicioAnual[];
  serieTemporal: MesDelPeriodo[];
  totalReclamos: number;
  totalReclamosResueltos: number;
  totalInspecciones: number;
  totalExpedientesAbiertos: number;
  totalExpedientesCerrados: number;
  totalAudienciasRealizadas: number;
  totalEncuestaRespuestas: number;
  encuestaGeneralPromedio: {
    agua: number | null;
    energia: number | null;
    residuos: number | null;
    transporte: number | null;
  };
  mensualesPublicados: {
    id: string;
    mes: number;
    anio: number;
    emitidoEn: Date | null;
  }[];
};

const MESES_ABREV = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

function rangoMesUtc(anio: number, mes: number): { desde: Date; hasta: Date } {
  // Mes calendario ajustado a hora local Argentina (UTC-3)
  const desde = new Date(Date.UTC(anio, mes - 1, 1, 3, 0, 0));
  const hasta = new Date(Date.UTC(anio, mes, 1, 3, 0, 0));
  return { desde, hasta };
}

export async function recolectarDatosAnual(
  periodoDesde: Date,
  periodoHasta: Date,
): Promise<InformeAnualData> {
  const servicios = await prisma.servicio.findMany({
    orderBy: { nombreCorto: "asc" },
  });

  const porServicio: ResumenServicioAnual[] = [];

  for (const s of servicios) {
    const reclamos = await prisma.reclamo.findMany({
      where: {
        servicioId: s.id,
        createdAt: { gte: periodoDesde, lt: periodoHasta },
      },
      select: { estado: true },
    });
    const reclamosResueltos = reclamos.filter(
      (r) => r.estado === "RESUELTO",
    ).length;

    const expedientes = await prisma.expediente.findMany({
      where: { prestadora: { servicios: { some: { id: s.id } } } },
      select: { createdAt: true, cerradoEn: true },
    });
    const expedientesAbiertos = expedientes.filter(
      (e) => e.createdAt >= periodoDesde && e.createdAt < periodoHasta,
    ).length;
    const expedientesCerrados = expedientes.filter(
      (e) =>
        e.cerradoEn !== null &&
        e.cerradoEn >= periodoDesde &&
        e.cerradoEn < periodoHasta,
    ).length;

    const inspeccionesPublicadas = await prisma.inspeccion.count({
      where: {
        servicioId: s.id,
        estado: "PUBLICADA",
        fecha: { gte: periodoDesde, lt: periodoHasta },
      },
    });

    const docs = await prisma.documento.findMany({
      where: {
        prestadora: { servicios: { some: { id: s.id } } },
        revisadoEn: { gte: periodoDesde, lt: periodoHasta },
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

    const encuestaReclamos = await prisma.reclamo.findMany({
      where: {
        servicioId: s.id,
        encuestaEn: { gte: periodoDesde, lt: periodoHasta },
        puntajePrestadora: { not: null },
      },
      select: { puntajePrestadora: true },
    });
    const suma = encuestaReclamos.reduce(
      (acc, r) => acc + (r.puntajePrestadora ?? 0),
      0,
    );
    const puntajeMuestras = encuestaReclamos.length;
    const puntajePromedio =
      puntajeMuestras > 0
        ? Math.round((suma / puntajeMuestras) * 10) / 10
        : null;

    porServicio.push({
      servicioId: s.id,
      nombre: s.nombre,
      nombreCorto: s.nombreCorto,
      reclamosTotal: reclamos.length,
      reclamosResueltos,
      expedientesAbiertos,
      expedientesCerrados,
      inspeccionesPublicadas,
      documentacionAprobada,
      documentacionObservada,
      documentacionRechazada,
      puntajePromedio,
      puntajeMuestras,
    });
  }

  // Serie temporal mes a mes
  const serieTemporal: MesDelPeriodo[] = [];
  // Iteramos los meses del período (desde el mes de periodoDesde hasta el de periodoHasta - 1 día)
  const inicio = new Date(periodoDesde);
  const fin = new Date(periodoHasta.getTime() - 1);
  const cur = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth(), 1));

  while (cur <= fin) {
    const anio = cur.getUTCFullYear();
    const mes = cur.getUTCMonth() + 1;
    const { desde, hasta } = rangoMesUtc(anio, mes);

    const [reclamosCount, inspeccionesCount, encuestasCount, informeMensual] =
      await Promise.all([
        prisma.reclamo.count({
          where: { createdAt: { gte: desde, lt: hasta } },
        }),
        prisma.inspeccion.count({
          where: {
            estado: "PUBLICADA",
            fecha: { gte: desde, lt: hasta },
          },
        }),
        prisma.encuestaServicios.count({
          where: { createdAt: { gte: desde, lt: hasta } },
        }),
        prisma.informeMensual.findUnique({
          where: { anio_mes: { anio, mes } },
          select: { id: true, estado: true },
        }),
      ]);

    serieTemporal.push({
      mes,
      anio,
      label: `${MESES_ABREV[mes - 1]} ${anio}`,
      reclamos: reclamosCount,
      inspecciones: inspeccionesCount,
      encuestaRespuestas: encuestasCount,
      informeMensualEstado: informeMensual?.estado ?? "SIN_GENERAR",
      informeMensualId: informeMensual?.id ?? null,
    });

    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }

  // Totales generales
  const totalReclamos = porServicio.reduce((s, sv) => s + sv.reclamosTotal, 0);
  const totalReclamosResueltos = porServicio.reduce(
    (s, sv) => s + sv.reclamosResueltos,
    0,
  );
  const totalInspecciones = porServicio.reduce(
    (s, sv) => s + sv.inspeccionesPublicadas,
    0,
  );
  const totalExpedientesAbiertos = porServicio.reduce(
    (s, sv) => s + sv.expedientesAbiertos,
    0,
  );
  const totalExpedientesCerrados = porServicio.reduce(
    (s, sv) => s + sv.expedientesCerrados,
    0,
  );

  const totalAudienciasRealizadas = await prisma.audienciaPublica.count({
    where: {
      estado: "REALIZADA",
      realizadaEn: { gte: periodoDesde, lt: periodoHasta },
    },
  });

  const encuestasGen = await prisma.encuestaServicios.findMany({
    where: { createdAt: { gte: periodoDesde, lt: periodoHasta } },
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

  const mensualesPublicados = await prisma.informeMensual.findMany({
    where: {
      estado: "PUBLICADO",
      OR: [
        // El informe corresponde a un mes dentro del período
        {
          AND: [
            { anio: { gte: periodoDesde.getUTCFullYear() } },
            { anio: { lte: periodoHasta.getUTCFullYear() } },
          ],
        },
      ],
    },
    orderBy: [{ anio: "asc" }, { mes: "asc" }],
    select: { id: true, mes: true, anio: true, emitidoEn: true },
  });
  // Filtramos los que efectivamente caigan dentro de [desde, hasta).
  const enPeriodo = mensualesPublicados.filter((im) => {
    const fechaInforme = new Date(Date.UTC(im.anio, im.mes - 1, 1));
    return fechaInforme >= periodoDesde && fechaInforme < periodoHasta;
  });

  return {
    periodoDesde,
    periodoHasta,
    porServicio,
    serieTemporal,
    totalReclamos,
    totalReclamosResueltos,
    totalInspecciones,
    totalExpedientesAbiertos,
    totalExpedientesCerrados,
    totalAudienciasRealizadas,
    totalEncuestaRespuestas: encuestasGen.length,
    encuestaGeneralPromedio: {
      agua: prom((e) => e.puntajeAgua),
      energia: prom((e) => e.puntajeEnergia),
      residuos: prom((e) => e.puntajeResiduos),
      transporte: prom((e) => e.puntajeTransporte),
    },
    mensualesPublicados: enPeriodo,
  };
}
