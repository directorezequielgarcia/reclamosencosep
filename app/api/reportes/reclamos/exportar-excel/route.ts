/**
 * GET /api/reportes/reclamos/exportar-excel?periodo=&svc=&desde=&hasta=
 * Genera el .xlsx del Reporte de reclamos por tema y problemática (hoja
 * Resumen + hoja Anexo con autofiltro) y lo sirve como descarga directa.
 * Mismos filtros y misma visibilidad por rol que /admin/bandeja/reporte.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ROLES_ADMIN, whereReclamosByRol } from "@/lib/admin";
import { flattenReporte, reporteDiarioPorTema } from "@/lib/reclamos-stats";
import {
  construirSubtitulo,
  mergeWhereServicio,
  resolverRangoReporte,
} from "@/lib/reportes-reclamos";
import { SVC_META, type SvcKey } from "@/lib/servicios";
import { generarXlsxReporteReclamos } from "@/lib/xlsx-reporte-reclamos";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !ROLES_ADMIN.includes(session.user.rol)) {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const sp = {
    periodo: searchParams.get("periodo") ?? undefined,
    svc: searchParams.get("svc") ?? undefined,
    desde: searchParams.get("desde") ?? undefined,
    hasta: searchParams.get("hasta") ?? undefined,
  };

  const rango = resolverRangoReporte(sp);
  const where = mergeWhereServicio(
    whereReclamosByRol(session.user.rol, session.user.prestadoraId),
    sp.svc,
  );
  const reporte = await reporteDiarioPorTema(where, rango.desde, rango.hasta);
  const filas = flattenReporte(reporte);
  const subtitulo = construirSubtitulo(rango, reporte.desde, reporte.hasta);
  const svcLabel = sp.svc && sp.svc in SVC_META ? SVC_META[sp.svc as SvcKey].label : null;

  const buffer = await generarXlsxReporteReclamos(reporte, filas, {
    subtitulo,
    svcLabel,
  });

  const slug = `Reporte_reclamos_${rango.periodo}_${new Date().toISOString().slice(0, 10)}`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${slug}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
