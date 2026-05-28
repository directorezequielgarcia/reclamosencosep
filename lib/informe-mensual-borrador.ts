/**
 * Generador de borradores automáticos para las 7 secciones del Informe
 * Mensual del art. 5° inc. k. Toma los datos agregados y arma prosa
 * jurídico-administrativa básica que después el Directorio edita.
 *
 * El objetivo es que el director NO empiece desde una hoja en blanco — el
 * borrador da cifras concretas y oraciones armadas que se ajustan a mano.
 */
import type { InformeMensualData, MetricasServicio } from "@/lib/informe-mensual-data";

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export type BloquesInforme = {
  seccion1: { intro: string; porServicio: Record<string, string> };
  seccion2: { porServicio: Record<string, string> };
  seccion3: { porServicio: Record<string, string> };
  seccion4: string;
  seccion5: string;
  seccion6: string;
  seccion7: string;
};

function seccion1Servicio(mes: string, anio: number, m: MetricasServicio): string {
  const partes: string[] = [];
  if (m.reclamosTotal === 0 && m.inspeccionesPublicadas === 0) {
    partes.push(
      `Durante el mes de ${mes} de ${anio}, el servicio de ${m.nombreCorto.toLowerCase()} no registró nuevos reclamos formales por parte de los usuarios ni inspecciones de campo publicadas por este Ente.`,
    );
  } else {
    const fr1 = `Durante el mes de ${mes} de ${anio}, el servicio de ${m.nombreCorto.toLowerCase()} registró ${m.reclamosTotal} ${m.reclamosTotal === 1 ? "reclamo" : "reclamos"} de usuarios`;
    const fr2 =
      m.inspeccionesPublicadas > 0
        ? ` y ${m.inspeccionesPublicadas} ${m.inspeccionesPublicadas === 1 ? "inspección publicada" : "inspecciones publicadas"} por este Ente`
        : "";
    partes.push(`${fr1}${fr2}.`);
  }

  if (m.expedientesEnCursoInicioMes + m.expedientesAbiertosEnMes > 0) {
    partes.push(
      `Se registraron ${m.expedientesEnCursoInicioMes} ${m.expedientesEnCursoInicioMes === 1 ? "expediente en curso" : "expedientes en curso"} al inicio del período, abriéndose ${m.expedientesAbiertosEnMes} ${m.expedientesAbiertosEnMes === 1 ? "nuevo" : "nuevos"} y cerrándose ${m.expedientesCerradosEnMes} en el transcurso del mes.`,
    );
  }

  if (m.reclamosPorBarrio.length > 0) {
    const top = m.reclamosPorBarrio
      .slice(0, 3)
      .map((b) => `${b.barrio} (${b.total})`)
      .join(", ");
    partes.push(
      `Los reclamos se concentraron principalmente en los siguientes barrios: ${top}.`,
    );
  }

  if (m.puntajePromedio !== null) {
    partes.push(
      `La evaluación de los usuarios sobre la prestación arrojó un puntaje promedio de ${m.puntajePromedio} sobre 5 puntos (${m.puntajeMuestras} ${m.puntajeMuestras === 1 ? "respuesta" : "respuestas"}).`,
    );
  }

  partes.push(
    `En términos generales, los principios del servicio público (generalidad, regularidad, continuidad, habitualidad, uniformidad, igualdad, accesibilidad y mantenimiento) se evalúan en función de los hechos relevados durante el período.`,
  );

  return partes.join("\n\n");
}

function seccion2Servicio(m: MetricasServicio): string {
  if (
    m.reclamosTotal === 0 &&
    m.expedientesAbiertosEnMes === 0 &&
    m.expedientesActivos.length === 0
  ) {
    return "No existen expedientes en trámite a la fecha de cierre del informe.";
  }

  const partes: string[] = [];

  if (m.reclamosTotal > 0) {
    partes.push(
      `Durante el período se relevaron ${m.reclamosTotal} ${m.reclamosTotal === 1 ? "reclamo" : "reclamos"} de vecinos vinculados al servicio, de los cuales ${m.reclamosAbiertos} permanece${m.reclamosAbiertos === 1 ? "" : "n"} en trámite y ${m.reclamosResueltos} fue${m.reclamosResueltos === 1 ? "" : "ron"} resuelto${m.reclamosResueltos === 1 ? "" : "s"} al cierre del informe.`,
    );
  }

  if (m.expedientesActivos.length > 0) {
    partes.push("Expedientes vinculados al servicio:");
    for (const e of m.expedientesActivos.slice(0, 10)) {
      partes.push(`• ${e.numero}: ${e.caratula}. ${e.asunto} (${e.estado}).`);
    }
  }

  return partes.join("\n\n");
}

function seccion3Servicio(m: MetricasServicio): string {
  const partes: string[] = [];

  if (m.inspeccionesPublicadas === 0 && m.reclamosPorBarrio.length === 0) {
    return "No se registraron alteraciones relevantes con impacto geográfico identificable en el servicio durante el período informado.";
  }

  if (m.inspeccionesPublicadas > 0) {
    partes.push(
      `Se publicaron ${m.inspeccionesPublicadas} ${m.inspeccionesPublicadas === 1 ? "inspección de campo" : "inspecciones de campo"} vinculadas al servicio en el período. ${describirInspeccionesPorTipo(m.inspeccionesPorTipo)}`,
    );
  }

  if (m.inspeccionesPorBarrio.length > 0) {
    const top = m.inspeccionesPorBarrio
      .slice(0, 5)
      .map((b) => `${b.barrio} (${b.total})`)
      .join(", ");
    partes.push(`Zonas con mayor actividad de inspección: ${top}.`);
  }

  if (m.reclamosPorBarrio.length > 0) {
    const top = m.reclamosPorBarrio
      .slice(0, 5)
      .map((b) => `${b.barrio} (${b.total} reclamos)`)
      .join(", ");
    partes.push(
      `Alteraciones derivadas de los reclamos recibidos se concentraron en: ${top}.`,
    );
  }

  partes.push(
    `[Completar manualmente: indicar qué principios del servicio se vieron afectados en MAYÚSCULAS (CONTINUIDAD, REGULARIDAD, UNIFORMIDAD, etc.) y agregar las fuentes externas relevantes — comunicados de la prestadora, denuncias, intervenciones de TRANSPA, etc.]`,
  );

  return partes.join("\n\n");
}

function describirInspeccionesPorTipo(porTipo: Record<string, number>): string {
  const labels: Record<string, string> = {
    OFICIO: "de oficio",
    DENUNCIA_VECINO: "originadas en denuncias de vecinos",
    SEGUIMIENTO_EXPEDIENTE: "de seguimiento de expedientes",
    EVENTO_PUNTUAL: "vinculadas a eventos puntuales",
  };
  const partes = Object.entries(porTipo)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} ${labels[k] ?? k}`);
  if (partes.length === 0) return "";
  return `Se distribuyeron en: ${partes.join(", ")}.`;
}

function seccion4(mes: string, anio: number, data: InformeMensualData): string {
  const recurrentes: string[] = [];
  for (const sv of data.porServicio) {
    if (sv.reclamosPorBarrio.length > 0 && sv.reclamosPorBarrio[0].total >= 3) {
      recurrentes.push(
        `En el servicio de ${sv.nombreCorto.toLowerCase()}, el barrio ${sv.reclamosPorBarrio[0].barrio} concentró ${sv.reclamosPorBarrio[0].total} reclamos, lo que sugiere una problemática recurrente que amerita análisis estructural.`,
      );
    }
  }

  if (recurrentes.length === 0) {
    return "Remítase a los eventos, expedientes y observaciones mencionados en los puntos 2 y 3, donde constan los hechos relevados, las actuaciones administrativas iniciadas y la documentación aportada por los prestadores.\n\nDurante el mes de " +
      mes +
      " de " +
      anio +
      " no se identificaron patrones de recurrencia significativos que ameriten consideración separada.";
  }

  return [
    "Remítase a los eventos, expedientes y observaciones mencionados en los puntos 2 y 3.",
    "Hechos recurrentes identificados durante el período:",
    ...recurrentes,
    "[Completar manualmente: análisis de causas estructurales identificadas y posibles medidas correctivas.]",
  ].join("\n\n");
}

function seccion5(data: InformeMensualData): string {
  const partes: string[] = [];
  const docRevisados = data.porServicio.reduce(
    (s, sv) =>
      s + sv.documentacionAprobada + sv.documentacionObservada + sv.documentacionRechazada,
    0,
  );

  if (docRevisados === 0) {
    partes.push(
      "Durante el período informado no se registraron presentaciones documentales de las prestadoras que hayan sido revisadas por este Ente.",
    );
  } else {
    partes.push(
      `Durante el período informado este Ente revisó ${docRevisados} ${docRevisados === 1 ? "presentación documental" : "presentaciones documentales"} provenientes de los concesionarios.`,
    );
    for (const sv of data.porServicio) {
      const total =
        sv.documentacionAprobada + sv.documentacionObservada + sv.documentacionRechazada;
      if (total === 0) continue;
      partes.push(
        `Para el servicio de ${sv.nombreCorto.toLowerCase()}: ${sv.documentacionAprobada} aprobadas, ${sv.documentacionObservada} con observaciones o incompletas, ${sv.documentacionRechazada} rechazadas.`,
      );
    }
  }

  partes.push(
    "[Completar manualmente: detalle de las comunicaciones específicas cursadas con cada prestadora, pedidos de informe enviados, respuestas recibidas, plazos otorgados y cumplimiento de las medidas indicadas por el Directorio.]",
  );

  return partes.join("\n\n");
}

function seccion6(data: InformeMensualData): string {
  // Evaluación inicial — recomendamos abstención si todavía no hay base
  // comparativa suficiente (modelo del primer informe de diciembre 2025).
  const partes: string[] = [];

  const puntajes = data.porServicio
    .filter((sv) => sv.puntajePromedio !== null)
    .map((sv) => `${sv.nombreCorto.toLowerCase()}: ${sv.puntajePromedio}/5`);

  if (puntajes.length > 0) {
    partes.push(
      `Indicadores de satisfacción de usuarios al cierre de reclamos: ${puntajes.join("; ")}.`,
    );
  }

  partes.push(
    "Que, sin perjuicio de los datos relevados durante el período, este Directorio considera prudente continuar consolidando la base comparativa antes de emitir una valoración integral y fundada sobre la conducta de los concesionarios.",
  );

  partes.push(
    "[Completar manualmente: si corresponde emitir evaluación, redactarla acá citando los principios afectados y comparando con períodos anteriores. Si todavía no hay base suficiente, mantener la fórmula de abstención: 'En consecuencia, este Directorio se ABSTIENE de emitir una evaluación de conducta sobre los concesionarios y prestadores de los servicios públicos sujetos a control.']",
  );

  return partes.join("\n\n");
}

function seccion7(data: InformeMensualData): string {
  const partes: string[] = [];
  const totalExp = data.generales.totalExpedientesMovidos;
  const totalInsp = data.generales.totalInspeccionesMes;

  partes.push(
    `Durante el período se movieron ${totalExp} ${totalExp === 1 ? "expediente administrativo" : "expedientes administrativos"} (apertura, trámite o cierre) y se publicaron ${totalInsp} ${totalInsp === 1 ? "inspección de campo" : "inspecciones de campo"} con sus respectivas actas, fotografías y observaciones técnicas.`,
  );

  if (data.generales.audienciasRealizadas > 0) {
    partes.push(
      `Se realizaron ${data.generales.audienciasRealizadas} ${data.generales.audienciasRealizadas === 1 ? "audiencia pública" : "audiencias públicas"} en el período.`,
    );
  }

  partes.push(
    "Los registros documentales, las actas de inspección, los expedientes y la documentación de respaldo se encuentran disponibles en el Portal del ENCOSEP y a disposición de quien quiera consultarlos.",
  );

  partes.push(
    "Para los casos de irregularidad y estado puntual de cada uno de los expedientes, remítase a las actuaciones correspondientes en el archivo del Ente.",
  );

  return partes.join("\n\n");
}

/** Punto de entrada: arma todos los bloques sugeridos a partir de los datos. */
export function generarBorradorInforme(data: InformeMensualData): BloquesInforme {
  const mes = MESES[data.mes - 1];
  const anio = data.anio;

  const intro = `INFORME MENSUAL DEL ESTADO DE LOS SERVICIOS PÚBLICOS — ${mes.toUpperCase()} ${anio}`;

  const sec1PorServicio: Record<string, string> = {};
  const sec2PorServicio: Record<string, string> = {};
  const sec3PorServicio: Record<string, string> = {};

  for (const sv of data.porServicio) {
    sec1PorServicio[sv.kind] = seccion1Servicio(mes, anio, sv);
    sec2PorServicio[sv.kind] = seccion2Servicio(sv);
    sec3PorServicio[sv.kind] = seccion3Servicio(sv);
  }

  return {
    seccion1: { intro, porServicio: sec1PorServicio },
    seccion2: { porServicio: sec2PorServicio },
    seccion3: { porServicio: sec3PorServicio },
    seccion4: seccion4(mes, anio, data),
    seccion5: seccion5(data),
    seccion6: seccion6(data),
    seccion7: seccion7(data),
  };
}
