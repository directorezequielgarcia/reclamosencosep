/**
 * GET /api/consulta/mapa-captura?desde=&hasta=&svc=
 * Captura en PNG del mapa de reclamos filtrado (mismos puntos que el mapa de
 * calor de /consulta/indicadores), para bajar y usar fuera del panel. Solo
 * para roles con acceso al panel de consulta.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { puedeVerConsulta } from "@/lib/admin";
import { getIndicadoresStats } from "@/lib/indicadores-stats";
import { construirMapaMultiPunto, rasterizarSvgAPng } from "@/lib/mapa-estatico";

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

  const mapa = await construirMapaMultiPunto(
    stats.puntos.map((p) => ({ lat: p.lat, lng: p.lng, servicio: p.servicio })),
  );
  if (!mapa) {
    return new NextResponse("No hay reclamos con ubicación GPS en el período/servicio filtrado.", {
      status: 404,
    });
  }

  const png = await rasterizarSvgAPng(mapa.svg);
  const slug = `mapa_reclamos_${stats.desde.toISOString().slice(0, 10)}_${stats.hasta.toISOString().slice(0, 10)}`;

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${slug}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
