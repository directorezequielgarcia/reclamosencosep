/**
 * Informe Anual de Gestión (.docx).
 * Plantilla institucional con logo, KPIs del período, 4 bloques narrativos
 * (balance, logros, desafíos, sugerencias) y anexo de informes mensuales.
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
import type { BloquesInformeAnual } from "@/lib/informe-anual-borrador";
import type { InformeAnualData } from "@/lib/informe-anual-data";

const FONT = "Calibri";
const SIZE_BODY = 22;
const SIZE_HEADING_1 = 28;
const SIZE_HEADING_2 = 24;
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
    children: [
      new TextRun({
        text,
        font: FONT,
        size: SIZE_HEADING_1,
        bold: true,
      }),
    ],
  });
}

function bloqueAParrafos(texto: string): Paragraph[] {
  return texto
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => p(s));
}

function tableCell(text: string, opts: { bold?: boolean; width?: number } = {}): TableCell {
  return new TableCell({
    width: opts.width
      ? { size: opts.width, type: WidthType.PERCENTAGE }
      : undefined,
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
            size: SIZE_BODY,
            bold: opts.bold,
          }),
        ],
      }),
    ],
  });
}

export type DatosDocxAnual = {
  titulo: string;
  periodoDesde: Date;
  periodoHasta: Date;
  bloques: BloquesInformeAnual;
  metricas: InformeAnualData;
  emisor?: { nombre: string; apellido: string } | null;
  emitidoEn?: Date | null;
};

export async function generarDocxInformeAnual(
  datos: DatosDocxAnual,
): Promise<Buffer> {
  const { titulo, periodoDesde, periodoHasta, bloques, metricas, emisor, emitidoEn } = datos;
  const children: (Paragraph | Table)[] = [];

  // Carátula con logo
  const logoBuffer = await cargarLogoBuffer();
  if (logoBuffer) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new ImageRun({
            data: new Uint8Array(logoBuffer),
            transformation: { width: 160, height: 160 },
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
    p("INFORME ANUAL DE GESTIÓN", {
      align: AlignmentType.CENTER,
      bold: true,
      size: SIZE_TITLE,
      spaceAfter: 120,
    }),
    p(titulo, {
      align: AlignmentType.CENTER,
      italic: true,
      size: SIZE_HEADING_2,
      spaceAfter: 120,
    }),
    p(
      `Período: ${periodoDesde.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })} al ${new Date(periodoHasta.getTime() - 24 * 3600 * 1000).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}`,
      {
        align: AlignmentType.CENTER,
        size: SIZE_BODY,
        spaceAfter: 480,
      },
    ),
  );

  // Resumen ejecutivo
  children.push(headingSeccion("Resumen ejecutivo del período"));
  const pctResueltos =
    metricas.totalReclamos > 0
      ? Math.round((metricas.totalReclamosResueltos / metricas.totalReclamos) * 100)
      : 0;
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            tableCell("Indicador", { bold: true, width: 60 }),
            tableCell("Valor", { bold: true, width: 40 }),
          ],
        }),
        new TableRow({
          children: [
            tableCell("Reclamos recibidos"),
            tableCell(String(metricas.totalReclamos)),
          ],
        }),
        new TableRow({
          children: [
            tableCell("Reclamos resueltos"),
            tableCell(`${metricas.totalReclamosResueltos} (${pctResueltos}%)`),
          ],
        }),
        new TableRow({
          children: [
            tableCell("Inspecciones de campo publicadas"),
            tableCell(String(metricas.totalInspecciones)),
          ],
        }),
        new TableRow({
          children: [
            tableCell("Expedientes administrativos abiertos"),
            tableCell(String(metricas.totalExpedientesAbiertos)),
          ],
        }),
        new TableRow({
          children: [
            tableCell("Expedientes administrativos cerrados"),
            tableCell(String(metricas.totalExpedientesCerrados)),
          ],
        }),
        new TableRow({
          children: [
            tableCell("Audiencias públicas realizadas"),
            tableCell(String(metricas.totalAudienciasRealizadas)),
          ],
        }),
        new TableRow({
          children: [
            tableCell("Respuestas a encuesta general del Portal"),
            tableCell(String(metricas.totalEncuestaRespuestas)),
          ],
        }),
      ],
    }),
  );

  // Desempeño por servicio
  children.push(headingSeccion("Desempeño por servicio"));
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            tableCell("Servicio", { bold: true, width: 30 }),
            tableCell("Reclamos", { bold: true, width: 12 }),
            tableCell("% Res.", { bold: true, width: 12 }),
            tableCell("Inspecciones", { bold: true, width: 14 }),
            tableCell("Exp. abr/cer", { bold: true, width: 14 }),
            tableCell("Satisf.", { bold: true, width: 18 }),
          ],
        }),
        ...metricas.porServicio.map((sv) => {
          const pct =
            sv.reclamosTotal > 0
              ? `${Math.round((sv.reclamosResueltos / sv.reclamosTotal) * 100)}%`
              : "—";
          const sat = sv.puntajePromedio !== null
            ? `${sv.puntajePromedio}/5 (${sv.puntajeMuestras})`
            : "—";
          return new TableRow({
            children: [
              tableCell(sv.nombre),
              tableCell(String(sv.reclamosTotal)),
              tableCell(pct),
              tableCell(String(sv.inspeccionesPublicadas)),
              tableCell(`${sv.expedientesAbiertos} / ${sv.expedientesCerrados}`),
              tableCell(sat),
            ],
          });
        }),
      ],
    }),
  );

  // Bloques narrativos
  children.push(headingSeccion("1. Balance del ejercicio"));
  children.push(...bloqueAParrafos(bloques.balance));

  children.push(headingSeccion("2. Logros de la gestión"));
  children.push(...bloqueAParrafos(bloques.logros));

  children.push(headingSeccion("3. Desafíos identificados"));
  children.push(...bloqueAParrafos(bloques.desafios));

  children.push(headingSeccion("4. Sugerencias del Directorio"));
  children.push(...bloqueAParrafos(bloques.sugerencias));

  // Anexo: informes mensuales publicados del período
  if (metricas.mensualesPublicados.length > 0) {
    children.push(headingSeccion("Anexo: informes mensuales publicados"));
    children.push(
      p(
        `Durante el período se publicaron ${metricas.mensualesPublicados.length} ${metricas.mensualesPublicados.length === 1 ? "informe mensual" : "informes mensuales"} técnicos en cumplimiento del art. 5° inc. k de la Ordenanza N° 13.189/17:`,
      ),
    );
    for (const im of metricas.mensualesPublicados) {
      const fechaEmis = im.emitidoEn
        ? im.emitidoEn.toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : "sin fecha de emisión registrada";
      children.push(
        p(
          `• Informe mensual ${String(im.mes).padStart(2, "0")}/${im.anio} — publicado el ${fechaEmis}.`,
        ),
      );
    }
  }

  // Pie con firma
  children.push(p("", { spaceAfter: 600 }));
  if (emisor) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: "_____________________________________",
            font: FONT,
            size: SIZE_BODY,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
        children: [
          new TextRun({
            text: `${emisor.nombre} ${emisor.apellido}`,
            font: FONT,
            size: SIZE_BODY,
            bold: true,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: "Directorio del ENCOSEP — Comodoro Rivadavia",
            font: FONT,
            size: SIZE_SMALL,
            italics: true,
          }),
        ],
      }),
    );
  }

  if (emitidoEn) {
    children.push(
      p(
        `Informe emitido el ${emitidoEn.toLocaleString("es-AR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}.`,
        { align: AlignmentType.CENTER, italic: true, size: SIZE_SMALL },
      ),
    );
  } else {
    children.push(
      p(
        `Borrador generado el ${new Date().toLocaleString("es-AR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} — no es informe oficial.`,
        { align: AlignmentType.CENTER, italic: true, size: SIZE_SMALL },
      ),
    );
  }

  const doc = new Document({
    creator: "ENCOSEP — Portal de Reclamos",
    title: titulo,
    description: `Informe Anual de Gestión del ENCOSEP (art. 5° Ord. 13.189/17) — ${titulo}`,
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
