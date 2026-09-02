/**
 * Reporte de reclamos por tema y problemática (.xlsx) — pensado para el
 * Anexo: una hoja "Resumen" con la clasificación y una hoja "Anexo" con el
 * detalle fila por fila, con autofiltro habilitado en el encabezado para que
 * se pueda filtrar por servicio, problemática, zona/barrio, estado, etc.
 */
import ExcelJS from "exceljs";
import { ESTADO_META } from "@/lib/admin";
import type { ReporteDiario, ReporteFila } from "@/lib/reclamos-stats";

export async function generarXlsxReporteReclamos(
  reporte: ReporteDiario,
  filas: ReporteFila[],
  opts: { subtitulo: string; svcLabel?: string | null },
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ENCOSEP — Portal de Reclamos";
  wb.created = new Date();

  // --- Hoja Resumen ---
  const resumen = wb.addWorksheet("Resumen");
  resumen.addRow(["ENCOSEP — Reporte de reclamos por tema y problemática"]);
  resumen.addRow([
    opts.subtitulo + (opts.svcLabel ? ` — Servicio: ${opts.svcLabel}` : ""),
  ]);
  resumen.addRow([`Generado el ${reporte.generadoEn} hs`]);
  resumen.addRow([]);
  resumen.addRow([`Total de reclamos en el período: ${reporte.total}`]);
  resumen.addRow([]);

  const headerResumen = resumen.addRow(["Tema", "Problemática", "Cantidad", "% del tema", "% del total"]);
  headerResumen.font = { bold: true };
  for (const tema of reporte.temas) {
    for (const prob of tema.problematicas) {
      resumen.addRow([
        tema.nombre,
        prob.titulo,
        prob.cantidad,
        tema.cantidad > 0 ? Math.round((prob.cantidad / tema.cantidad) * 100) / 100 : 0,
        reporte.total > 0 ? Math.round((prob.cantidad / reporte.total) * 100) / 100 : 0,
      ]);
    }
  }
  resumen.getColumn(1).width = 24;
  resumen.getColumn(2).width = 42;
  resumen.getColumn(3).width = 12;
  resumen.getColumn(4).width = 12;
  resumen.getColumn(4).numFmt = "0%";
  resumen.getColumn(5).width = 12;
  resumen.getColumn(5).numFmt = "0%";

  // --- Hoja Anexo (detalle, filtrable) ---
  const anexo = wb.addWorksheet("Anexo");
  const cols = [
    { header: "Código", key: "codigo", width: 12 },
    { header: "Fecha", key: "fecha", width: 16 },
    { header: "Servicio", key: "servicio", width: 20 },
    { header: "Problemática", key: "problematica", width: 40 },
    { header: "Estado", key: "estado", width: 16 },
    { header: "Dirección", key: "direccion", width: 32 },
    { header: "Barrio / zona", key: "barrio", width: 22 },
    { header: "Vecino", key: "vecino", width: 24 },
    { header: "Descripción", key: "descripcion", width: 60 },
  ];
  anexo.columns = cols;
  anexo.getRow(1).font = { bold: true };

  for (const f of filas) {
    anexo.addRow({
      codigo: f.codigo,
      fecha: f.createdAt,
      servicio: f.tema,
      problematica: f.problematica,
      estado: ESTADO_META[f.estado].label,
      direccion: f.direccion,
      barrio: f.barrio ?? "",
      vecino: f.vecino,
      descripcion: f.descripcion,
    });
  }
  anexo.getColumn("fecha").numFmt = "dd/mm/yyyy hh:mm";
  if (filas.length > 0) {
    anexo.autoFilter = { from: "A1", to: `I${filas.length + 1}` };
  }
  anexo.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
