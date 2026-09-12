/**
 * Export a Excel de "Reclamos ingresados" (panel /consulta) — misma vista
 * resumida que se ve en pantalla, sin ningún dato personal del vecino.
 */
import ExcelJS from "exceljs";
import { ESTADO_META } from "@/lib/admin";
import type { ReclamoConsultaFila } from "@/lib/reclamos-consulta";

const TZ = "America/Argentina/Buenos_Aires";
const fmtFecha = (d: Date) =>
  d.toLocaleDateString("es-AR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });

export async function generarXlsxReclamosConsulta(
  filas: ReclamoConsultaFila[],
  opts: { subtitulo: string },
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ENCOSEP — Panel de consulta";
  wb.created = new Date();

  const ws = wb.addWorksheet("Reclamos ingresados");
  ws.addRow(["ENCOSEP — Reclamos ingresados"]).font = { bold: true, size: 13 };
  ws.addRow([`${opts.subtitulo} — ${filas.length} reclamo(s)`]).font = {
    italic: true,
    size: 10,
    color: { argb: "FF666666" },
  };
  ws.addRow([]);

  ws.columns = [
    { key: "ticket", width: 14 },
    { key: "servicio", width: 16 },
    { key: "situacion", width: 42 },
    { key: "linea", width: 12 },
    { key: "barrio", width: 22 },
    { key: "estado", width: 18 },
    { key: "fecha", width: 12 },
  ];
  const filaHeader = ws.addRow({
    ticket: "N° ticket",
    servicio: "Servicio",
    situacion: "Situación",
    linea: "Línea",
    barrio: "Barrio",
    estado: "Estado",
    fecha: "Fecha",
  });
  filaHeader.font = { bold: true };
  filaHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9ECF2" } };

  for (const r of filas) {
    const row = ws.addRow({
      ticket: r.codigo,
      servicio: r.servicioNombreCorto,
      situacion: r.titulo,
      linea: r.linea || "",
      barrio: r.barrio ?? "",
      estado: ESTADO_META[r.estado].label,
      fecha: fmtFecha(r.createdAt),
    });
    row.font = { size: 10 };
  }
  ws.views = [{ state: "frozen", ySplit: 4 }];

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
