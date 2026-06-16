import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeVerDocumentos } from "@/lib/admin";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return new NextResponse("No autorizado", { status: 401 });
  if (!puedeVerDocumentos(session.user.rol)) {
    return new NextResponse("Sin permiso", { status: 403 });
  }

  const { id } = await params;

  const blob = await prisma.archivoBlob.findUnique({
    where: { documentoId_tipo: { documentoId: id, tipo: "archivo" } },
    select: { contenido: true, mimeType: true, documento: { select: { prestadoraId: true } } },
  });

  if (!blob) return new NextResponse("No encontrado", { status: 404 });

  if (
    session.user.rol === "OPERADOR_PRESTADORA" &&
    blob.documento.prestadoraId !== session.user.prestadoraId
  ) {
    return new NextResponse("Sin permiso", { status: 403 });
  }

  return new NextResponse(blob.contenido, {
    headers: {
      "Content-Type": blob.mimeType ?? "application/octet-stream",
      "Content-Disposition": "inline",
    },
  });
}
