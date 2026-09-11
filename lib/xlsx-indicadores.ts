/**
 * Export a Excel de los Indicadores (.xlsx) — mismos datos que se ven en
 * /indicadores y /consulta/indicadores, en formato tabular para trabajar
 * con ellos (filtrar, ordenar, cruzar) fuera del panel.
 */
import ExcelJS from "exceljs";
import { ESTADO_META } from "@/lib/admin";
import { SVC_META, svcFromKind } from "@/lib/servicios";
import type { IndicadoresStats } from "@/lib/indicadores-stats";

const TZ = "America/Argentina/Buenos_Aires";
const fmtFecha = (d: Date) =>
  d.toLocaleDateString("es-AR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });

function agregarDataBar(ws: ExcelJS.Worksheet, ref: string, argb: string) {
  const rule = {
    type: "dataBar",
    cfvo: [{ type: "min" }, { type: "max" }],
    color: { argb },
  } as unknown as ExcelJS.DataBarRuleType;
  ws.addConditionalFormatting({ ref, rules: [rule] });
}

function tituloHoja(ws: ExcelJS.Worksheet, titulo: string, subtitulo: string) {
  ws.addRow([titulo]).font = { bold: true, size: 13 };
  ws.addRow([subtitulo]).font = { italic: true, size: 10, color: { argb: "FF666666" } };
  ws.addRow([]);
}

export async function generarXlsxIndicadores(stats: IndicadoresStats): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ENCOSEP — Panel de indicadores";
  wb.created = new Date();

  const subtitulo =
    `Período: ${fmtFecha(stats.desde)} al ${fmtFecha(stats.hasta)}` +
    (stats.svcLabel ? ` — Servicio: ${stats.svcLabel}` : "");

  // ───────────────────────────── Resumen ─────────────────────────────
  const resumen = wb.addWorksheet("Resumen");
  tituloHoja(resumen, "ENCOSEP — Indicadores de gestión", subtitulo);

  resumen.addRow(["Total histórico de reclamos", stats.total]);
  resumen.addRow(["Reclamos en el período", stats.totalPeriodo]);
  resumen.addRow(["Resueltos en el período", stats.resueltos]);
  resumen.addRow(["Tiempo medio de resolución (hs)", stats.tiempoMedioHoras]);
  resumen.addRow([]);

  resumen.addRow(["Distribución por servicio"]).font = { bold: true, size: 12 };
  const hDistrib = resumen.addRow(["Servicio", "Cantidad", "% del período"]);
  hDistrib.font = { bold: true };
  const iDistrib = resumen.rowCount + 1;
  for (const d of stats.distribServicios) {
    resumen.addRow([d.label, d.total, d.pct / 100]);
  }
  const fDistrib = resumen.rowCount;
  resumen.getColumn(3).numFmt = "0%";
  if (fDistrib >= iDistrib) agregarDataBar(resumen, `B${iDistrib}:B${fDistrib}`, "FF14213D");
  resumen.addRow([]);

  resumen.addRow(["Estado de los reclamos"]).font = { bold: true, size: 12 };
  const hEstado = resumen.addRow(["Estado", "Cantidad", "% del período"]);
  hEstado.font = { bold: true };
  const iEstado = resumen.rowCount + 1;
  for (const e of stats.estadoBreakdown) {
    resumen.addRow([ESTADO_META[e.estado].label, e.n, e.pct / 100]);
  }
  const fEstado = resumen.rowCount;
  resumen.getColumn(3).numFmt = "0%";
  if (fEstado >= iEstado) agregarDataBar(resumen, `B${iEstado}:B${fEstado}`, "FF3B82F6");
  resumen.addRow([]);

  if (stats.cumplimiento.length > 0) {
    resumen.addRow(["Cumplimiento por prestadora"]).font = { bold: true, size: 12 };
    const hCumpl = resumen.addRow(["Prestadora", "Derivados", "Resueltos", "% resuelto"]);
    hCumpl.font = { bold: true };
    for (const p of stats.cumplimiento) {
      resumen.addRow([p.nombre, p.total, p.resueltos, p.pct !== null ? p.pct / 100 : null]);
    }
    resumen.getColumn(4).numFmt = "0%";
    resumen.addRow([]);
  }

  resumen.addRow(["Calidad del reporte"]).font = { bold: true, size: 12 };
  resumen.addRow(["Con foto adjunta", stats.pctFoto / 100]);
  resumen.addRow(["Con GPS o geolocalización", stats.pctGps / 100]);
  resumen.addRow(["Con barrio especificado", stats.pctBarrio / 100]);
  resumen.getColumn(2).numFmt = "0%";
  resumen.getColumn(1).width = 30;
  resumen.getColumn(2).width = 16;
  resumen.getColumn(3).width = 14;
  resumen.getColumn(4).width = 14;

  // ───────────────────── Barrios y tipos de reclamo ─────────────────────
  const barriosTipos = wb.addWorksheet("Barrios y tipos");
  tituloHoja(barriosTipos, "Problemas por barrio y tipo de reclamo", subtitulo);

  barriosTipos.addRow(["Top 10 barrios con más reclamos"]).font = { bold: true, size: 12 };
  const hBarrios = barriosTipos.addRow(["Barrio", "Cantidad"]);
  hBarrios.font = { bold: true };
  const iBarrios = barriosTipos.rowCount + 1;
  for (const [nombre, count] of stats.topBarrios) {
    barriosTipos.addRow([nombre, count]);
  }
  const fBarrios = barriosTipos.rowCount;
  if (fBarrios >= iBarrios) agregarDataBar(barriosTipos, `B${iBarrios}:B${fBarrios}`, "FFE88A3C");
  barriosTipos.addRow([]);

  barriosTipos.addRow(["Top 10 tipos de reclamo"]).font = { bold: true, size: 12 };
  const hTipos = barriosTipos.addRow(["Tipo de reclamo", "Servicio", "Cantidad"]);
  hTipos.font = { bold: true };
  const iTipos = barriosTipos.rowCount + 1;
  for (const [titulo, v] of stats.topTitulos) {
    barriosTipos.addRow([titulo, SVC_META[svcFromKind(v.svc)].short, v.count]);
  }
  const fTipos = barriosTipos.rowCount;
  if (fTipos >= iTipos) agregarDataBar(barriosTipos, `C${iTipos}:C${fTipos}`, "FF4A8B3A");
  barriosTipos.addRow([]);

  if (stats.topBarriosConSvc.length > 0) {
    barriosTipos.addRow(["Top 5 barrios — servicio que más falla en cada uno"]).font = {
      bold: true,
      size: 12,
    };
    const hCruce = barriosTipos.addRow(["Barrio", "Servicio", "Cantidad", "Total del barrio"]);
    hCruce.font = { bold: true };
    for (const b of stats.topBarriosConSvc) {
      for (const s of b.top) {
        barriosTipos.addRow([b.nombre, SVC_META[svcFromKind(s.svc)].short, s.n, b.count]);
      }
    }
  }
  barriosTipos.getColumn(1).width = 28;
  barriosTipos.getColumn(2).width = 20;
  barriosTipos.getColumn(3).width = 14;
  barriosTipos.getColumn(4).width = 16;

  // ───────────────────────────── Tendencia ─────────────────────────────
  const tendencia = wb.addWorksheet("Tendencia");
  tituloHoja(tendencia, "Tendencia mensual y por día de la semana", subtitulo);

  tendencia.addRow(["Reclamos por mes (últimos 6 meses)"]).font = { bold: true, size: 12 };
  const hMes = tendencia.addRow(["Mes", "Cantidad"]);
  hMes.font = { bold: true };
  const iMes = tendencia.rowCount + 1;
  for (const [mes, n] of stats.porMes.entries()) {
    tendencia.addRow([mes, n]);
  }
  const fMes = tendencia.rowCount;
  if (fMes >= iMes) agregarDataBar(tendencia, `B${iMes}:B${fMes}`, "FF14213D");
  tendencia.addRow([]);

  tendencia.addRow(["Reclamos por día de la semana"]).font = { bold: true, size: 12 };
  const hDia = tendencia.addRow(["Día", "Cantidad"]);
  hDia.font = { bold: true };
  const iDia = tendencia.rowCount + 1;
  const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  stats.porDiaSem.forEach((n, i) => tendencia.addRow([DIAS[i], n]));
  const fDia = tendencia.rowCount;
  if (fDia >= iDia) agregarDataBar(tendencia, `B${iDia}:B${fDia}`, "FF3B82F6");
  tendencia.getColumn(1).width = 22;
  tendencia.getColumn(2).width = 14;

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
