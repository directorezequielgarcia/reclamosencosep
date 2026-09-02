/**
 * Reporte de reclamos por tema y problemática (.docx) — resumen ejecutivo
 * con la clasificación por servicio/problemática y un Anexo con el detalle
 * fila por fila. Respeta las convenciones del ENCOSEP: Calibri 11 pt,
 * interlineado simple. Soporta formato A4 y OFICIO (igual que el Acta de
 * Inspección).
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  PageOrientation,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { cargarLogoBuffer } from "@/lib/docx-logo";
import { ESTADO_META } from "@/lib/admin";
import type { ReporteDiario, ReporteFila } from "@/lib/reclamos-stats";

export type FormatoReporte = "a4" | "oficio";

const FONT = "Calibri";
const SIZE_BODY = 22; // 11 pt
const SIZE_HEADING_1 = 28; // 14 pt
const SIZE_HEADING_2 = 24; // 12 pt
const SIZE_TITLE = 36; // 18 pt
const SIZE_SMALL = 18; // 9 pt

const PAGE_A4 = { width: 11906, height: 16838 }; // 210 × 297 mm
const PAGE_OFICIO = { width: 12240, height: 18720 }; // 8.5" × 13"

function p(
  text: string,
  opts: {
    bold?: boolean;
    italic?: boolean;
    size?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    spaceAfter?: number;
    pageBreakBefore?: boolean;
  } = {},
): Paragraph {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    spacing: { after: opts.spaceAfter ?? 120, line: 276 },
    pageBreakBefore: opts.pageBreakBefore,
    children: [
      new TextRun({
        text,
        font: FONT,
        size: opts.size ?? SIZE_BODY,
        bold: opts.bold,
        italics: opts.italic,
      }),
    ],
  });
}

function headingSeccion(text: string, opts: { pageBreakBefore?: boolean } = {}): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    pageBreakBefore: opts.pageBreakBefore,
    children: [new TextRun({ text, font: FONT, size: SIZE_HEADING_1, bold: true })],
  });
}

function headingTema(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [new TextRun({ text, font: FONT, size: SIZE_HEADING_2, bold: true })],
  });
}

function tableCell(
  text: string,
  opts: { bold?: boolean; width?: number; size?: number } = {},
): TableCell {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD" },
    },
    children: [
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({
            text,
            font: FONT,
            size: opts.size ?? SIZE_BODY,
            bold: opts.bold,
          }),
        ],
      }),
    ],
  });
}

function tablaSimple(encabezados: [string, string], filas: [string, string][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          tableCell(encabezados[0], { bold: true, width: 65 }),
          tableCell(encabezados[1], { bold: true, width: 35 }),
        ],
      }),
      ...filas.map(([a, b]) => new TableRow({ children: [tableCell(a), tableCell(b)] })),
    ],
  });
}

const ANEXO_COLS: [string, number][] = [
  ["Código", 9],
  ["Fecha", 10],
  ["Servicio", 13],
  ["Problemática", 24],
  ["Estado", 11],
  ["Dirección", 21],
  ["Vecino", 12],
];

function tablaAnexo(filas: ReporteFila[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: ANEXO_COLS.map(([label, width]) =>
          tableCell(label, { bold: true, width, size: SIZE_SMALL }),
        ),
      }),
      ...filas.map(
        (f) =>
          new TableRow({
            children: [
              tableCell(f.codigo, { size: SIZE_SMALL }),
              tableCell(f.fecha, { size: SIZE_SMALL }),
              tableCell(f.tema, { size: SIZE_SMALL }),
              tableCell(f.problematica, { size: SIZE_SMALL }),
              tableCell(ESTADO_META[f.estado].label, { size: SIZE_SMALL }),
              tableCell(
                f.barrio ? `${f.direccion}, ${f.barrio}` : f.direccion,
                { size: SIZE_SMALL },
              ),
              tableCell(f.vecino, { size: SIZE_SMALL }),
            ],
          }),
      ),
    ],
  });
}

export async function generarDocxReporteReclamos(
  reporte: ReporteDiario,
  filas: ReporteFila[],
  opts: { subtitulo: string; svcLabel?: string | null },
  formato: FormatoReporte = "a4",
): Promise<Buffer> {
  const pageSize = formato === "oficio" ? PAGE_OFICIO : PAGE_A4;
  const children: (Paragraph | Table)[] = [];

  const logoBuffer = await cargarLogoBuffer();
  if (logoBuffer) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new ImageRun({
            data: new Uint8Array(logoBuffer),
            transformation: { width: 140, height: 140 },
            type: "jpg",
          }),
        ],
      }),
    );
  }

  children.push(
    p("ENTE DE CONTROL DE LOS SERVICIOS PÚBLICOS", {
      align: AlignmentType.CENTER,
      bold: true,
      size: SIZE_BODY,
    }),
    p("Municipalidad de Comodoro Rivadavia — Ordenanza N° 13.189/17", {
      align: AlignmentType.CENTER,
      size: SIZE_SMALL,
      spaceAfter: 360,
    }),
    p("REPORTE DE RECLAMOS POR TEMA Y PROBLEMÁTICA", {
      align: AlignmentType.CENTER,
      bold: true,
      size: SIZE_TITLE,
      spaceAfter: 120,
    }),
    p(`${opts.subtitulo}${opts.svcLabel ? ` — Servicio: ${opts.svcLabel}` : ""}`, {
      align: AlignmentType.CENTER,
      italic: true,
      size: SIZE_BODY,
      spaceAfter: 80,
    }),
    p(`Generado el ${reporte.generadoEn} hs`, {
      align: AlignmentType.CENTER,
      italic: true,
      size: SIZE_SMALL,
      spaceAfter: 360,
    }),
  );

  // --- Resumen ejecutivo ---
  children.push(headingSeccion("Resumen ejecutivo"));
  children.push(
    p(
      `Se registraron ${reporte.total} reclamo${reporte.total === 1 ? "" : "s"} en el período. A continuación, la clasificación por tema y, dentro de cada uno, por problemática puntual.`,
      { spaceAfter: 200 },
    ),
  );

  children.push(
    tablaSimple(
      ["Tema (servicio)", "Reclamos (%)"],
      reporte.temas.map((t) => [
        t.nombre,
        `${t.cantidad} (${reporte.total > 0 ? Math.round((t.cantidad / reporte.total) * 100) : 0}%)`,
      ]),
    ),
  );

  for (const tema of reporte.temas) {
    children.push(headingTema(`${tema.nombre} — ${tema.cantidad} reclamos`));
    children.push(
      tablaSimple(
        ["Problemática", "Cantidad (% del tema)"],
        tema.problematicas.map((prob) => [
          prob.titulo,
          `${prob.cantidad} (${Math.round((prob.cantidad / tema.cantidad) * 100)}%)`,
        ]),
      ),
    );
  }

  // --- Anexo ---
  children.push(headingSeccion("Anexo — Detalle de reclamos", { pageBreakBefore: true }));
  children.push(
    p(
      "Listado individual de los reclamos del período, ordenados del más reciente al más antiguo.",
      { spaceAfter: 200 },
    ),
  );
  if (filas.length > 0) {
    children.push(tablaAnexo(filas));
  } else {
    children.push(p("No hay reclamos registrados en este período."));
  }

  children.push(p("", { spaceAfter: 400 }));
  children.push(
    p(
      `Documento generado el ${reporte.generadoEn} hs desde el Portal de Reclamos ENCOSEP. Formato: ${formato === "oficio" ? "OFICIO (8,5″ × 13″)" : "A4 (21 × 29,7 cm)"}.`,
      { align: AlignmentType.CENTER, italic: true, size: SIZE_SMALL },
    ),
  );

  const doc = new Document({
    creator: "ENCOSEP — Portal de Reclamos",
    title: "Reporte de reclamos por tema y problemática",
    description: opts.subtitulo,
    sections: [
      {
        properties: {
          page: {
            size: {
              width: pageSize.width,
              height: pageSize.height,
              orientation: PageOrientation.PORTRAIT,
            },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
