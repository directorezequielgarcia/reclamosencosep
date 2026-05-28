/**
 * POST /api/inspecciones/[id]/audio
 * Sube el audio dictado en campo. Reemplaza el audio anterior si existía.
 * Acepta multipart/form-data con un campo "audio" (File).
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeGestionarInspecciones } from "@/lib/admin";
import { guardarAudioInspeccion } from "@/lib/uploads";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || !puedeGestionarInspecciones(session.user.rol)) {
    return new NextResponse("No autorizado", { status: 403 });
  }
  const { id } = await params;

  const insp = await prisma.inspeccion.findUnique({ where: { id } });
  if (!insp) return new NextResponse("Inspección no encontrada", { status: 404 });
  if (insp.estado === "ARCHIVADA") {
    return new NextResponse("Inspección archivada", { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("audio");
  const duracionRaw = form.get("duracionSeg");
  if (!(file instanceof File)) {
    return new NextResponse("Falta el archivo de audio", { status: 400 });
  }

  let saved;
  try {
    saved = await guardarAudioInspeccion(id, file);
  } catch (e) {
    return new NextResponse(
      e instanceof Error ? e.message : "Error al guardar audio",
      { status: 400 },
    );
  }

  const duracionSeg =
    typeof duracionRaw === "string" && duracionRaw.length
      ? Math.max(0, Math.round(parseFloat(duracionRaw)))
      : null;

  await prisma.inspeccion.update({
    where: { id },
    data: {
      audioUrl: saved.url,
      audioMimeType: saved.mimeType,
      audioBytes: saved.bytes,
      audioDuracionSeg: duracionSeg,
    },
  });

  return NextResponse.json({
    ok: true,
    url: saved.url,
    bytes: saved.bytes,
    duracionSeg,
  });
}
