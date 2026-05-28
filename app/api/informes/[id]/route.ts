/**
 * GET /api/informes/[id]
 * Genera el .docx del Informe Mensual y lo devuelve como descarga directa.
 * Solo los roles que pueden exportar informes (DIRECTOR, SUPER_ADMIN).
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeExportarInformes, ROL_LABEL } from "@/lib/admin";
import { generarDocxInformeMensual } from "@/lib/docx-informe-mensual";
import type { BloquesInforme } from "@/lib/informe-mensual-borrador";

const MESES_FILENAME = [
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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || !puedeExportarInformes(session.user.rol)) {
    return new NextResponse("No autorizado", { status: 403 });
  }
  const { id } = await params;

  const informe = await prisma.informeMensual.findUnique({
    where: { id },
    include: { emitidoPor: true },
  });
  if (!informe) {
    return new NextResponse("Informe no encontrado", { status: 404 });
  }

  const bloques = informe.bloques as unknown as BloquesInforme;
  const buffer = await generarDocxInformeMensual({
    anio: informe.anio,
    mes: informe.mes,
    bloques,
    emisor: informe.emitidoPor
      ? {
          nombre: informe.emitidoPor.nombre,
          apellido: informe.emitidoPor.apellido,
          rol: ROL_LABEL[informe.emitidoPor.rol],
        }
      : null,
    emitidoEn: informe.emitidoEn,
  });

  const filename = `Informe_Mensual_${MESES_FILENAME[informe.mes - 1]}_${informe.anio}${informe.estado === "BORRADOR" ? "_BORRADOR" : ""}.docx`;

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
