/**
 * GET /api/consulta/reclamos/exportar-excel?estado=&svc=&q=&desde=&hasta=
 * Excel de "Reclamos ingresados" con todo el período filtrado (la pantalla
 * se limita a 100 filas, acá no). Solo para roles con acceso a /consulta.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { puedeVerConsulta } from "@/lib/admin";
import { obtenerReclamosConsulta } from "@/lib/reclamos-consulta";
import { generarXlsxReclamosConsulta } from "@/lib/xlsx-reclamos-consulta";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !puedeVerConsulta(session.user.rol)) {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const sp = {
    estado: searchParams.get("estado") ?? undefined,
    svc: searchParams.get("svc") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    desde: searchParams.get("desde") ?? undefined,
    hasta: searchParams.get("hasta") ?? undefined,
  };

  const filas = await obtenerReclamosConsulta(
    sp,
    session.user.rol,
    session.user.prestadoraId,
    5000,
  );

  const partes: string[] = [];
  if (sp.desde) partes.push(`desde ${sp.desde}`);
  if (sp.hasta) partes.push(`hasta ${sp.hasta}`);
  if (sp.estado) partes.push(`estado ${sp.estado}`);
  if (sp.svc) partes.push(`servicio ${sp.svc}`);
  const subtitulo = partes.length > 0 ? `Filtros: ${partes.join(" · ")}` : "Sin filtros (todos los reclamos)";

  const buffer = await generarXlsxReclamosConsulta(filas, { subtitulo });
  const slug = `reclamos_ingresados_${new Date().toISOString().slice(0, 10)}`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${slug}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
