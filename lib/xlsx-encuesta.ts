/**
 * Export a Excel de las respuestas individuales de la encuesta de
 * satisfacción (/encuesta), filtradas por fecha. No incluye dniHash ni
 * ningún otro dato que identifique al vecino.
 */
import ExcelJS from "exceljs";
import type { EncuestaFila } from "@/lib/indicadores-stats";

const TZ = "America/Argentina/Buenos_Aires";
const fmtFecha = (d: Date) =>
  d.toLocaleDateString("es-AR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });

const RESPONSABILIDAD_LABEL: Record<string, string> = {
  COMPARTIDA: "Compartida (Municipio + prestadora)",
  MCR: "Municipio",
  PRESTADORA: "Prestadora",
};

export async function generarXlsxEncuesta(
  filas: EncuestaFila[],
  opts: { desde: Date; hasta: Date },
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ENCOSEP — Panel de indicadores";
  wb.created = new Date();

  const ws = wb.addWorksheet("Encuesta de satisfacción");
  ws.addRow(["ENCOSEP — Encuesta de satisfacción del usuario"]).font = { bold: true, size: 13 };
  ws.addRow([`Período: ${fmtFecha(opts.desde)} al ${fmtFecha(opts.hasta)} — ${filas.length} respuesta(s)`]).font = {
    italic: true,
    size: 10,
    color: { argb: "FF666666" },
  };
  ws.addRow([]);

  // Sin `header` en la definición de columnas: el header se agrega a mano
  // más abajo (mismo patrón que lib/xlsx-reporte-reclamos.ts), porque
  // exceljs inserta una fila extra automática si `header` está presente.
  ws.columns = [
    { key: "fecha", width: 12 },
    { key: "barrio", width: 22 },
    { key: "agua", width: 16 },
    { key: "energia", width: 12 },
    { key: "residuos", width: 12 },
    { key: "transporte", width: 12 },
    { key: "responsabilidad", width: 26 },
    { key: "comentario", width: 50 },
  ];
  const filaHeader = ws.addRow({
    fecha: "Fecha",
    barrio: "Barrio",
    agua: "Agua y Saneamiento",
    energia: "Energía",
    residuos: "Residuos",
    transporte: "Transporte",
    responsabilidad: "Responsabilidad atribuida",
    comentario: "Comentario",
  });
  filaHeader.font = { bold: true };
  filaHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9ECF2" } };
  const filaInicioDatos = ws.rowCount + 1;

  for (const f of filas) {
    const row = ws.addRow({
      fecha: fmtFecha(f.createdAt),
      barrio: f.barrio ?? "",
      agua: f.puntajeAgua ?? "",
      energia: f.puntajeEnergia ?? "",
      residuos: f.puntajeResiduos ?? "",
      transporte: f.puntajeTransporte ?? "",
      responsabilidad: f.responsabilidad ? (RESPONSABILIDAD_LABEL[f.responsabilidad] ?? f.responsabilidad) : "",
      comentario: f.comentario ?? "",
    });
    row.alignment = { vertical: "top", wrapText: true };
    row.font = { size: 10 };
  }
  ws.views = [{ state: "frozen", ySplit: filaInicioDatos - 1 }];

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
