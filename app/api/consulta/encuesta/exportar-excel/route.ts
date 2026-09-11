/**
 * GET /api/consulta/encuesta/exportar-excel?desde=&hasta=
 * Excel con las filas individuales de la encuesta de satisfacción (sin
 * dniHash). Solo para roles con acceso al panel de consulta.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { puedeVerConsulta } from "@/lib/admin";
import { getEncuestaFilas } from "@/lib/indicadores-stats";
import { generarXlsxEncuesta } from "@/lib/xlsx-encuesta";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !puedeVerConsulta(session.user.rol)) {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const { desde, hasta, filas } = await getEncuestaFilas({
    desde: searchParams.get("desde") ?? undefined,
    hasta: searchParams.get("hasta") ?? undefined,
  });

  const buffer = await generarXlsxEncuesta(filas, { desde, hasta });
  const slug = `encuesta_satisfaccion_${desde.toISOString().slice(0, 10)}_${hasta.toISOString().slice(0, 10)}`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${slug}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
