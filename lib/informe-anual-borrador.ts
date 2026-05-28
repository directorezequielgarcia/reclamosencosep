/**
 * Generador de borrador para el Informe Anual de Gestión.
 * 4 bloques narrativos: balance, logros, desafíos y sugerencias.
 * El balance se completa con cifras concretas del período; los otros tres
 * dejan marcadores [Completar manualmente] porque dependen del juicio del
 * Directorio.
 */
import type { InformeAnualData } from "@/lib/informe-anual-data";

export type BloquesInformeAnual = {
  balance: string;
  logros: string;
  desafios: string;
  sugerencias: string;
};

function fechaCorta(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function generarBalance(d: InformeAnualData): string {
  const partes: string[] = [];
  const pctResueltos =
    d.totalReclamos > 0
      ? Math.round((d.totalReclamosResueltos / d.totalReclamos) * 100)
      : 0;

  partes.push(
    `Durante el período comprendido entre el ${fechaCorta(d.periodoDesde)} y el ${fechaCorta(new Date(d.periodoHasta.getTime() - 24 * 3600 * 1000))}, el Ente de Control de los Servicios Públicos ejerció su competencia conforme a la Ordenanza N° 13.189/17, registrando la siguiente actividad:`,
  );

  partes.push(
    `• ${d.totalReclamos} ${d.totalReclamos === 1 ? "reclamo recibido" : "reclamos recibidos"} de la ciudadanía, con un ${pctResueltos}% de resolución al cierre del ejercicio.`,
  );
  partes.push(
    `• ${d.totalInspecciones} ${d.totalInspecciones === 1 ? "inspección de campo publicada" : "inspecciones de campo publicadas"} sobre los servicios bajo control.`,
  );
  partes.push(
    `• ${d.totalExpedientesAbiertos} ${d.totalExpedientesAbiertos === 1 ? "expediente administrativo abierto" : "expedientes administrativos abiertos"} y ${d.totalExpedientesCerrados} ${d.totalExpedientesCerrados === 1 ? "cerrado" : "cerrados"} en el período.`,
  );
  partes.push(
    `• ${d.totalAudienciasRealizadas} ${d.totalAudienciasRealizadas === 1 ? "audiencia pública realizada" : "audiencias públicas realizadas"}.`,
  );
  partes.push(
    `• ${d.totalEncuestaRespuestas} ${d.totalEncuestaRespuestas === 1 ? "respuesta" : "respuestas"} a la encuesta general de los usuarios del Portal.`,
  );

  partes.push("Desempeño por servicio (período completo):");
  for (const sv of d.porServicio) {
    const pctR =
      sv.reclamosTotal > 0
        ? Math.round((sv.reclamosResueltos / sv.reclamosTotal) * 100)
        : 0;
    const fragmentos = [
      `${sv.reclamosTotal} reclamo${sv.reclamosTotal === 1 ? "" : "s"} (${pctR}% resuelto)`,
      `${sv.inspeccionesPublicadas} inspección${sv.inspeccionesPublicadas === 1 ? "" : "es"}`,
      `${sv.expedientesAbiertos} expediente${sv.expedientesAbiertos === 1 ? "" : "s"} abierto${sv.expedientesAbiertos === 1 ? "" : "s"}`,
      `${sv.expedientesCerrados} cerrado${sv.expedientesCerrados === 1 ? "" : "s"}`,
    ];
    if (sv.puntajePromedio !== null) {
      fragmentos.push(
        `satisfacción al cierre ${sv.puntajePromedio}/5 (${sv.puntajeMuestras} ${sv.puntajeMuestras === 1 ? "muestra" : "muestras"})`,
      );
    }
    partes.push(
      `• Servicio de ${sv.nombreCorto.toLowerCase()}: ${fragmentos.join("; ")}.`,
    );
  }

  const eg = d.encuestaGeneralPromedio;
  const cortes: string[] = [];
  if (eg.agua !== null) cortes.push(`agua ${eg.agua}/5`);
  if (eg.energia !== null) cortes.push(`electricidad ${eg.energia}/5`);
  if (eg.residuos !== null) cortes.push(`residuos ${eg.residuos}/5`);
  if (eg.transporte !== null) cortes.push(`transporte ${eg.transporte}/5`);
  if (cortes.length > 0) {
    partes.push(
      `Encuesta general de los vecinos del Portal (promedios del período): ${cortes.join(", ")}.`,
    );
  }

  if (d.mensualesPublicados.length > 0) {
    partes.push(
      `En el período se publicaron ${d.mensualesPublicados.length} ${d.mensualesPublicados.length === 1 ? "informe mensual técnico" : "informes mensuales técnicos"} (art. 5° inc. k) que se anexan a este informe anual.`,
    );
  }

  return partes.join("\n\n");
}

export function generarBorradorAnual(
  d: InformeAnualData,
): BloquesInformeAnual {
  return {
    balance: generarBalance(d),
    logros:
      "[Completar manualmente: enumerar los principales logros de la gestión durante el período. Sugerencias: puesta en marcha del Portal de Reclamos; ampliación de la base normativa; mejoras en los tiempos de respuesta; convenios firmados; etc.]",
    desafios:
      "[Completar manualmente: identificar los desafíos estructurales que persisten (infraestructura de acueductos, recolección de RSU en zonas críticas, paralización del proceso licitatorio del transporte, etc.) y las dificultades operativas internas del Ente.]",
    sugerencias:
      "[Completar manualmente: recomendaciones formales del ENCOSEP al Concejo Deliberante y al Poder Ejecutivo Municipal para mejorar la prestación de los servicios públicos sujetos a control, conforme el art. 5° de la Ordenanza N° 13.189/17.]",
  };
}
