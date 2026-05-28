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
    m.expedientesActivos.length === 0 &&
    m.inspeccionesPublicadas === 0
  ) {
    return "No existen expedientes en trámite a la fecha de cierre del informe.";
  }

  const partes: string[] = [];

  if (m.reclamosTotal > 0) {
    partes.push(
      `Durante el período se relevaron ${m.reclamosTotal} ${m.reclamosTotal === 1 ? "reclamo" : "reclamos"} de vecinos vinculados al servicio, de los cuales ${m.reclamosAbiertos} permanece${m.reclamosAbiertos === 1 ? "" : "n"} en trámite y ${m.reclamosResueltos} fue${m.reclamosResueltos === 1 ? "" : "ron"} resuelto${m.reclamosResueltos === 1 ? "" : "s"} al cierre del informe.`,
    );
  }

  // Resumen del movimiento de expedientes en el mes
  if (
    m.expedientesEnCursoInicioMes + m.expedientesAbiertosEnMes + m.expedientesCerradosEnMes >
    0
  ) {
    partes.push(
      `Movimiento de expedientes durante el mes: ${m.expedientesEnCursoInicioMes} ${m.expedientesEnCursoInicioMes === 1 ? "expediente en curso" : "expedientes en curso"} al inicio del período, ${m.expedientesAbiertosEnMes} ${m.expedientesAbiertosEnMes === 1 ? "iniciado" : "iniciados"} y ${m.expedientesCerradosEnMes} ${m.expedientesCerradosEnMes === 1 ? "finalizado" : "finalizados"} durante el mes.`,
    );
  }

  if (m.expedientesActivos.length > 0) {
    partes.push("Expedientes vinculados al servicio:");
    for (const e of m.expedientesActivos.slice(0, 15)) {
      partes.push(`• ${e.numero}: ${e.caratula}. ${e.asunto} (${e.estado}).`);
    }
  }

  // Inspecciones publicadas con/sin expediente vinculado
  if (m.inspeccionesPublicadas > 0) {
    partes.push(
      `Se publicaron ${m.inspeccionesPublicadas} ${m.inspeccionesPublicadas === 1 ? "inspección de campo" : "inspecciones de campo"} del Ente vinculadas a este servicio:`,
    );
    for (const i of m.inspeccionesDetalle.slice(0, 20)) {
      const fechaCorta = i.fecha.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
      });
      const ubic = i.barrio ?? i.direccion ?? "sin ubicación cargada";
      const exp = i.expedienteNumero
        ? ` Vinculada al expediente ${i.expedienteNumero}.`
        : " Sin expediente vinculado al cierre del informe.";
      partes.push(`• ${i.codigo} (${fechaCorta}): ${i.titulo} — ${ubic}.${exp}`);
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
  const partes: string[] = [];

  // Corte de la encuesta general del Portal (vecinos califican el servicio
  // de forma directa, no atado a un reclamo). Y de la encuesta al cierre
  // de reclamo (por servicio).
  const eg = data.generales.encuestaGeneralPromedio;
  const cortesEncuestaGeneral: string[] = [];
  if (eg.agua !== null) cortesEncuestaGeneral.push(`agua y saneamiento: ${eg.agua}/5`);
  if (eg.energia !== null) cortesEncuestaGeneral.push(`electricidad: ${eg.energia}/5`);
  if (eg.residuos !== null) cortesEncuestaGeneral.push(`residuos: ${eg.residuos}/5`);
  if (eg.transporte !== null) cortesEncuestaGeneral.push(`transporte: ${eg.transporte}/5`);

  if (cortesEncuestaGeneral.length > 0) {
    partes.push(
      `Indicador de la encuesta general de los usuarios del Portal durante el mes: ${cortesEncuestaGeneral.join("; ")}.`,
    );
  }

  // Por servicio: cifras concretas (reclamos + resolución + encuesta de cierre + documental)
  for (const sv of data.porServicio) {
    if (
      sv.reclamosTotal === 0 &&
      sv.puntajePromedio === null &&
      sv.documentacionAprobada + sv.documentacionObservada + sv.documentacionRechazada === 0
    ) {
      continue;
    }
    const fragmentos: string[] = [];
    if (sv.reclamosTotal > 0) {
      const pctResueltos =
        sv.reclamosTotal > 0
          ? Math.round((sv.reclamosResueltos / sv.reclamosTotal) * 100)
          : 0;
      fragmentos.push(
        `${sv.reclamosTotal} ${sv.reclamosTotal === 1 ? "reclamo" : "reclamos"} en el mes, ${pctResueltos}% resuelto al cierre`,
      );
    }
    if (sv.puntajePromedio !== null) {
      fragmentos.push(
        `puntaje promedio al cierre de reclamo ${sv.puntajePromedio}/5 sobre ${sv.puntajeMuestras} ${sv.puntajeMuestras === 1 ? "respuesta" : "respuestas"}`,
      );
    }
    const totDoc =
      sv.documentacionAprobada + sv.documentacionObservada + sv.documentacionRechazada;
    if (totDoc > 0) {
      fragmentos.push(
        `documental: ${sv.documentacionAprobada} aprobada, ${sv.documentacionObservada} observada/incompleta, ${sv.documentacionRechazada} rechazada`,
      );
    }
    if (fragmentos.length > 0) {
      partes.push(
        `Servicio de ${sv.nombreCorto.toLowerCase()}: ${fragmentos.join("; ")}.`,
      );
    }
  }

  // Cierre interpretativo, dejando margen para la abstención formal o la
  // valoración fundada según juicio del Directorio.
  partes.push(
    "Los indicadores arriba expuestos surgen de los reclamos efectivamente ingresados por los usuarios al Portal, de las respuestas a la encuesta de satisfacción que reciben al cierre del reclamo y de la encuesta general pública del sitio, todos correspondientes exclusivamente al mes informado.",
  );

  partes.push(
    "[Completar manualmente: si los indicadores justifican una evaluación fundada, redactarla acá citando los principios afectados (CONTINUIDAD, REGULARIDAD, UNIFORMIDAD, IGUALDAD, ACCESIBILIDAD, MANTENIMIENTO). Si la base comparativa todavía es insuficiente, mantener la fórmula: 'En consecuencia, este Directorio se ABSTIENE de emitir una evaluación de conducta sobre los concesionarios y prestadores de los servicios públicos sujetos a control.']",
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
