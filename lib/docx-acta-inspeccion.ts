/**
 * Generación del Acta de Inspección en formato .docx.
 *
 * Respeta las convenciones del ENCOSEP: Calibri 11 pt, interlineado simple,
 * prosa sin bullets para el cuerpo principal. El acta es un documento formal
 * que el inspector firma y el Directorio archiva.
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

type InspeccionParaActa = {
  codigo: string;
  fecha: Date;
  inspector: { nombre: string; apellido: string; dni: string };
  servicio: { nombre: string };
  prestadora: { razonSocial: string } | null;
  tipo: TipoInspeccion;
  titulo: string;
  observaciones: string;
  direccion: string | null;
  barrio: string | null;
  lat: number | null;
  lng: number | null;
  transcripcionAudio: string | null;
  expediente: { numero: string; caratula: string } | null;
  fotos: { url: string; descripcion: string | null }[];
  createdAt: Date;
};

const FONT = "Calibri";
const SIZE_BODY = 22; // 11 pt (1pt = 2 half-points)
const SIZE_HEADING = 28; // 14 pt
const SIZE_TITLE = 36; // 18 pt
const SIZE_SMALL = 18; // 9 pt

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
    spacing: { after: opts.spaceAfter ?? 120, line: 276 }, // line 276 = 1.15 spacing approx single
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
      new TextRun({
        text,
        font: FONT,
        size: SIZE_HEADING,
        bold: true,
      }),
    ],
  });
}

function fila(label: string, value: string): TableRow {
  const cellBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        children: [
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: label,
                font: FONT,
                size: SIZE_BODY,
                bold: true,
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        children: [
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: value || "—",
                font: FONT,
                size: SIZE_BODY,
              }),
            ],
          }),
        ],
      }),
    ],
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

export async function generarActaInspeccion(
  insp: InspeccionParaActa,
): Promise<Buffer> {
  const ubicacion = [insp.direccion, insp.barrio].filter(Boolean).join(", ");
  const coordenadas =
    insp.lat != null && insp.lng != null
      ? `${insp.lat.toFixed(5)}, ${insp.lng.toFixed(5)}`
      : "";

  const datosTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      fila("Código de acta", insp.codigo),
      fila("Fecha y hora", fechaLarga(insp.fecha)),
      fila("Inspector actuante", `${insp.inspector.nombre} ${insp.inspector.apellido} (DNI ${insp.inspector.dni})`),
      fila("Tipo de inspección", TIPO_INSPECCION_META[insp.tipo].label),
      fila("Servicio inspeccionado", insp.servicio.nombre),
      fila("Prestadora", insp.prestadora?.razonSocial ?? ""),
      fila("Dirección", ubicacion),
      fila("Coordenadas (GPS)", coordenadas),
      fila(
        "Expediente vinculado",
        insp.expediente
          ? `${insp.expediente.numero} — ${insp.expediente.caratula}`
          : "",
      ),
    ],
  });

  const children: (Paragraph | Table)[] = [];

  // Logo institucional centrado en la carátula (si está disponible)
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
    p(`ACTA DE INSPECCIÓN — ${insp.codigo}`, {
      align: AlignmentType.CENTER,
      bold: true,
      size: SIZE_TITLE,
      spaceAfter: 240,
    }),
    p(insp.titulo, {
      align: AlignmentType.CENTER,
      italic: true,
      size: SIZE_HEADING,
      spaceAfter: 360,
    }),
  );

  // Datos generales
  children.push(heading("Datos del relevamiento"), datosTable);

  // Observaciones (cuerpo principal)
  children.push(heading("Observaciones del inspector"));
  for (const parrafo of insp.observaciones.split(/\n+/).filter((s) => s.trim())) {
    children.push(p(parrafo));
  }

  // Transcripción del audio (si existe)
  if (insp.transcripcionAudio && insp.transcripcionAudio.trim().length) {
    children.push(heading("Transcripción del audio dictado en campo"));
    for (const parrafo of insp.transcripcionAudio
      .split(/\n+/)
      .filter((s) => s.trim())) {
      children.push(p(parrafo));
    }
  }

  // Documental anexa
  if (insp.fotos.length > 0) {
    children.push(heading("Documental anexa"));
    children.push(
      p(
        `Se adjuntan ${insp.fotos.length} ${
          insp.fotos.length === 1 ? "fotografía" : "fotografías"
        } tomadas durante el relevamiento, las cuales forman parte integral de esta acta:`,
      ),
    );
    insp.fotos.forEach((f, i) => {
      const desc = f.descripcion?.trim()
        ? f.descripcion
        : "Fotografía sin descripción";
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: `Foto ${i + 1}. `,
              font: FONT,
              size: SIZE_BODY,
              bold: true,
            }),
            new TextRun({ text: desc, font: FONT, size: SIZE_BODY }),
            new TextRun({
              text: `  (${f.url})`,
              font: FONT,
              size: SIZE_SMALL,
              italics: true,
            }),
          ],
        }),
      );
    });
  }

  // Pie con firmas
  children.push(
    p("", { spaceAfter: 720 }),
    p(
      "En constancia de lo actuado, se firma la presente acta en la fecha indicada.",
      { spaceAfter: 720 },
    ),
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
          text: `${insp.inspector.nombre} ${insp.inspector.apellido}`,
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
          text: `DNI ${insp.inspector.dni} — Inspector ENCOSEP`,
          font: FONT,
          size: SIZE_SMALL,
        }),
      ],
    }),
    p(`Documento generado el ${fechaLarga(new Date())}.`, {
      align: AlignmentType.CENTER,
      italic: true,
      size: SIZE_SMALL,
    }),
  );

  const doc = new Document({
    creator: "ENCOSEP — Portal de Reclamos",
    title: `Acta de inspección ${insp.codigo}`,
    description: insp.titulo,
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
