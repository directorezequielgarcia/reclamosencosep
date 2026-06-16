/**
 * Generación de la Nota ENCOSEP de respuesta al análisis de certificaciones.
 * Calibri 11 pt, interlineado simple, alineado justificado — convenciones ENCOSEP.
 */
import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
  Table,
  TableCell,
  TableRow,
  WidthType,
} from "docx";
import type { ServicioKind } from "@prisma/client";

// ─────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────

export type ObservacionSeccion = {
  seccion: string;
  titulo: string;
  texto: string;
};

export type TipoServicioCert = "TRANSPORTE" | "RESIDUOS" | "AGUA" | "ENERGIA";

export const SECCIONES_CERT: Record<TipoServicioCert, { id: string; titulo: string }[]> = {
  TRANSPORTE: [
    { id: "mano_obra", titulo: "a) Mano de Obra" },
    { id: "combustible", titulo: "b) Combustible: Kilometraje y Rendimiento" },
    { id: "cubiertas", titulo: "c) Cubiertas, lubricantes, repuestos y reparaciones" },
    { id: "subsidios", titulo: "d) Subsidios" },
    { id: "ingresos", titulo: "e) Ingresos por venta de pasajes" },
    { id: "amortizacion", titulo: "f) Amortización de Unidades" },
  ],
  RESIDUOS: [
    { id: "recoleccion", titulo: '1. Recolección, Carga, Transporte y Descarga de RSU' },
    { id: "campanas", titulo: "2. Campañas Ambientales" },
    { id: "planta", titulo: "3. Operación y Mantenimiento de la Planta de Tratamiento de RSU" },
    { id: "adicionales", titulo: "4. Servicios Adicionales" },
  ],
  AGUA: [
    { id: "suministro", titulo: "1. Suministro" },
    { id: "calidad", titulo: "2. Calidad del servicio" },
    { id: "infraestructura", titulo: "3. Infraestructura y mantenimiento" },
  ],
  ENERGIA: [
    { id: "suministro", titulo: "1. Suministro eléctrico" },
    { id: "calidad", titulo: "2. Calidad del servicio" },
    { id: "infraestructura", titulo: "3. Infraestructura y mantenimiento" },
  ],
};

/** Mapea los servicios de una prestadora al tipo de certificación. */
export function servicioACertTipo(servicios: { kind: ServicioKind }[]): TipoServicioCert {
  const kinds = servicios.map((s) => s.kind);
  if (kinds.includes("TRANSPORTE")) return "TRANSPORTE";
  if (kinds.includes("RESIDUOS")) return "RESIDUOS";
  if (kinds.includes("AGUA")) return "AGUA";
  return "ENERGIA";
}

// ─────────────────────────────────────────────
// Parámetros de entrada del generador
// ─────────────────────────────────────────────

export type ParamsNotaCertificacion = {
  notaNumero: string;           // "105/2026"
  fecha: Date;
  prestadoraRazonSocial: string;
  periodo: string;              // "2026-03" → se formatea como "marzo de 2026"
  tipoServicio: TipoServicioCert;
  observaciones: ObservacionSeccion[];
  conclusionGeneral: string;
  montoMaximo?: string;         // solo higiene urbana
};

// ─────────────────────────────────────────────
// Helpers de formato
// ─────────────────────────────────────────────

const FONT = "Calibri";
const S_BODY = 22;   // 11 pt
const S_HEAD = 24;   // 12 pt
const S_TITLE = 28;  // 14 pt

function fechaLarga(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function periodoTexto(periodo: string): string {
  if (/^\d{4}-\d{2}$/.test(periodo)) {
    const [anio, mes] = periodo.split("-");
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
    ];
    const idx = Math.max(0, Math.min(11, parseInt(mes, 10) - 1));
    return `${meses[idx]} de ${anio}`;
  }
  if (/^\d{4}$/.test(periodo)) return `año ${periodo}`;
  return periodo;
}

function refServicio(tipo: TipoServicioCert): string {
  const map: Record<TipoServicioCert, string> = {
    TRANSPORTE: "Servicio Transporte Público de Pasajeros",
    RESIDUOS: "Servicio Público de Higiene Urbana",
    AGUA: "Servicio Público de Agua Potable",
    ENERGIA: "Servicio Público de Distribución de Energía Eléctrica",
  };
  return map[tipo];
}

function introServicio(tipo: TipoServicioCert, empresa: string, periodoFmt: string): string {
  const map: Record<TipoServicioCert, string> = {
    TRANSPORTE:
      `Que viene para análisis de este Ente la estructura de costos presentada por la empresa ${empresa} ` +
      `tendiente a la certificación del servicio público de pasajeros prestado en el mes de ${periodoFmt}. ` +
      `Atento las competencias establecidas en el artículo 22, inciso 2° de la Ordenanza Nro. 13.189/17, ` +
      `entendemos que la intervención requerida a este Ente se encuadra en los términos del artículo 4, inciso "d" de la ordenanza antes citada.`,
    RESIDUOS:
      `Con motivo de la remisión del certificado de prestación correspondiente al servicio público de higiene ` +
      `urbana prestado por la concesionaria ${empresa} en el mes de ${periodoFmt}, este Ente de Control procede ` +
      `a realizar el análisis correspondiente en ejercicio de las competencias establecidas en la Ordenanza N° 13.189/17.`,
    AGUA:
      `Con motivo de la remisión de la documentación de certificación del servicio público de agua potable ` +
      `prestado por ${empresa} en el mes de ${periodoFmt}, este Ente procede al análisis conforme Ordenanza N° 13.189/17.`,
    ENERGIA:
      `Con motivo de la remisión de la documentación de certificación del servicio público de energía eléctrica ` +
      `prestado por ${empresa} en el mes de ${periodoFmt}, este Ente procede al análisis conforme Ordenanza N° 13.189/17.`,
  };
  return map[tipo];
}

// ─────────────────────────────────────────────
// Helpers de párrafos
// ─────────────────────────────────────────────

type ParagraphOpts = {
  bold?: boolean;
  italic?: boolean;
  size?: number;
  align?: (typeof AlignmentType)[keyof typeof AlignmentType];
  spaceBefore?: number;
  spaceAfter?: number;
  indent?: number; // twips
};

function p(text: string, opts: ParagraphOpts = {}): Paragraph {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    spacing: {
      before: opts.spaceBefore ?? 0,
      after: opts.spaceAfter ?? 120,
      line: 276,
    },
    indent: opts.indent ? { left: opts.indent } : undefined,
    children: [
      new TextRun({
        text,
        font: FONT,
        size: opts.size ?? S_BODY,
        bold: opts.bold,
        italics: opts.italic,
      }),
    ],
  });
}

function pEmpty(): Paragraph {
  return new Paragraph({
    spacing: { after: 80, line: 276 },
    children: [new TextRun({ text: "", font: FONT, size: S_BODY })],
  });
}

function pBold(text: string, opts: ParagraphOpts = {}): Paragraph {
  return p(text, { ...opts, bold: true });
}

function pCenter(text: string, opts: ParagraphOpts = {}): Paragraph {
  return p(text, { ...opts, align: AlignmentType.CENTER });
}

// ─────────────────────────────────────────────
// Tabla de firmas
// ─────────────────────────────────────────────

function tablaFirmas(): Table {
  const cell = (nombre: string, cargo: string): TableCell =>
    new TableCell({
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 600, after: 80, line: 276 },
          children: [new TextRun({ text: nombre, font: FONT, size: S_BODY, bold: true })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40, line: 276 },
          children: [new TextRun({ text: cargo, font: FONT, size: S_BODY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40, line: 276 },
          children: [new TextRun({ text: "ENCOSEP", font: FONT, size: S_BODY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40, line: 276 },
          children: [new TextRun({ text: "Municipalidad de Comodoro Rivadavia", font: FONT, size: S_BODY })],
        }),
      ],
    });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          cell("Dr. Cristian Serdeiro", "Presidente"),
          cell("Cr. Abog. Ezequiel García", "Vicepresidente"),
          cell("Arq. Maximiliano López", "Vocal"),
        ],
      }),
    ],
  });
}

// ─────────────────────────────────────────────
// Generador principal
// ─────────────────────────────────────────────

export async function generarNotaCertificacion(
  params: ParamsNotaCertificacion,
): Promise<Buffer> {
  const periodoFmt = periodoTexto(params.periodo);
  const fechaFmt = fechaLarga(params.fecha);
  const refSvc = refServicio(params.tipoServicio);
  const introText = introServicio(
    params.tipoServicio,
    params.prestadoraRazonSocial,
    periodoFmt,
  );

  // Secciones con observaciones (filtrar vacías)
  const obsConContenido = params.observaciones.filter((o) => o.texto.trim().length > 0);

  const children: (Paragraph | Table)[] = [];

  // ── Encabezado ──────────────────────────────
  children.push(
    pCenter("Ente de Control de los Servicios Públicos", { size: S_TITLE, bold: true, spaceAfter: 40 }),
    pCenter("ENCOSEP", { size: S_HEAD, bold: true, spaceAfter: 80 }),
  );

  // ── Número de nota y fecha ───────────────────
  children.push(
    pCenter(`NOTA EnCoSeP N°: ${params.notaNumero}`, { size: S_HEAD, bold: true, spaceAfter: 40 }),
    pCenter(`Comodoro Rivadavia, ${fechaFmt}.-`, { spaceAfter: 40 }),
    pCenter(`Ref. ${refSvc}. Certificación ${params.prestadoraRazonSocial} — ${periodoTexto(params.periodo)}.`, {
      bold: true,
      spaceAfter: 120,
    }),
  );

  // ── Destinatario ─────────────────────────────
  children.push(
    pBold("A:  SECRETARÍA DE GOBIERNO, MODERNIZACIÓN Y TRANSPARENCIA", {
      spaceBefore: 120,
      spaceAfter: 200,
    }),
    p("De nuestra consideración:", { spaceAfter: 160 }),
  );

  // ── Introducción ─────────────────────────────
  children.push(
    p(introText, { indent: 720, spaceAfter: 160 }),
  );

  // ── Observaciones por sección ─────────────────
  if (obsConContenido.length > 0) {
    children.push(
      p("Del análisis realizado del presente certificado y de su documentación anexa, podemos efectuar las siguientes consideraciones:", {
        indent: 720,
        spaceAfter: 160,
      }),
    );

    for (const obs of obsConContenido) {
      children.push(
        pBold(obs.titulo, { spaceBefore: 200, spaceAfter: 80 }),
      );
      // El texto puede tener saltos de línea — los dividimos en párrafos
      const lineas = obs.texto.split("\n").filter((l) => l.trim().length > 0);
      for (const linea of lineas) {
        children.push(p(linea, { indent: 720, spaceAfter: 100 }));
      }
    }
  }

  // ── Conclusión general ────────────────────────
  children.push(pEmpty());

  if (params.tipoServicio === "RESIDUOS" && params.montoMaximo) {
    children.push(
      p(
        `De lo precitado este ente de contralor concluye que las observaciones de autoridad de aplicación, ` +
        `conforme el certificado correspondiente al período ${periodoFmt}, están correctamente fundadas, ` +
        `por lo que el monto del certificado no deberá superar el total de ${params.montoMaximo}.`,
        { indent: 720, spaceAfter: 120 },
      ),
    );
  } else if (params.conclusionGeneral.trim()) {
    children.push(
      p(params.conclusionGeneral, { indent: 720, spaceAfter: 120 }),
    );
  } else {
    children.push(
      p(
        `En base al análisis efectuado de la información remitida, con las consideraciones y aclaraciones ` +
        `desarrolladas, y sin perjuicio del carácter no vinculante del presente, es necesario contar con una ` +
        `mejora constante y sostenida de la información, documentación respaldatoria y comprobantes que ` +
        `permitan a este Ente de Control realizar un mejor aporte al análisis de las sucesivas certificaciones.`,
        { indent: 720, spaceAfter: 120 },
      ),
    );
  }

  // ── Cierre ────────────────────────────────────
  children.push(
    pEmpty(),
    p(`Sin otro particular, saludamos a Ud. muy atentamente.`, {
      align: AlignmentType.CENTER,
      spaceAfter: 40,
    }),
    p(`Comodoro Rivadavia, ${fechaFmt}.-`, {
      align: AlignmentType.CENTER,
      spaceAfter: 200,
    }),
  );

  // ── Firmas ────────────────────────────────────
  children.push(tablaFirmas());

  // ── Pie ───────────────────────────────────────
  children.push(
    pEmpty(),
    pCenter("Ente de Control de los Servicios Públicos", {
      size: 18,
      spaceAfter: 40,
    }),
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
