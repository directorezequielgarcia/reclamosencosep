import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { esDireccion, puedeRevisarDocumentos } from "@/lib/admin";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return new NextResponse("No autorizado", { status: 401 });
  if (!puedeRevisarDocumentos(session.user.rol) && !esDireccion(session.user.rol)) {
    return new NextResponse("Sin permiso", { status: 403 });
  }

  const { id } = await params;

  const blob = await prisma.archivoBlob.findUnique({
    where: { documentoId_tipo: { documentoId: id, tipo: "nota" } },
    select: { contenido: true, documento: { select: { notaNumero: true } } },
  });

  if (!blob) return new NextResponse("No encontrado", { status: 404 });

  const nombreArchivo = `Nota-ENCOSEP-${(blob.documento.notaNumero ?? id).replace("/", "-")}.docx`;

  return new NextResponse(blob.contenido, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
