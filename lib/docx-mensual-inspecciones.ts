/**
 * Informe Mensual de Inspecciones (.docx).
 * Agrupa todas las inspecciones PUBLICADAS del mes por servicio y por tipo,
 * lista los relevamientos individuales y produce totalizadores.
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
import { TIPO_INSPECCION_META } from "@/lib/inspecciones";
import { cargarLogoBuffer } from "@/lib/docx-logo";
import type { TipoInspeccion } from "@prisma/client";

type InspeccionItem = {
  codigo: string;
  fecha: Date;
  titulo: string;
  tipo: TipoInspeccion;
  direccion: string | null;
  barrio: string | null;
  inspector: { nombre: string; apellido: string };
  prestadora: { razonSocial: string } | null;
  fotosCount: number;
  tieneAudio: boolean;
};

export type DatosMensualInspecciones = {
  anio: number;
  mes: number; // 1-12
  servicios: {
    servicioId: string;
    nombre: string;
    nombreCorto: string;
    inspecciones: InspeccionItem[];
  }[];
  porTipo: Record<TipoInspeccion, number>;
  porInspector: { nombre: string; apellido: string; total: number }[];
  porBarrio: { barrio: string; total: number }[];
};

const FONT = "Calibri";
const SIZE_BODY = 22;
const SIZE_HEADING = 28;
const SIZE_TITLE = 36;
const SIZE_SMALL = 18;

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

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

function heading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({ text, font: FONT, size: SIZE_HEADING, bold: true }),
    ],
  });
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

function fechaCorta(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function fechaLarga(d: Date): string {
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function generarMensualInspecciones(
  datos: DatosMensualInspecciones,
): Promise<Buffer> {
  const totalInspecciones = datos.servicios.reduce(
    (s, sv) => s + sv.inspecciones.length,
    0,
  );

  const children: (Paragraph | Table)[] = [];

  // Logo institucional centrado en la carátula
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

  // Encabezado institucional
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
    p(`INFORME MENSUAL DE INSPECCIONES`, {
      align: AlignmentType.CENTER,
      bold: true,
      size: SIZE_TITLE,
      spaceAfter: 120,
    }),
    p(`${MESES[datos.mes - 1]} de ${datos.anio}`, {
      align: AlignmentType.CENTER,
      italic: true,
      size: SIZE_HEADING,
      spaceAfter: 360,
    }),
  );

  // Resumen ejecutivo
  children.push(heading("Resumen ejecutivo"));

  if (totalInspecciones === 0) {
    children.push(
      p(
        `Durante el mes de ${MESES[datos.mes - 1].toLowerCase()} de ${datos.anio} no se publicaron inspecciones de campo. Las inspecciones cargadas en estado borrador no se contabilizan en este informe.`,
        { italic: true },
      ),
    );
  } else {
    children.push(
      p(
        `Durante el mes de ${MESES[datos.mes - 1].toLowerCase()} de ${datos.anio} se realizaron ${totalInspecciones} ${totalInspecciones === 1 ? "inspección publicada" : "inspecciones publicadas"} sobre los servicios públicos bajo control de este Ente.`,
      ),
    );

    // Tabla por servicio
    children.push(heading("Inspecciones por servicio"));
    const filasSvc: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          tableCell("Servicio", { bold: true, width: 70 }),
          tableCell("Inspecciones", { bold: true, width: 30 }),
        ],
      }),
      ...datos.servicios.map(
        (sv) =>
          new TableRow({
            children: [
              tableCell(sv.nombre),
              tableCell(String(sv.inspecciones.length)),
            ],
          }),
      ),
      new TableRow({
        children: [
          tableCell("Total general", { bold: true }),
          tableCell(String(totalInspecciones), { bold: true }),
        ],
      }),
    ];
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: filasSvc,
      }),
    );

    // Tabla por tipo
    children.push(heading("Inspecciones por tipo"));
    const filasTipo: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          tableCell("Tipo", { bold: true, width: 70 }),
          tableCell("Cantidad", { bold: true, width: 30 }),
        ],
      }),
      ...(Object.keys(datos.porTipo) as TipoInspeccion[]).map(
        (t) =>
          new TableRow({
            children: [
              tableCell(TIPO_INSPECCION_META[t].label),
              tableCell(String(datos.porTipo[t])),
            ],
          }),
      ),
    ];
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: filasTipo,
      }),
    );

    // Inspectores
    if (datos.porInspector.length > 0) {
      children.push(heading("Inspectores actuantes"));
      const filasInsp: TableRow[] = [
        new TableRow({
          tableHeader: true,
          children: [
            tableCell("Inspector", { bold: true, width: 70 }),
            tableCell("Inspecciones", { bold: true, width: 30 }),
          ],
        }),
        ...datos.porInspector.map(
          (i) =>
            new TableRow({
              children: [
                tableCell(`${i.nombre} ${i.apellido}`),
                tableCell(String(i.total)),
              ],
            }),
        ),
      ];
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: filasInsp,
        }),
      );
    }

    // Barrios más relevados
    if (datos.porBarrio.length > 0) {
      children.push(heading("Barrios y zonas con mayor actividad"));
      const top = datos.porBarrio.slice(0, 10);
      const filasBarrio: TableRow[] = [
        new TableRow({
          tableHeader: true,
          children: [
            tableCell("Barrio / zona", { bold: true, width: 70 }),
            tableCell("Inspecciones", { bold: true, width: 30 }),
          ],
        }),
        ...top.map(
          (b) =>
            new TableRow({
              children: [
                tableCell(b.barrio || "Sin barrio especificado"),
                tableCell(String(b.total)),
              ],
            }),
        ),
      ];
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: filasBarrio,
        }),
      );
    }

    // Detalle por servicio
    children.push(heading("Detalle por servicio"));

    for (const sv of datos.servicios) {
      if (sv.inspecciones.length === 0) continue;

      children.push(
        p(`${sv.nombre} (${sv.inspecciones.length})`, {
          bold: true,
          size: SIZE_HEADING,
          spaceAfter: 120,
        }),
      );

      const filasDetalle: TableRow[] = [
        new TableRow({
          tableHeader: true,
          children: [
            tableCell("Fecha", { bold: true, width: 10 }),
            tableCell("Código", { bold: true, width: 15 }),
            tableCell("Título", { bold: true, width: 35 }),
            tableCell("Tipo", { bold: true, width: 15 }),
            tableCell("Ubicación", { bold: true, width: 15 }),
            tableCell("Inspector", { bold: true, width: 10 }),
          ],
        }),
        ...sv.inspecciones.map(
          (i) =>
            new TableRow({
              children: [
                tableCell(fechaCorta(i.fecha)),
                tableCell(i.codigo),
                tableCell(
                  `${i.titulo}${i.tieneAudio ? " 🎙️" : ""}${i.fotosCount > 0 ? ` (📷 ${i.fotosCount})` : ""}`,
                ),
                tableCell(TIPO_INSPECCION_META[i.tipo].label),
                tableCell(i.barrio ?? i.direccion ?? "—"),
                tableCell(`${i.inspector.apellido}, ${i.inspector.nombre.charAt(0)}.`),
              ],
            }),
        ),
      ];
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: filasDetalle,
        }),
      );
    }
  }

  // Pie
  children.push(
    p("", { spaceAfter: 480 }),
    p(`Documento generado el ${fechaLarga(new Date())} desde el Portal ENCOSEP.`, {
      align: AlignmentType.CENTER,
      italic: true,
      size: SIZE_SMALL,
    }),
    p(
      "Este informe se elabora a partir de las inspecciones de campo publicadas en el sistema y se conserva para alimentar las secciones 2 y 3 del Informe Mensual Técnico (art. 5° inciso k de la Ordenanza N° 13.189/17).",
      {
        align: AlignmentType.CENTER,
        italic: true,
        size: SIZE_SMALL,
      },
    ),
  );

  const doc = new Document({
    creator: "ENCOSEP — Portal de Reclamos",
    title: `Informe mensual de inspecciones ${MESES[datos.mes - 1]} ${datos.anio}`,
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
