/**
 * POST /api/inspecciones/[id]/fotos
 * Sube una o varias fotos a una inspección. Multipart con campos "fotos[]"
 * (uno o varios File) y "descripcion" opcional (aplicada a todas).
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeGestionarInspecciones } from "@/lib/admin";
import { guardarFotoInspeccion } from "@/lib/uploads";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || !puedeGestionarInspecciones(session.user.rol)) {
    return new NextResponse("No autorizado", { status: 403 });
  }
  const { id } = await params;

  const insp = await prisma.inspeccion.findUnique({
    where: { id },
    include: { _count: { select: { fotos: true } } },
  });
  if (!insp) return new NextResponse("Inspección no encontrada", { status: 404 });
  if (insp.estado === "ARCHIVADA") {
    return new NextResponse("Inspección archivada", { status: 400 });
  }

  const form = await req.formData();
  const archivos = form.getAll("fotos").filter((v): v is File => v instanceof File);
  if (archivos.length === 0) {
    return new NextResponse("Subí al menos una foto", { status: 400 });
  }

  const descripcion = String(form.get("descripcion") ?? "").trim() || null;

  const creadas: { id: string; url: string }[] = [];
  let ordenBase = insp._count.fotos;

  for (const file of archivos) {
    try {
      const saved = await guardarFotoInspeccion(id, file);
      const foto = await prisma.inspeccionFoto.create({
        data: {
          inspeccionId: id,
          url: saved.url,
          mimeType: saved.mimeType,
          bytes: saved.bytes,
          descripcion,
          orden: ordenBase++,
        },
      });
      creadas.push({ id: foto.id, url: foto.url });
    } catch (e) {
      return NextResponse.json(
        {
          ok: false,
          error: e instanceof Error ? e.message : "Error al guardar foto",
          creadas,
        },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({ ok: true, fotos: creadas });
}

/**
 * DELETE /api/inspecciones/[id]/fotos?fotoId=xxx
 * Borra el registro de la foto. El archivo del Blob queda huérfano (no se
 * limpia ahora — el costo es bajo y simplifica el flujo).
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || !puedeGestionarInspecciones(session.user.rol)) {
    return new NextResponse("No autorizado", { status: 403 });
  }
  const { id } = await params;
  const url = new URL(req.url);
  const fotoId = url.searchParams.get("fotoId");
  if (!fotoId) return new NextResponse("Falta fotoId", { status: 400 });

  const foto = await prisma.inspeccionFoto.findUnique({ where: { id: fotoId } });
  if (!foto || foto.inspeccionId !== id) {
    return new NextResponse("Foto no encontrada", { status: 404 });
  }
  await prisma.inspeccionFoto.delete({ where: { id: fotoId } });
  return NextResponse.json({ ok: true });
}
