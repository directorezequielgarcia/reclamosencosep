/**
 * Generación del expediente completo de un Reclamo en formato .docx: datos,
 * descripción, ubicación con mapa, fotos y el historial de eventos —
 * respetando las convenciones del ENCOSEP (Calibri 11 pt, interlineado
 * simple, prosa sin bullets). Soporta formato A4 y OFICIO.
 *
 * `soloVisibleVecino` filtra el historial igual que la vista del vecino en
 * /mis-reclamos: se usa cuando descarga el propio ciudadano, para no
 * exponerle notas internas del equipo del Ente.
 */
import { readFile } from "fs/promises";
import { join } from "path";
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
import { construirMapaEstatico } from "@/lib/mapa-estatico";
import { ESTADO_META } from "@/lib/admin";

export type FormatoDoc = "a4" | "oficio";

type EventoParaDocx = {
  tipo: string;
  estadoNuevo: string | null;
  autorNombre: string | null;
  mensaje: string | null;
  visibleVecino: boolean;
  createdAt: Date;
};

export type ReclamoParaDocx = {
  codigo: string;
  origen: string;
  createdAt: Date;
  estado: keyof typeof ESTADO_META;
  titulo: string;
  descripcion: string;
  servicio: { nombre: string };
  prestadora: { razonSocial: string } | null;
  ciudadano: {
    nombre: string;
    apellido: string;
    dni: string;
    email: string | null;
    telefono: string | null;
  };
  direccion: string;
  barrio: string | null;
  lat: number | null;
  lng: number | null;
  expediente: { numero: string; caratula: string } | null;
  fotos: { url: string }[];
  eventos: EventoParaDocx[];
};

const FONT = "Calibri";
const SIZE_BODY = 22; // 11 pt
const SIZE_HEADING = 28; // 14 pt
const SIZE_TITLE = 36; // 18 pt
const SIZE_SMALL = 18; // 9 pt

// Tamaños de página en TWIPs (1 pulgada = 1440 TWIPs)
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
              new TextRun({ text: label, font: FONT, size: SIZE_BODY, bold: true }),
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
              new TextRun({ text: value || "—", font: FONT, size: SIZE_BODY }),
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

/** Descarga o lee desde filesystem la imagen y la devuelve como buffer. */
async function fetchFotoBuffer(
  url: string,
): Promise<{ data: Uint8Array; type: "jpg" | "png" } | null> {
  try {
    let buffer: Buffer;
    let ext = "jpg";

    if (url.startsWith("/")) {
      buffer = await readFile(join(process.cwd(), "public", url));
      const parts = url.split(".");
      ext = parts[parts.length - 1]?.toLowerCase() ?? "jpg";
    } else {
      const res = await fetch(url);
      if (!res.ok) return null;
      buffer = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get("content-type") ?? "";
      ext = ct.includes("png") ? "png" : "jpg";
    }

    const type: "jpg" | "png" = ext === "png" ? "png" : "jpg";
    return { data: new Uint8Array(buffer), type };
  } catch {
    return null;
  }
}

const TIPO_EVENTO_LABEL: Record<string, string> = {
  CREACION: "Reclamo registrado",
  CAMBIO_ESTADO: "Cambio de estado",
  ASIGNACION: "Asignación / derivación",
  COMENTARIO: "Comentario",
  ADJUNTO: "Adjunto agregado",
  NOTIFICACION: "Notificación",
};

export async function generarReclamoDocx(
  reclamo: ReclamoParaDocx,
  formato: FormatoDoc = "a4",
  soloVisibleVecino = false,
): Promise<Buffer> {
  const pageSize = formato === "oficio" ? PAGE_OFICIO : PAGE_A4;
  const ubicacion = [reclamo.direccion, reclamo.barrio].filter(Boolean).join(", ");
  const coordenadas =
    reclamo.lat != null && reclamo.lng != null
      ? `${reclamo.lat.toFixed(5)}, ${reclamo.lng.toFixed(5)}`
      : "";

  const eventos = soloVisibleVecino
    ? reclamo.eventos.filter(
        (e) =>
          ["CREACION", "CAMBIO_ESTADO", "ASIGNACION", "NOTIFICACION", "ADJUNTO"].includes(
            e.tipo,
          ) || (e.tipo === "COMENTARIO" && e.visibleVecino),
      )
    : reclamo.eventos;

  const datosTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      fila("Código de reclamo", reclamo.codigo),
      fila("Origen", reclamo.origen === "WHATSAPP" ? "WhatsApp" : "Portal web"),
      fila("Fecha de ingreso", fechaLarga(reclamo.createdAt)),
      fila("Estado actual", ESTADO_META[reclamo.estado]?.label ?? reclamo.estado),
      fila("Servicio", reclamo.servicio.nombre),
      fila("Prestadora", reclamo.prestadora?.razonSocial ?? "Sin asignar"),
      fila(
        "Vecino reclamante",
        `${reclamo.ciudadano.nombre} ${reclamo.ciudadano.apellido} (DNI ${reclamo.ciudadano.dni})`,
      ),
      fila(
        "Contacto",
        [reclamo.ciudadano.email, reclamo.ciudadano.telefono].filter(Boolean).join(" · "),
      ),
      fila("Dirección", ubicacion),
      fila("Coordenadas (GPS)", coordenadas),
      fila(
        "Expediente vinculado",
        reclamo.expediente
          ? `${reclamo.expediente.numero} — ${reclamo.expediente.caratula}`
          : "",
      ),
    ],
  });

  const children: (Paragraph | Table)[] = [];

  // Logo institucional
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
    p(`RECLAMO — ${reclamo.codigo}`, {
      align: AlignmentType.CENTER,
      bold: true,
      size: SIZE_TITLE,
      spaceAfter: 240,
    }),
    p(reclamo.titulo, {
      align: AlignmentType.CENTER,
      italic: true,
      size: SIZE_HEADING,
      spaceAfter: 360,
    }),
  );

  // Datos generales
  children.push(heading("Datos del reclamo"), datosTable);

  // Descripción
  children.push(heading("Descripción del vecino"));
  for (const parrafo of reclamo.descripcion.split(/\n+/).filter((s) => s.trim())) {
    children.push(p(parrafo));
  }

  // Ubicación + mapa
  if (reclamo.lat != null && reclamo.lng != null) {
    children.push(heading("Ubicación"));
    children.push(p(ubicacion || "—", { spaceAfter: 120 }));
    const mapa = await construirMapaEstatico(reclamo.lat, reclamo.lng);
    if (mapa) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new ImageRun({
              type: "svg",
              data: Buffer.from(mapa.svg, "utf-8"),
              fallback: {
                type: "png",
                data: new Uint8Array(mapa.fallbackPng),
              },
              transformation: { width: 420, height: 280 },
            }),
          ],
        }),
        p(`Coordenadas GPS: ${coordenadas} · Mapa: © OpenStreetMap contributors`, {
          align: AlignmentType.CENTER,
          italic: true,
          size: SIZE_SMALL,
          spaceAfter: 240,
        }),
      );
    }
  }

  // Documental fotográfica
  if (reclamo.fotos.length > 0) {
    children.push(heading("Documental fotográfica"));
    children.push(
      p(
        `Se adjuntan ${reclamo.fotos.length} ${
          reclamo.fotos.length === 1 ? "fotografía" : "fotografías"
        } cargadas junto al reclamo:`,
        { spaceAfter: 240 },
      ),
    );

    for (let i = 0; i < reclamo.fotos.length; i++) {
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 80 },
          children: [
            new TextRun({ text: `Foto ${i + 1}`, font: FONT, size: SIZE_BODY, bold: true }),
          ],
        }),
      );

      const imgData = await fetchFotoBuffer(reclamo.fotos[i].url);
      if (imgData) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new ImageRun({
                data: imgData.data,
                transformation: { width: 400, height: 300 },
                type: imgData.type,
              }),
            ],
          }),
        );
      } else {
        children.push(
          p(`[imagen no disponible — ${reclamo.fotos[i].url}]`, {
            italic: true,
            size: SIZE_SMALL,
            spaceAfter: 160,
          }),
        );
      }
    }
  }

  // Historial
  children.push(heading(`Historial del trámite (${eventos.length})`));
  if (eventos.length === 0) {
    children.push(p("Sin movimientos registrados.", { italic: true }));
  }
  for (const ev of eventos) {
    const etiqueta = TIPO_EVENTO_LABEL[ev.tipo] ?? ev.tipo;
    const estadoTxt = ev.estadoNuevo
      ? ` → ${ESTADO_META[ev.estadoNuevo as keyof typeof ESTADO_META]?.label ?? ev.estadoNuevo}`
      : "";
    const autorTxt = ev.autorNombre ? ` — ${ev.autorNombre}` : "";
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 40 },
        children: [
          new TextRun({
            text: `${fechaLarga(ev.createdAt)} · ${etiqueta}${estadoTxt}${autorTxt}`,
            font: FONT,
            size: SIZE_BODY,
            bold: true,
          }),
        ],
      }),
    );
    if (ev.mensaje) {
      children.push(p(ev.mensaje, { spaceAfter: 120 }));
    }
    if (ev.tipo === "COMENTARIO" && !soloVisibleVecino) {
      children.push(
        p(ev.visibleVecino ? "(Visible para el vecino)" : "(Nota interna del Ente)", {
          italic: true,
          size: SIZE_SMALL,
          spaceAfter: 120,
        }),
      );
    }
  }

  // Pie
  children.push(
    p("", { spaceAfter: 480 }),
    p(
      `Documento generado el ${fechaLarga(new Date())}. Formato: ${
        formato === "oficio" ? "OFICIO (8,5″ × 13″)" : "A4 (21 × 29,7 cm)"
      }.`,
      { align: AlignmentType.CENTER, italic: true, size: SIZE_SMALL },
    ),
  );

  const doc = new Document({
    creator: "ENCOSEP — Portal de Reclamos",
    title: `Reclamo ${reclamo.codigo}`,
    description: reclamo.titulo,
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
