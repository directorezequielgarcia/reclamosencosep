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
import { readFile } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { cargarLogoBuffer } from "@/lib/docx-logo";
import { construirMapaEstatico } from "@/lib/mapa-estatico";

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
    origen: string;
    ingresoEn: Date;
    servicio: string;
    titulo: string;
    descripcion: string;
    ubicacion: string;
    lat: number | null;
    lng: number | null;
    ciudadano: {
      nombre: string;
      dni: string;
      email: string | null;
      telefono: string | null;
    };
    fotos: string[];
    otros: { tipo: string; url: string }[];
  }[];
  actos: {
    tipoLabel: string;
    titulo: string;
    cuerpo: string;
    creadoEn: Date;
    adjuntos: { nombre: string; url: string; esImagen: boolean }[];
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

/** Lee la imagen (disco o URL), la normaliza a JPG y calcula su tamaño en el documento. */
async function imagenParaDocx(url: string): Promise<{
  data: Uint8Array;
  width: number;
  height: number;
} | null> {
  try {
    const buf = url.startsWith("/")
      ? await readFile(join(process.cwd(), "public", url))
      : Buffer.from(await (await fetch(url)).arrayBuffer());
    const { data, info } = await sharp(buf, { failOn: "none" })
      .rotate()
      .resize({ width: 1400, withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    const esc = Math.min(430 / info.width, 520 / info.height, 1);
    return {
      data: new Uint8Array(data),
      width: Math.round(info.width * esc),
      height: Math.round(info.height * esc),
    };
  } catch {
    return null;
  }
}

async function figura(url: string, leyenda: string): Promise<Paragraph[]> {
  const im = await imagenParaDocx(url);
  if (!im) {
    return [
      p(`[imagen no disponible — ${url}] ${leyenda}`, {
        italic: true,
        size: SMALL,
        align: AlignmentType.LEFT,
      }),
    ];
  }
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      keepNext: true,
      spacing: { before: 160, after: 40 },
      children: [
        new ImageRun({
          data: im.data,
          type: "jpg",
          transformation: { width: im.width, height: im.height },
        }),
      ],
    }),
    p(leyenda, {
      align: AlignmentType.CENTER,
      italic: true,
      size: SMALL,
      after: 200,
    }),
  ];
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

  // Reclamo inicial del vecino: datos, descripción y ubicación con mapa
  for (const r of e.reclamos) {
    children.push(
      p(`RECLAMO INICIAL ${r.codigo}`, {
        bold: true,
        size: SMALL,
        align: AlignmentType.LEFT,
        before: 320,
        after: 40,
      }),
      p(r.titulo, { bold: true, align: AlignmentType.LEFT, after: 80 }),
      campo(
        "Ingreso",
        `${fechaLarga(r.ingresoEn, true)} (${r.origen === "WHATSAPP" ? "WhatsApp" : "portal web"})`,
      ),
      campo("Servicio", r.servicio),
      campo(
        "Vecino reclamante",
        `${r.ciudadano.nombre} (DNI ${r.ciudadano.dni})`,
      ),
      campo(
        "Contacto",
        [r.ciudadano.email, r.ciudadano.telefono].filter(Boolean).join(" · "),
      ),
      campo("Ubicación", r.ubicacion),
      p("Descripción del vecino:", {
        bold: true,
        align: AlignmentType.LEFT,
        before: 80,
        after: 60,
      }),
      ...cuerpoParrafos(r.descripcion),
    );
    if (r.lat != null && r.lng != null) {
      const mapa = await construirMapaEstatico(r.lat, r.lng);
      if (mapa) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 40 },
            children: [
              new ImageRun({
                type: "svg",
                data: Buffer.from(mapa.svg, "utf-8"),
                fallback: { type: "png", data: new Uint8Array(mapa.fallbackPng) },
                transformation: { width: 420, height: 280 },
              }),
            ],
          }),
          p(
            `Coordenadas GPS: ${r.lat.toFixed(5)}, ${r.lng.toFixed(5)} · Mapa: © OpenStreetMap contributors`,
            { align: AlignmentType.CENTER, italic: true, size: SMALL },
          ),
        );
      }
    }
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
        p(`Documental adjunta: ${a.adjuntos.map((x) => x.nombre).join("; ")}.`, {
          size: SMALL,
          before: 120,
        }),
      );
      for (const adj of a.adjuntos.filter((x) => x.esImagen)) {
        children.push(...(await figura(adj.url, adj.nombre)));
      }
      for (const adj of a.adjuntos.filter((x) => !x.esImagen)) {
        children.push(
          p(`${adj.nombre}: ${adj.url}`, {
            size: SMALL,
            align: AlignmentType.LEFT,
          }),
        );
      }
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

  // Anexo: documental aportada por el vecino al presentar el reclamo
  const conAnexo = e.reclamos.filter((r) => r.fotos.length || r.otros.length);
  if (conAnexo.length > 0) {
    children.push(
      new Paragraph({ children: [new PageBreak()] }),
      p("Anexo — Documental aportada por el reclamante", {
        bold: true,
        size: 28,
        align: AlignmentType.LEFT,
        after: 80,
      }),
      p("Material adjuntado por el reclamante al presentar el reclamo.", {
        italic: true,
        size: SMALL,
        align: AlignmentType.LEFT,
        after: 200,
      }),
    );
    for (const r of conAnexo) {
      for (let i = 0; i < r.fotos.length; i++) {
        children.push(
          ...(await figura(r.fotos[i], `Imagen ${i + 1} — Reclamo ${r.codigo}`)),
        );
      }
      for (const o of r.otros) {
        children.push(
          p(`${o.tipo} — Reclamo ${r.codigo}: ${o.url}`, {
            size: SMALL,
            align: AlignmentType.LEFT,
          }),
        );
      }
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
