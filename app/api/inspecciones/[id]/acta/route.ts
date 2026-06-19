/**
 * GET /api/inspecciones/[id]/acta
 * Genera el Acta de Inspección en .docx y la devuelve como descarga directa.
 * Solo accesible para roles que gestionan inspecciones.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeVerInspecciones } from "@/lib/admin";
import { whereInspeccionesByRol } from "@/lib/inspecciones";
import { generarActaInspeccion, type FormatoActa } from "@/lib/docx-acta-inspeccion";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || !puedeVerInspecciones(session.user.rol)) {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const { id } = await params;
  const url = new URL(req.url);
  const formato: FormatoActa =
    url.searchParams.get("formato") === "oficio" ? "oficio" : "a4";
  const visibilidadWhere = whereInspeccionesByRol(
    session.user.rol,
    session.user.id,
  );
  const insp = await prisma.inspeccion.findFirst({
    where: { AND: [{ id }, visibilidadWhere] },
    include: {
      servicio: true,
      prestadora: true,
      inspector: true,
      expediente: true,
      fotos: { orderBy: { orden: "asc" } },
    },
  });
  if (!insp) {
    return new NextResponse("Inspección no encontrada", { status: 404 });
  }

  const buffer = await generarActaInspeccion({
    codigo: insp.codigo,
    fecha: insp.fecha,
    inspector: {
      nombre: insp.inspector.nombre,
      apellido: insp.inspector.apellido,
      dni: insp.inspector.dni,
    },
    servicio: { nombre: insp.servicio.nombre },
    prestadora: insp.prestadora
      ? { razonSocial: insp.prestadora.razonSocial }
      : null,
    tipo: insp.tipo,
    titulo: insp.titulo,
    observaciones: insp.observaciones,
    direccion: insp.direccion,
    barrio: insp.barrio,
    lat: insp.lat,
    lng: insp.lng,
    transcripcionAudio: insp.transcripcionAudio,
    expediente: insp.expediente
      ? {
          numero: insp.expediente.numero,
          caratula: insp.expediente.caratula,
        }
      : null,
    fotos: insp.fotos.map((f) => ({
      url: f.url,
      descripcion: f.descripcion,
    })),
    createdAt: insp.createdAt,
  }, formato);

  // Marcar que se generó una vez (la URL queda vacía hasta que en 2D
  // persistamos a Vercel Blob; por ahora solo registramos la fecha).
  if (!insp.actaGeneradaEn) {
    await prisma.inspeccion.update({
      where: { id: insp.id },
      data: { actaGeneradaEn: new Date() },
    });
  }

  const sufijo = formato === "oficio" ? "_OFICIO" : "_A4";
  const filename = `Acta_${insp.codigo.replace(/[^A-Za-z0-9-]/g, "_")}${sufijo}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
