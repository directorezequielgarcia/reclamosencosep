/**
 * GET /api/informes/anual/[id]
 * Genera el .docx del Informe Anual de Gestión y lo sirve como descarga.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeExportarInformes } from "@/lib/admin";
import { generarDocxInformeAnual } from "@/lib/docx-informe-anual";
import type { BloquesInformeAnual } from "@/lib/informe-anual-borrador";
import type { InformeAnualData } from "@/lib/informe-anual-data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || !puedeExportarInformes(session.user.rol)) {
    return new NextResponse("No autorizado", { status: 403 });
  }
  const { id } = await params;
  const informe = await prisma.informeAnual.findUnique({
    where: { id },
    include: { emitidoPor: true },
  });
  if (!informe) {
    return new NextResponse("Informe no encontrado", { status: 404 });
  }

  const buffer = await generarDocxInformeAnual({
    titulo: informe.titulo,
    periodoDesde: informe.periodoDesde,
    periodoHasta: informe.periodoHasta,
    bloques: informe.bloques as unknown as BloquesInformeAnual,
    metricas: informe.metricas as unknown as InformeAnualData,
    emisor: informe.emitidoPor
      ? {
          nombre: informe.emitidoPor.nombre,
          apellido: informe.emitidoPor.apellido,
        }
      : null,
    emitidoEn: informe.emitidoEn,
  });

  const slug = informe.titulo.replace(/[^A-Za-z0-9-]+/g, "_").slice(0, 80);
  const filename = `${slug}${informe.estado === "BORRADOR" ? "_BORRADOR" : ""}.docx`;

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
