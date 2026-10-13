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

type ImagenDocx =
  | { ok: true; data: Uint8Array; type: "jpg" | "png"; width: number; height: number }
  | { ok: false; motivo: string };

/** Tamaño en píxeles leyendo la cabecera de un PNG o JPEG (sin dependencias). */
function medirImagen(buf: Buffer): { type: "jpg" | "png"; w: number; h: number } | null {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { type: "png", w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const m = buf[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) {
        return { type: "jpg", h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

const MAX_W = 430;
const MAX_H = 520;

/** Lee la imagen (disco o URL). Intenta reducirla con sharp; si no puede, usa el original. */
async function imagenParaDocx(url: string): Promise<ImagenDocx> {
  let buf: Buffer;
  try {
    if (url.startsWith("/")) {
      buf = await readFile(join(process.cwd(), "public", url));
    } else {
      const res = await fetch(url);
      if (!res.ok) return { ok: false, motivo: `descarga HTTP ${res.status}` };
      buf = Buffer.from(await res.arrayBuffer());
    }
  } catch (err) {
    return { ok: false, motivo: `descarga: ${err instanceof Error ? err.message : err}` };
  }

  let motivoSharp = "";
  try {
    const sharp = (await import("sharp")).default;
    const { data, info } = await sharp(buf, { failOn: "none" })
      .rotate()
      .resize({ width: 1400, withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    const esc = Math.min(MAX_W / info.width, MAX_H / info.height, 1);
    return {
      ok: true,
      data: new Uint8Array(data),
      type: "jpg",
      width: Math.round(info.width * esc),
      height: Math.round(info.height * esc),
    };
  } catch (err) {
    motivoSharp = err instanceof Error ? err.message : String(err);
  }

  // Respaldo: el original, solo si es PNG/JPEG y no es pesado (límite de respuesta de Vercel).
  const dim = medirImagen(buf);
  if (dim && buf.length <= 900_000) {
    const esc = Math.min(MAX_W / dim.w, MAX_H / dim.h, 1);
    return {
      ok: true,
      data: new Uint8Array(buf),
      type: dim.type,
      width: Math.round(dim.w * esc),
      height: Math.round(dim.h * esc),
    };
  }
  return { ok: false, motivo: `sharp: ${motivoSharp}` };
}

type CacheImg = Map<string, Promise<ImagenDocx>>;

async function figura(
  url: string,
  leyenda: string,
  cache: CacheImg,
): Promise<Paragraph[]> {
  const im = await (cache.get(url) ?? imagenParaDocx(url));
  if (!im.ok) {
    return [
      p(`[imagen no disponible (${im.motivo}) — ${url}] ${leyenda}`, {
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
          type: im.type,
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
  // Las imágenes se descargan y procesan todas en paralelo (el límite de la función serverless es corto).
  const cache: CacheImg = new Map();
  const urls = [
    ...e.actos.flatMap((a) => a.adjuntos.filter((x) => x.esImagen).map((x) => x.url)),
    ...e.reclamos.flatMap((r) => r.fotos),
  ];
  for (const u of urls) if (!cache.has(u)) cache.set(u, imagenParaDocx(u));
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
        children.push(...(await figura(adj.url, adj.nombre, cache)));
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
          ...(await figura(r.fotos[i], `Imagen ${i + 1} — Reclamo ${r.codigo}`, cache)),
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
