/**
 * Exportación del expediente a .docx (equivalente Word de la vista
 * "Emitir expediente"): carátula con número (manual o del sistema), reclamo
 * origen (título, descripción y ubicación) y una foja por cada acto.
 * Convenciones ENCOSEP: Calibri 11, interlineado simple, prosa sin bullets.
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  PageNumber,
  Packer,
  PageBreak,
  Paragraph,
  TabStopType,
  TextRun,
} from "docx";
import { cargarLogoBuffer } from "@/lib/docx-logo";

export type ExpedienteParaDocx = {
  nro: string;
  anio: string;
  tipoExpediente: string;
  caratula: string;
  asunto: string;
  prestadora: string;
  reclamante: string;
  intervinientes: string | null;
  iniciadoEn: Date;
  reclamos: {
    codigo: string;
    titulo: string;
    descripcion: string;
    ubicacion: string;
  }[];
  actos: {
    tipoLabel: string;
    titulo: string;
    cuerpo: string;
    creadoEn: Date;
    adjuntos: string[];
    firmas: boolean;
    notificado: string | null;
  }[];
};

const FONT = "Calibri";
const BODY = 22;
const SMALL = 18;
const PAGE_A4 = { width: 11906, height: 16838 };
const PAGE_OFICIO = { width: 12240, height: 20160 }; // 21,6 × 35,6 cm

function fechaLarga(d: Date, conHora = false): string {
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...(conHora ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function p(
  text: string,
  o: {
    bold?: boolean;
    italic?: boolean;
    size?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    after?: number;
    before?: number;
  } = {},
): Paragraph {
  return new Paragraph({
    alignment: o.align ?? AlignmentType.JUSTIFIED,
    spacing: { before: o.before ?? 0, after: o.after ?? 120 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: o.size ?? BODY,
        bold: o.bold,
        italics: o.italic,
      }),
    ],
  });
}

function campo(label: string, valor: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label}: `, font: FONT, size: BODY, bold: true }),
      new TextRun({ text: valor || "—", font: FONT, size: BODY }),
    ],
  });
}

function cuerpoParrafos(texto: string): Paragraph[] {
  return texto
    .split(/\n+/)
    .filter((l) => l.trim())
    .map((l) => p(l));
}

export async function generarExpedienteDocx(
  e: ExpedienteParaDocx,
  hoja: "a4" | "oficio",
): Promise<Buffer> {
  const size = hoja === "oficio" ? PAGE_OFICIO : PAGE_A4;
  const children: Paragraph[] = [];

  const logo = await cargarLogoBuffer();
  if (logo) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
        children: [
          new ImageRun({
            data: new Uint8Array(logo),
            transformation: { width: 110, height: 110 },
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
      after: 40,
    }),
    p("COMODORO RIVADAVIA · CHUBUT", {
      align: AlignmentType.CENTER,
      size: SMALL,
      after: 360,
    }),
    p(`EXPEDIENTE N° ${e.nro}/${e.anio}`, {
      align: AlignmentType.CENTER,
      bold: true,
      size: 40,
      after: 60,
    }),
    p(e.tipoExpediente, {
      align: AlignmentType.CENTER,
      italic: true,
      after: 320,
    }),
    campo("Carátula", e.caratula),
    campo("Objeto", e.asunto),
    campo("Prestadora", e.prestadora),
    campo("Reclamante", e.reclamante),
  );
  if (e.intervinientes) children.push(campo("Intervinientes", e.intervinientes));

  // Reclamo origen: título, descripción y ubicación
  for (const r of e.reclamos) {
    children.push(
      p(`RECLAMO ${r.codigo}`, {
        bold: true,
        size: SMALL,
        align: AlignmentType.LEFT,
        before: 280,
        after: 40,
      }),
      p(r.titulo, { bold: true, align: AlignmentType.LEFT, after: 80 }),
      ...cuerpoParrafos(r.descripcion),
      campo("Ubicación", r.ubicacion),
    );
  }

  children.push(
    p(`Iniciado el ${fechaLarga(e.iniciadoEn)}`, {
      align: AlignmentType.CENTER,
      size: SMALL,
      before: 320,
    }),
  );

  // Una foja por acto, en hoja nueva
  for (const a of e.actos) {
    children.push(
      new Paragraph({ children: [new PageBreak()] }),
      p(a.tipoLabel.toUpperCase(), {
        size: SMALL,
        align: AlignmentType.LEFT,
        after: 40,
      }),
      p(a.titulo, { bold: true, size: 28, align: AlignmentType.LEFT, after: 40 }),
      p(fechaLarga(a.creadoEn, true), {
        size: SMALL,
        italic: true,
        align: AlignmentType.LEFT,
        after: 200,
      }),
      ...cuerpoParrafos(a.cuerpo),
    );
    if (a.adjuntos.length > 0) {
      children.push(
        p(`Documental adjunta: ${a.adjuntos.join("; ")}.`, {
          size: SMALL,
          before: 120,
        }),
      );
    }
    if (a.firmas) {
      children.push(
        new Paragraph({
          spacing: { before: 1200 },
          tabStops: [
            { type: TabStopType.LEFT, position: 3400 },
            { type: TabStopType.LEFT, position: 6800 },
          ],
          children: [
            new TextRun({
              text: "Presidente\tVicepresidente\tVocal",
              font: FONT,
              size: SMALL,
            }),
          ],
        }),
      );
    }
    if (a.notificado) {
      children.push(
        new Paragraph({
          spacing: { before: 200 },
          border: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "BBBBBB", space: 4 },
          },
          children: [
            new TextRun({
              text: a.notificado,
              font: FONT,
              size: SMALL,
            }),
          ],
        }),
      );
    }
  }

  const doc = new Document({
    creator: "ENCOSEP — Portal de Reclamos",
    title: `Expediente ${e.nro}/${e.anio}`,
    sections: [
      {
        properties: {
          page: {
            size: { width: size.width, height: size.height },
            margin: { top: 1134, right: 1247, bottom: 1134, left: 1247 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                tabStops: [{ type: TabStopType.RIGHT, position: 9400 }],
                border: {
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "BBBBBB", space: 2 },
                },
                children: [
                  new TextRun({
                    text: `Expte. N° ${e.nro}/${e.anio}\tFoja N° `,
                    font: FONT,
                    size: SMALL,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT,
                    size: SMALL,
                    bold: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: { default: new Footer({ children: [new Paragraph("")] }) },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
