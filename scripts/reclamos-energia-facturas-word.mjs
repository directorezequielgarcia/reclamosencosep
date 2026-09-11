import { PrismaClient } from "@prisma/client";
import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { writeFileSync, mkdirSync } from "node:fs";

const p = new PrismaClient();

const CODIGOS = ["E-7638", "E-9874", "E-6125", "E-7656", "E-4772"];

const NAVY = "1d3550";
const ORANGE = "e88a3c";
const FONT = "Calibri";
const SIZE_BODY = 22; // 11pt
const SIZE_SMALL = 18; // 9pt

function h1(t) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: t, bold: true, size: 36, color: NAVY, font: FONT })],
    spacing: { before: 240, after: 180 },
  });
}
function h2(t) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text: t, bold: true, size: 28, color: NAVY, font: FONT })],
    spacing: { before: 320, after: 120 },
  });
}
function kv(k, v) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${k}: `, bold: true, size: SIZE_BODY, font: FONT }),
      new TextRun({ text: v ?? "-", size: SIZE_BODY, font: FONT }),
    ],
    spacing: { after: 60 },
  });
}
function label(t, color) {
  return new Paragraph({
    children: [new TextRun({ text: t, bold: true, size: SIZE_BODY, font: FONT, color: color ?? ORANGE })],
    spacing: { before: 160, after: 80 },
  });
}
function body(t) {
  return new Paragraph({
    children: [new TextRun({ text: t, size: SIZE_BODY, font: FONT })],
    spacing: { after: 120, line: 280 },
  });
}
function link(url) {
  return new Paragraph({
    children: [
      new ExternalHyperlink({
        link: url,
        children: [
          new TextRun({ text: url, size: SIZE_SMALL, font: FONT, color: "0563C1", underline: {} }),
        ],
      }),
    ],
    spacing: { after: 120 },
  });
}

async function fetchBuffer(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("png")) return { data: new Uint8Array(buffer), type: "png", isImage: true, buffer };
    if (ct.includes("jpeg") || ct.includes("jpg")) return { data: new Uint8Array(buffer), type: "jpg", isImage: true, buffer };
    const ext = ct.includes("pdf") ? "pdf" : "bin";
    return { isImage: false, buffer, ext };
  } catch {
    return null;
  }
}

const reclamos = await p.reclamo.findMany({
  where: { codigo: { in: CODIGOS } },
  select: {
    codigo: true,
    titulo: true,
    descripcion: true,
    estado: true,
    createdAt: true,
    direccion: true,
    barrio: true,
    ciudadano: { select: { nombre: true, apellido: true, dni: true, email: true, telefono: true } },
    prestadora: { select: { razonSocial: true } },
    adjuntos: { select: { tipo: true, url: true } },
    eventos: {
      where: { mensaje: { not: null } },
      orderBy: { createdAt: "asc" },
      select: { tipo: true, mensaje: true, visibleVecino: true, createdAt: true, autor: { select: { nombre: true, apellido: true } } },
    },
  },
});

// Respetar el orden pedido (más reciente primero, como en la revisión previa)
reclamos.sort((a, b) => CODIGOS.indexOf(a.codigo) - CODIGOS.indexOf(b.codigo));

const fotosDir = "C:\\Users\\gje_9\\Claude\\01_ENCOSEP\\Reclamos Electricidad - Revision Facturas\\fotos";
mkdirSync(fotosDir, { recursive: true });

const c = [];
c.push(h1("Reclamos de Electricidad por Facturación — DERIVADO / EN_REVISIÓN"));
c.push(
  body(
    "Ficha de trabajo para decidir la respuesta a cada reclamo: comentario del vecino, seguimiento registrado y fotografías/documentos adjuntos. Reclamos filtrados sobre el total de Electricidad (SCPL) que mencionan facturación o tienen adjuntos, en estado DERIVADO o EN_REVISIÓN.",
  ),
);
c.push(kv("Fecha de este relevamiento", new Date().toISOString().slice(0, 10)));
c.push(kv("Total de reclamos", String(reclamos.length)));

let fotoGlobalIdx = 0;

for (const r of reclamos) {
  c.push(h2(`${r.codigo} — ${r.titulo}`));
  c.push(kv("Estado", r.estado));
  c.push(kv("Fecha del reclamo", r.createdAt.toISOString().slice(0, 10)));
  c.push(kv("Vecino", `${r.ciudadano?.nombre ?? ""} ${r.ciudadano?.apellido ?? ""}`.trim()));
  c.push(kv("DNI", r.ciudadano?.dni));
  c.push(kv("Teléfono", r.ciudadano?.telefono));
  c.push(kv("Email", r.ciudadano?.email));
  c.push(kv("Dirección", `${r.direccion}${r.barrio ? " — " + r.barrio : ""}`));
  c.push(kv("Prestadora", r.prestadora?.razonSocial));

  c.push(label("Comentario del vecino (reclamo original):"));
  c.push(body(r.descripcion));

  if (r.eventos.length > 0) {
    c.push(label("Seguimiento registrado:"));
    for (const ev of r.eventos) {
      const autor = ev.autor ? `${ev.autor.nombre} ${ev.autor.apellido}` : "—";
      const vis = ev.visibleVecino ? "visible al vecino" : "nota interna";
      c.push(
        body(
          `[${ev.createdAt.toISOString().slice(0, 10)} · ${ev.tipo} · ${autor} · ${vis}] ${ev.mensaje}`,
        ),
      );
    }
  }

  if (r.adjuntos.length > 0) {
    c.push(label(`Adjuntos (${r.adjuntos.length}):`, NAVY));
    for (let i = 0; i < r.adjuntos.length; i++) {
      const a = r.adjuntos[i];
      const img = await fetchBuffer(a.url);
      if (img && img.isImage) {
        fotoGlobalIdx++;
        const ext = img.type === "png" ? "png" : "jpg";
        const fname = `${r.codigo}_${i + 1}.${ext}`;
        writeFileSync(`${fotosDir}\\${fname}`, img.buffer);
        c.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new ImageRun({
                data: img.data,
                transformation: { width: 380, height: 285 },
                type: img.type,
              }),
            ],
          }),
        );
      } else if (img) {
        // Documento no-imagen (PDF, etc.) — se deja el link y se descarga igual
        const fname = `${r.codigo}_${i + 1}_${a.tipo}.${img.ext ?? "bin"}`;
        writeFileSync(`${fotosDir}\\${fname}`, img.buffer);
        c.push(body(`Documento adjunto (${a.tipo}), no renderizable como imagen — guardado localmente:`));
        c.push(link(a.url));
      } else {
        c.push(body(`[No se pudo descargar el adjunto (${a.tipo})]`));
        c.push(link(a.url));
      }
    }
  }
}

const doc = new Document({
  creator: "ENCOSEP",
  title: "Reclamos Electricidad - Revision Facturas",
  styles: {
    default: {
      document: {
        run: { font: FONT, size: SIZE_BODY },
        paragraph: { spacing: { after: 120, line: 280 } },
      },
    },
  },
  sections: [{ children: c }],
});

const buf = await Packer.toBuffer(doc);
const out = "C:\\Users\\gje_9\\Claude\\01_ENCOSEP\\Reclamos Electricidad - Revision Facturas\\Reclamos Electricidad - Revision Facturas.docx";
writeFileSync(out, buf);
console.log(`Word generado: ${out}`);
console.log(`Fotos descargadas en: ${fotosDir}`);
console.log(`Tamaño doc: ${Math.round(buf.length / 1024)} KB`);

await p.$disconnect();
