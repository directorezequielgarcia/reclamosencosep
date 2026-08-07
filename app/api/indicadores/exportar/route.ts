/**
 * GET /api/indicadores/exportar?desde=&hasta=&svc=
 * Genera el .docx de indicadores filtrados y lo sirve como descarga.
 * Público (mismos datos agregados y anonimizados que /indicadores).
 */
import { NextResponse } from "next/server";
import { getIndicadoresStats } from "@/lib/indicadores-stats";
import { generarDocxIndicadores } from "@/lib/docx-indicadores";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stats = await getIndicadoresStats({
    desde: searchParams.get("desde") ?? undefined,
    hasta: searchParams.get("hasta") ?? undefined,
    svc: searchParams.get("svc") ?? undefined,
  });

  const buffer = await generarDocxIndicadores(stats);
  const slug = `indicadores_${stats.desde.toISOString().slice(0, 10)}_${stats.hasta.toISOString().slice(0, 10)}`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${slug}.docx"`,
      "Cache-Control": "no-store",
    },
  });
}
