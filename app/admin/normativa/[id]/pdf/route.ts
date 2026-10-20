/**
 * GET /admin/normativa/[id]/pdf
 * Descarga el PDF oficial de una norma haciendo de proxy del Digesto
 * Municipal (no se guarda nada). Solo para el equipo interno.
 *
 * Límite de Vercel: una función serverless no puede devolver cuerpos de más
 * de ~4,5 MB. El Digesto no informa Content-Length (ni en HEAD), así que se
 * lee el PDF de a pedazos y, si pesa más de LIMITE_PROXY, se redirige (302) al
 * PDF oficial en vez de pasarlo por acá.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeVerNormativa } from "@/lib/admin";
import { normalizarTexto } from "@/lib/normativa";

export const runtime = "nodejs";
export const maxDuration = 30;

const LIMITE_PROXY = 4_000_000; // bytes
const ESPERA_MS = 15_000;

// Respuesta de error legible (HTML simple) en vez de un archivo roto
function error(status: number, mensaje: string, volver?: string) {
  const html = `<!doctype html><meta charset="utf-8"><title>No se pudo descargar</title>
<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:3rem auto;padding:0 1rem;color:#1b2a4a">
<h1 style="font-size:1.25rem">No se pudo descargar el PDF</h1><p>${mensaje}</p>
${volver ? `<p><a href="${volver}">Abrir el PDF oficial en el Digesto</a></p>` : ""}</body>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// "Ordenanza 14682-2019 - Medidores.pdf", sin tildes ni caracteres raros
function nombreArchivo(n: { tipo: string; numero: string; anio: number; tema: string }): string {
  const tipo = n.tipo === "ORD" ? "Ordenanza" : "Resolucion";
  const tema = normalizarTexto(n.tema)
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50)
    .trim();
  const titulo = tema ? tema.charAt(0).toUpperCase() + tema.slice(1) : "";
  return `${tipo} ${n.numero}-${n.anio}${titulo ? ` - ${titulo}` : ""}.pdf`;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return error(401, "Tenés que iniciar sesión.");
  if (!puedeVerNormativa(session.user.rol)) return error(403, "No tenés acceso a la Normativa.");

  const { id } = await ctx.params;
  const norma = await prisma.norma.findUnique({
    where: { id },
    select: { tipo: true, numero: true, anio: true, tema: true, urlPdf: true },
  });
  if (!norma) return error(404, "No encontramos esa norma.");
  if (!norma.urlPdf) return error(404, "Esta norma no tiene PDF en el Digesto.");

  // Descarga leyendo de a pedazos: el Digesto no informa Content-Length (ni en HEAD),
  // así que se corta y se redirige si el PDF supera LIMITE_PROXY.
  try {
    const resp = await fetch(norma.urlPdf, { signal: AbortSignal.timeout(ESPERA_MS) });
    if (!resp.ok || !resp.body) {
      return error(502, `El Digesto respondió con un error (${resp.status}). Probá de nuevo en unos minutos.`, norma.urlPdf);
    }
    const informado = Number(resp.headers.get("content-length"));
    if (Number.isFinite(informado) && informado > LIMITE_PROXY) {
      await resp.body.cancel();
      return NextResponse.redirect(norma.urlPdf, 302);
    }
    const trozos: Uint8Array[] = [];
    let leidos = 0;
    const lector = resp.body.getReader();
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      leidos += value.length;
      if (leidos > LIMITE_PROXY) {
        // Grande: no entra por una función serverless, se manda al PDF oficial
        await lector.cancel();
        return NextResponse.redirect(norma.urlPdf, 302);
      }
      trozos.push(value);
    }
    const datos = Buffer.concat(trozos);
    if (datos.subarray(0, 5).toString("latin1") !== "%PDF-") {
      return error(502, "El Digesto no devolvió un PDF válido.", norma.urlPdf);
    }
    const nombre = nombreArchivo(norma);
    return new NextResponse(datos, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(datos.length),
        // El nombre es ASCII puro; filename* queda por compatibilidad
        "Content-Disposition": `attachment; filename="${nombre}"; filename*=UTF-8''${encodeURIComponent(nombre)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return error(504, "El Digesto no respondió a tiempo. Probá de nuevo en unos minutos.", norma.urlPdf);
  }
}
