/**
 * Informe Mensual del Estado de los Servicios Públicos (.docx).
 *
 * Estructura literal del art. 5° inc. k de la Ord. 13.189/17 con las 7
 * secciones obligatorias. Replica el formato de los informes en Word del
 * usuario (Calibri 11 pt, interlineado simple, prosa sin bullets, subsecciones
 * por servicio en las secciones 1, 2 y 3).
 */
import {
  AlignmentType,
  Document,
  HeadingLevel,
  PageOrientation,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { BloquesInforme } from "@/lib/informe-mensual-borrador";

const FONT = "Calibri";
const SIZE_BODY = 22; // 11 pt
const SIZE_HEADING_1 = 28; // 14 pt
const SIZE_HEADING_2 = 24; // 12 pt
const SIZE_TITLE = 34; // 17 pt
const SIZE_SMALL = 18; // 9 pt

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

// Mapeo del enum ServicioKind a la frase que aparece en el informe.
const NOMBRE_SERVICIO_EN_INFORME: Record<string, string> = {
  RESIDUOS: "higiene urbana",
  ENERGIA: "distribución de energía eléctrica y alumbrado público",
  AGUA: "distribución de agua potable, saneamiento y cloacas",
  TRANSPORTE: "transporte público de pasajeros",
};

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
    spacing: { after: opts.spaceAfter ?? 120, line: 276 }, // ≈ interlineado simple
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

function headingSeccion(numero: number, titulo: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [
      new TextRun({
        text: `${numero}.- ${titulo}`,
        font: FONT,
        size: SIZE_HEADING_1,
        bold: true,
      }),
    ],
  });
}

function headingServicio(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: SIZE_HEADING_2,
        bold: true,
      }),
    ],
  });
}

/** Convierte un bloque de texto multilínea en párrafos separados. */
function bloqueAParrafos(texto: string): Paragraph[] {
  return texto
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => p(s));
}

export type DatosDocxInforme = {
  anio: number;
  mes: number;
  bloques: BloquesInforme;
  emisor?: { nombre: string; apellido: string; rol: string } | null;
  emitidoEn?: Date | null;
};

export async function generarDocxInformeMensual(
  datos: DatosDocxInforme,
): Promise<Buffer> {
  const { anio, mes, bloques, emisor, emitidoEn } = datos;
  const children: Paragraph[] = [];

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
    p("INFORME MENSUAL DEL ESTADO DE LOS SERVICIOS PÚBLICOS", {
      align: AlignmentType.CENTER,
      bold: true,
      size: SIZE_TITLE,
      spaceAfter: 120,
    }),
    p(`${MESES[mes - 1]} de ${anio}`, {
      align: AlignmentType.CENTER,
      italic: true,
      size: SIZE_HEADING_2,
      spaceAfter: 360,
    }),
  );

  if (bloques.seccion1.intro && bloques.seccion1.intro.trim().length) {
    children.push(...bloqueAParrafos(bloques.seccion1.intro));
  }

  // Sección 1
  children.push(headingSeccion(1, "Situación general de la prestación."));
  for (const kind of Object.keys(bloques.seccion1.porServicio)) {
    const nombre = NOMBRE_SERVICIO_EN_INFORME[kind] ?? kind.toLowerCase();
    children.push(headingServicio(`Del servicio de ${nombre}:`));
    children.push(...bloqueAParrafos(bloques.seccion1.porServicio[kind] ?? ""));
  }

  // Sección 2
  children.push(
    headingSeccion(
      2,
      "Detalle de las irregularidades detectadas con informe circunstanciado.",
    ),
  );
  for (const kind of Object.keys(bloques.seccion2.porServicio)) {
    const nombre = NOMBRE_SERVICIO_EN_INFORME[kind] ?? kind.toLowerCase();
    children.push(headingServicio(`Servicio de ${nombre}:`));
    children.push(...bloqueAParrafos(bloques.seccion2.porServicio[kind] ?? ""));
  }

  // Sección 3
  children.push(
    headingSeccion(
      3,
      "Detalle de las alteraciones originadas en la prestación que afectan a la comunidad y/o usuarios con indicación geográfica de su ocurrencia y/o información.",
    ),
  );
  for (const kind of Object.keys(bloques.seccion3.porServicio)) {
    const nombre = NOMBRE_SERVICIO_EN_INFORME[kind] ?? kind.toLowerCase();
    children.push(headingServicio(`Servicio de ${nombre}:`));
    children.push(...bloqueAParrafos(bloques.seccion3.porServicio[kind] ?? ""));
  }

  // Sección 4
  children.push(
    headingSeccion(
      4,
      "Detalle de repeticiones ocurridas en el mes de los sucesos enumerados en los puntos 2 y 3.",
    ),
  );
  children.push(...bloqueAParrafos(bloques.seccion4 || ""));

  // Sección 5
  children.push(
    headingSeccion(
      5,
      "Información cursada y recibida del concesionario o prestador responsable del servicio respecto de los hechos ocurridos y cumplimiento de las medidas indicadas por el Ente de Control de los Servicios Públicos.",
    ),
  );
  children.push(...bloqueAParrafos(bloques.seccion5 || ""));

  // Sección 6
  children.push(
    headingSeccion(
      6,
      "Evaluación de la conducta del concesionario o prestador de cada uno de los servicios sujetos a control.",
    ),
  );
  children.push(...bloqueAParrafos(bloques.seccion6 || ""));

  // Sección 7
  children.push(
    headingSeccion(
      7,
      "Copia de los registros de los hechos relevados en el mes con indicación de la/s corrección/es del/los mismo/s o porcentaje de avance en su remediación.",
    ),
  );
  children.push(...bloqueAParrafos(bloques.seccion7 || ""));

  // Pie con emisor
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
            text: `Directorio del ENCOSEP — Comodoro Rivadavia`,
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
        {
          align: AlignmentType.CENTER,
          italic: true,
          size: SIZE_SMALL,
        },
      ),
    );
  } else {
    children.push(
      p(`Borrador generado el ${new Date().toLocaleString("es-AR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} — no es informe oficial.`, {
        align: AlignmentType.CENTER,
        italic: true,
        size: SIZE_SMALL,
      }),
    );
  }

  const doc = new Document({
    creator: "ENCOSEP — Portal de Reclamos",
    title: `Informe Mensual ${MESES[mes - 1]} ${anio}`,
    description: `Informe Mensual del Estado de los Servicios Públicos (art. 5° inc. k Ord. 13.189/17) — ${MESES[mes - 1]} ${anio}`,
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
