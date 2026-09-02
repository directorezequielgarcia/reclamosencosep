/**
 * Resolución compartida de filtros para el Reporte de reclamos por tema y
 * problemática (pantalla, Word y Excel usan la misma lógica para no
 * desincronizarse): período (hoy/semana/mes o rango personalizado de la
 * Bandeja) + filtro opcional por servicio.
 */
import type { Prisma } from "@prisma/client";
import { inicioDiaLocal, finDiaLocal } from "@/lib/horario";
import { SVC_META, type SvcKey } from "@/lib/servicios";

export type PeriodoReporte = "hoy" | "semana" | "mes";

export type ReporteSP = {
  periodo?: string;
  svc?: string;
  desde?: string;
  hasta?: string;
};

export type RangoReporte = {
  desde: Date;
  hasta: Date;
  periodo: PeriodoReporte;
  esRangoPersonalizado: boolean;
};

export function resolverRangoReporte(sp: ReporteSP): RangoReporte {
  const esRangoPersonalizado = Boolean(sp.desde || sp.hasta);
  const periodo: PeriodoReporte =
    sp.periodo === "semana" ? "semana" : sp.periodo === "mes" ? "mes" : "hoy";

  if (esRangoPersonalizado) {
    return {
      desde: new Date(`${sp.desde ?? sp.hasta}T00:00:00`),
      hasta: new Date(`${sp.hasta ?? sp.desde}T23:59:59`),
      periodo,
      esRangoPersonalizado: true,
    };
  }
  if (periodo === "semana") {
    return { desde: inicioDiaLocal(6), hasta: finDiaLocal(0), periodo, esRangoPersonalizado: false };
  }
  if (periodo === "mes") {
    return { desde: inicioDiaLocal(29), hasta: finDiaLocal(0), periodo, esRangoPersonalizado: false };
  }
  return { desde: inicioDiaLocal(0), hasta: finDiaLocal(0), periodo, esRangoPersonalizado: false };
}

/** Texto legible del período mostrado (pantalla, Word y Excel comparten la
 *  misma redacción). `desdeFmt`/`hastaFmt` son las fechas ya formateadas
 *  dd/mm/aaaa que devuelve `reporteDiarioPorTema`. */
export function construirSubtitulo(
  rango: RangoReporte,
  desdeFmt: string,
  hastaFmt: string,
): string {
  if (rango.esRangoPersonalizado) {
    return desdeFmt === hastaFmt
      ? `Reclamos del ${desdeFmt}`
      : `Reclamos del ${desdeFmt} al ${hastaFmt}`;
  }
  if (rango.periodo === "semana") {
    return `Reclamos de la última semana, del ${desdeFmt} al ${hastaFmt}`;
  }
  if (rango.periodo === "mes") {
    return `Reclamos del último mes, del ${desdeFmt} al ${hastaFmt}`;
  }
  return `Reclamos de hoy, ${hastaFmt}`;
}

export function mergeWhereServicio(
  where: Prisma.ReclamoWhereInput,
  svc: string | undefined,
): Prisma.ReclamoWhereInput {
  if (svc && svc in SVC_META) {
    return { ...where, servicio: { kind: SVC_META[svc as SvcKey].kind } };
  }
  return where;
}
