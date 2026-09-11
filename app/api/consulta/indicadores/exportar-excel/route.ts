/**
 * GET /api/consulta/indicadores/exportar-excel?desde=&hasta=&svc=
 * Excel de los mismos indicadores que se ven en /consulta/indicadores.
 * Solo para roles con acceso al panel de consulta (ver lib/admin.ts).
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { puedeVerConsulta } from "@/lib/admin";
import { getIndicadoresStats } from "@/lib/indicadores-stats";
import { generarXlsxIndicadores } from "@/lib/xlsx-indicadores";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !puedeVerConsulta(session.user.rol)) {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const stats = await getIndicadoresStats({
    desde: searchParams.get("desde") ?? undefined,
    hasta: searchParams.get("hasta") ?? undefined,
    svc: searchParams.get("svc") ?? undefined,
  });

  const buffer = await generarXlsxIndicadores(stats);
  const slug = `indicadores_${stats.desde.toISOString().slice(0, 10)}_${stats.hasta.toISOString().slice(0, 10)}`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${slug}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
