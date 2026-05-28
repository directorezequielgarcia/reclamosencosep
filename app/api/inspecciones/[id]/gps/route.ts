/**
 * POST /api/inspecciones/[id]/gps
 * Persiste las coordenadas obtenidas del navegador en la inspección.
 * Body JSON: { lat: number, lng: number }
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeGestionarInspecciones } from "@/lib/admin";

const Body = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || !puedeGestionarInspecciones(session.user.rol)) {
    return new NextResponse("No autorizado", { status: 403 });
  }
  const { id } = await params;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return new NextResponse("JSON inválido", { status: 400 });
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return new NextResponse("lat/lng fuera de rango", { status: 400 });
  }

  const insp = await prisma.inspeccion.findUnique({ where: { id } });
  if (!insp) return new NextResponse("Inspección no encontrada", { status: 404 });
  if (insp.estado === "ARCHIVADA") {
    return new NextResponse("Inspección archivada", { status: 400 });
  }

  await prisma.inspeccion.update({
    where: { id },
    data: { lat: parsed.data.lat, lng: parsed.data.lng },
  });

  return NextResponse.json({ ok: true });
}
