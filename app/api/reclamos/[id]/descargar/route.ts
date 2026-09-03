/**
 * GET /api/reclamos/[id]/descargar
 * Genera el reclamo completo (datos, descripción, mapa, fotos e historial)
 * en .docx y lo devuelve como descarga directa. Uso desde el panel admin —
 * incluye también las notas internas del equipo.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES_ADMIN, whereReclamosByRol } from "@/lib/admin";
import { generarReclamoDocx, type FormatoDoc } from "@/lib/docx-reclamo";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || !ROLES_ADMIN.includes(session.user.rol)) {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const { id } = await params;
  const url = new URL(req.url);
  const formato: FormatoDoc =
    url.searchParams.get("pagina") === "oficio" ? "oficio" : "a4";

  const baseWhere = whereReclamosByRol(
    session.user.rol,
    session.user.prestadoraId,
  );
  const reclamo = await prisma.reclamo.findFirst({
    where: { id, ...baseWhere },
    include: {
      servicio: true,
      prestadora: true,
      ciudadano: true,
      expediente: true,
      adjuntos: { where: { tipo: "FOTO" } },
      eventos: {
        orderBy: { createdAt: "asc" },
        include: { autor: true },
      },
    },
  });
  if (!reclamo) {
    return new NextResponse("Reclamo no encontrado", { status: 404 });
  }

  const buffer = await generarReclamoDocx(
    {
      codigo: reclamo.codigo,
      origen: reclamo.origen,
      createdAt: reclamo.createdAt,
      estado: reclamo.estado,
      titulo: reclamo.titulo,
      descripcion: reclamo.descripcion,
      servicio: { nombre: reclamo.servicio.nombre },
      prestadora: reclamo.prestadora
        ? { razonSocial: reclamo.prestadora.razonSocial }
        : null,
      ciudadano: {
        nombre: reclamo.ciudadano.nombre,
        apellido: reclamo.ciudadano.apellido,
        dni: reclamo.ciudadano.dni,
        email: reclamo.ciudadano.email,
        telefono: reclamo.ciudadano.telefono,
      },
      direccion: reclamo.direccion,
      barrio: reclamo.barrio,
      lat: reclamo.lat,
      lng: reclamo.lng,
      expediente: reclamo.expediente
        ? { numero: reclamo.expediente.numero, caratula: reclamo.expediente.caratula }
        : null,
      fotos: reclamo.adjuntos.map((f) => ({ url: f.url })),
      eventos: reclamo.eventos.map((e) => ({
        tipo: e.tipo,
        estadoNuevo: e.estadoNuevo,
        autorNombre: e.autor ? `${e.autor.nombre} ${e.autor.apellido}` : null,
        mensaje: e.mensaje,
        visibleVecino: e.visibleVecino,
        createdAt: e.createdAt,
      })),
    },
    formato,
    false,
  );

  const sufijo = formato === "oficio" ? "_OFICIO" : "_A4";
  const filename = `Reclamo_${reclamo.codigo.replace(/[^A-Za-z0-9-]/g, "_")}${sufijo}.docx`;

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
