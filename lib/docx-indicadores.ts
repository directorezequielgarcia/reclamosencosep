/**
 * Estadísticas de /indicadores filtradas por fecha/servicio (.docx).
 * Reporte descargable para armar informes con datos de un período puntual.
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
import type { IndicadoresStats } from "@/lib/indicadores-stats";

const FONT = "Calibri";
const SIZE_BODY = 22;
const SIZE_HEADING_1 = 28;
const SIZE_TITLE = 36;
const SIZE_SMALL = 18;

function p(
  text: string,
  opts: {
    bold?: boolean;
    italic?: boolean;
    size?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    spaceAfter?: number;
  } = {},
): Paragraph {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    spacing: { after: opts.spaceAfter ?? 120, line: 276 },
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

function headingSeccion(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, font: FONT, size: SIZE_HEADING_1, bold: true })],
  });
}

function tableCell(text: string, opts: { bold?: boolean; width?: number } = {}): TableCell {
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
        children: [new TextRun({ text, font: FONT, size: SIZE_BODY, bold: opts.bold })],
      }),
    ],
  });
}

function tablaSimple(
  encabezados: [string, string],
  filas: [string, string][],
): Table {
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

export async function generarDocxIndicadores(stats: IndicadoresStats): Promise<Buffer> {
  const { desde, hasta, svcLabel } = stats;
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

  const periodoTexto = `${desde.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })} al ${hasta.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}`;

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
    p("INDICADORES PÚBLICOS DE GESTIÓN", {
      align: AlignmentType.CENTER,
      bold: true,
      size: SIZE_TITLE,
      spaceAfter: 120,
    }),
    p(`Período: ${periodoTexto}${svcLabel ? ` — Servicio: ${svcLabel}` : ""}`, {
      align: AlignmentType.CENTER,
      italic: true,
      size: SIZE_BODY,
      spaceAfter: 480,
    }),
  );

  children.push(headingSeccion("Cifras generales"));
  children.push(
    tablaSimple(
      ["Indicador", "Valor"],
      [
        ["Reclamos registrados (histórico)", String(stats.total)],
        ["Reclamos en el período", String(stats.totalPeriodo)],
        [
          "Reclamos resueltos",
          `${stats.resueltos} (${stats.totalPeriodo > 0 ? Math.round((stats.resueltos / stats.totalPeriodo) * 100) : 0}%)`,
        ],
        ["Tiempo medio de resolución", stats.tiempoMedioHoras ? `${stats.tiempoMedioHoras} hs` : "—"],
      ],
    ),
  );

  children.push(headingSeccion("Distribución por servicio"));
  children.push(
    tablaSimple(
      ["Servicio", "Reclamos (%)"],
      stats.distribServicios.map((d) => [d.label, `${d.total} (${d.pct}%)`]),
    ),
  );

  children.push(headingSeccion("Estado de los reclamos"));
  children.push(
    tablaSimple(
      ["Estado", "Cantidad (%)"],
      stats.estadoBreakdown.map((e) => [
        ESTADO_META[e.estado].label,
        `${e.n} (${e.pct}%)`,
      ]),
    ),
  );

  if (stats.cumplimiento.length > 0) {
    children.push(headingSeccion("Cumplimiento por prestadora"));
    children.push(
      tablaSimple(
        ["Prestadora", "Resueltos / Total (%)"],
        stats.cumplimiento.map((c) => [c.nombre, `${c.resueltos} / ${c.total} (${c.pct ?? 0}%)`]),
      ),
    );
  }

  if (stats.topBarrios.length > 0) {
    children.push(headingSeccion("Top barrios con más reclamos"));
    children.push(
      tablaSimple(
        ["Barrio", "Reclamos"],
        stats.topBarrios.map(([nombre, n]) => [nombre, String(n)]),
      ),
    );
  }

  children.push(headingSeccion("Calidad del reporte"));
  children.push(
    tablaSimple(
      ["Elemento", "% de reclamos del período"],
      [
        ["Con foto adjunta", `${stats.pctFoto}%`],
        ["Con GPS o geolocalización", `${stats.pctGps}%`],
        ["Con barrio especificado", `${stats.pctBarrio}%`],
      ],
    ),
  );

  children.push(p("", { spaceAfter: 400 }));
  children.push(
    p(
      `Reporte generado el ${new Date().toLocaleString("es-AR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} desde el Portal de Reclamos ENCOSEP. Datos anonimizados y agregados.`,
      { align: AlignmentType.CENTER, italic: true, size: SIZE_SMALL },
    ),
  );

  const doc = new Document({
    creator: "ENCOSEP — Portal de Reclamos",
    title: "Indicadores públicos de gestión",
    description: `Indicadores ENCOSEP — período ${periodoTexto}`,
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.PORTRAIT },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
