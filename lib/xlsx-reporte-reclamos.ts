/**
 * Reporte de reclamos por tema y problemática (.xlsx) — pensado para el
 * Anexo que se presenta impreso junto a una nota: una hoja "Resumen" con la
 * clasificación por tema/problemática y por día (con barras de datos nativas
 * de Excel a modo de gráfico), y una hoja "Anexo" con el detalle fila por
 * fila en una sola tabla continua (columna "Día" con la fecha de cada
 * reclamo), en papel Oficio apaisado con el encabezado repetido en cada
 * página impresa.
 */
import ExcelJS from "exceljs";
import { ESTADO_META } from "@/lib/admin";
import { resolverBarrioPorCoordenadas, barrioMasCercano } from "@/lib/barrios-geo";
import type { ReporteDiario, ReporteFila } from "@/lib/reclamos-stats";

const TZ = "America/Argentina/Buenos_Aires";

const fmtFechaCorta = (d: Date) =>
  d.toLocaleDateString("es-AR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
const fmtHora = (d: Date) =>
  d.toLocaleTimeString("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const fmtDiaLargo = (d: Date) =>
  d.toLocaleDateString("es-AR", {
    timeZone: TZ,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

/** La línea de colectivo se antepone como texto libre a la descripción de
 *  los reclamos de Transporte (ver app/api/reclamos/route.ts): "Línea: 12 ·
 *  Empresa declarada: Sol Bus\n<descripción>". La separamos para que el
 *  Excel tenga su propia columna en vez de repetirla en el texto. Reclamos
 *  de otros servicios (o sin ese encabezado) simplemente no matchean. */
export function parseLineaTransporte(descripcion: string): { linea: string; descripcionLimpia: string } {
  const lines = descripcion.split("\n");
  const primera = (lines[0] ?? "").trim();
  if (/^(Línea:|Empresa declarada:)/.test(primera)) {
    const m = primera.match(/Línea:\s*([^·\n]+)/);
    return { linea: m ? m[1].trim() : "", descripcionLimpia: lines.slice(1).join("\n").trim() };
  }
  return { linea: "", descripcionLimpia: descripcion.trim() };
}

/** El vecino puede cargar el reclamo con geolocalización del navegador en vez
 *  de escribir la dirección, y en ese caso el campo `barrio` queda vacío. Acá
 *  lo completamos a partir de lat/lng (point-in-polygon contra los límites
 *  oficiales de barrios); si el punto cae fuera de todos los polígonos se usa
 *  el barrio más cercano como aproximación, marcada como tal. */
function resolverBarrioAnexo(f: ReporteFila): string {
  if (f.barrio?.trim()) return f.barrio.trim();
  if (f.lat != null && f.lng != null) {
    const exacto = resolverBarrioPorCoordenadas(f.lat, f.lng);
    if (exacto) return exacto;
    const cercano = barrioMasCercano(f.lat, f.lng);
    if (cercano) return `${cercano} (aprox.)`;
  }
  return "";
}

function agregarDataBar(ws: ExcelJS.Worksheet, ref: string, argb: string) {
  // `color` sí lo soporta exceljs en runtime para dataBar, pero falta en
  // sus tipos — se castea puntualmente acá.
  const rule = {
    type: "dataBar",
    cfvo: [{ type: "min" }, { type: "max" }],
    color: { argb },
  } as unknown as ExcelJS.DataBarRuleType;
  ws.addConditionalFormatting({ ref, rules: [rule] });
}

export async function generarXlsxReporteReclamos(
  reporte: ReporteDiario,
  filas: ReporteFila[],
  opts: { subtitulo: string; svcLabel?: string | null },
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ENCOSEP — Portal de Reclamos";
  wb.created = new Date();

  // ─────────────────────────────────────────────
  // Hoja Resumen
  // ─────────────────────────────────────────────
  const resumen = wb.addWorksheet("Resumen");
  resumen.addRow(["ENCOSEP — Reporte de reclamos por tema y problemática"]).font = { bold: true, size: 13 };
  resumen.addRow([
    opts.subtitulo + (opts.svcLabel ? ` — Servicio: ${opts.svcLabel}` : ""),
  ]);
  resumen.addRow([`Generado el ${reporte.generadoEn} hs`]);
  resumen.addRow([]);
  resumen.addRow([`Total de reclamos en el período: ${reporte.total}`]);
  resumen.addRow([]);

  const headerResumen = resumen.addRow(["Tema", "Problemática", "Cantidad", "% del tema", "% del total"]);
  headerResumen.font = { bold: true };
  const filaInicioResumen = resumen.rowCount + 1;
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
  const filaFinResumen = resumen.rowCount;
  resumen.getColumn(1).width = 24;
  resumen.getColumn(2).width = 42;
  resumen.getColumn(3).width = 12;
  resumen.getColumn(4).width = 12;
  resumen.getColumn(4).numFmt = "0%";
  resumen.getColumn(5).width = 12;
  resumen.getColumn(5).numFmt = "0%";
  if (filaFinResumen >= filaInicioResumen) {
    agregarDataBar(resumen, `C${filaInicioResumen}:C${filaFinResumen}`, "FFF97316");
  }

  // --- Reclamos por día (siempre útil para ver la evolución del período) ---
  const porDia = new Map<string, { fecha: Date; cantidad: number }>();
  for (const f of filas) {
    const key = fmtFechaCorta(f.createdAt);
    const actual = porDia.get(key);
    if (actual) actual.cantidad += 1;
    else porDia.set(key, { fecha: f.createdAt, cantidad: 1 });
  }
  const diasOrdenados = [...porDia.entries()].sort(
    (a, b) => a[1].fecha.getTime() - b[1].fecha.getTime(),
  );
  if (diasOrdenados.length > 1) {
    resumen.addRow([]);
    resumen.addRow(["Reclamos por día"]).font = { bold: true, size: 12 };
    const headerDia = resumen.addRow(["Día", "Cantidad"]);
    headerDia.font = { bold: true };
    const filaInicioDia = resumen.rowCount + 1;
    for (const [, { fecha, cantidad }] of diasOrdenados) {
      resumen.addRow([fmtDiaLargo(fecha), cantidad]);
    }
    const filaFinDia = resumen.rowCount;
    agregarDataBar(resumen, `B${filaInicioDia}:B${filaFinDia}`, "FF3B82F6");
  }

  // --- Reclamos por línea (solo aparece si hay reclamos de Transporte) ---
  const porLinea = new Map<string, number>();
  for (const f of filas) {
    const { linea } = parseLineaTransporte(f.descripcion);
    if (!linea) continue;
    porLinea.set(linea, (porLinea.get(linea) ?? 0) + 1);
  }
  if (porLinea.size > 0) {
    resumen.addRow([]);
    resumen.addRow(["Reclamos de Transporte por línea"]).font = { bold: true, size: 12 };
    const headerLinea = resumen.addRow(["Línea", "Cantidad"]);
    headerLinea.font = { bold: true };
    const filaInicioLinea = resumen.rowCount + 1;
    for (const [linea, cantidad] of [...porLinea.entries()].sort((a, b) => b[1] - a[1])) {
      resumen.addRow([linea, cantidad]);
    }
    const filaFinLinea = resumen.rowCount;
    agregarDataBar(resumen, `B${filaInicioLinea}:B${filaFinLinea}`, "FF10B981");
  }

  // ─────────────────────────────────────────────
  // Hoja Anexo — detalle fila por fila, tabla continua, para imprimir
  // ─────────────────────────────────────────────
  const anexo = wb.addWorksheet("Anexo", {
    pageSetup: {
      orientation: "landscape",
      paperSize: 14 as ExcelJS.PaperSize, // Oficio/Folio, 8.5 x 13"
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: "4:4",
      margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
    },
  });
  const cols = [
    { key: "dia", width: 22 },
    { key: "codigo", width: 12 },
    { key: "fecha", width: 10 },
    { key: "linea", width: 10 },
    { key: "asunto", width: 26 },
    { key: "estado", width: 16 },
    { key: "direccion", width: 26 },
    { key: "barrio", width: 18 },
    { key: "vecino", width: 22 },
    { key: "descripcion", width: 60 },
  ] as const;
  anexo.columns = [...cols];
  const HEADERS = ["Día", "Reclamo", "Hora", "Línea", "Asunto", "Estado", "Dirección", "Barrio", "Vecino", "Descripción del problema"];

  anexo.mergeCells(`A1:${String.fromCharCode(65 + cols.length - 1)}1`);
  anexo.getCell("A1").value = "ENCOSEP — Anexo de reclamos";
  anexo.getCell("A1").font = { bold: true, size: 14 };
  anexo.mergeCells(`A2:${String.fromCharCode(65 + cols.length - 1)}2`);
  anexo.getCell("A2").value =
    opts.subtitulo + (opts.svcLabel ? ` — Servicio: ${opts.svcLabel}` : "") + ` — ${filas.length} reclamo(s)`;
  anexo.getCell("A2").font = { italic: true, size: 10, color: { argb: "FF666666" } };
  anexo.addRow([]);

  const filaHeader = anexo.addRow(HEADERS);
  filaHeader.font = { bold: true };
  filaHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9ECF2" } };

  const filasAsc = [...filas].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  for (const f of filasAsc) {
    const { linea, descripcionLimpia } = parseLineaTransporte(f.descripcion);
    const row = anexo.addRow({
      dia: fmtDiaLargo(f.createdAt),
      codigo: f.codigo,
      fecha: fmtHora(f.createdAt),
      linea: linea || "—",
      asunto: f.problematica,
      estado: ESTADO_META[f.estado].label,
      direccion: f.direccion,
      barrio: resolverBarrioAnexo(f),
      vecino: f.vecino,
      descripcion: descripcionLimpia,
    });
    row.alignment = { vertical: "top", wrapText: true };
    row.font = { size: 10 };
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFDDDDDD" } },
        bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
      };
    });
  }
  anexo.views = [{ state: "frozen", ySplit: 4 }];

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
