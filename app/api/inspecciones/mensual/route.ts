/**
 * GET /api/inspecciones/mensual?anio=YYYY&mes=MM
 * Genera el Informe Mensual de Inspecciones en .docx.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeGestionarInspecciones } from "@/lib/admin";
import {
  generarMensualInspecciones,
  type DatosMensualInspecciones,
} from "@/lib/docx-mensual-inspecciones";
import type { TipoInspeccion } from "@prisma/client";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !puedeGestionarInspecciones(session.user.rol)) {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const url = new URL(req.url);
  const anio = parseInt(url.searchParams.get("anio") ?? "", 10);
  const mes = parseInt(url.searchParams.get("mes") ?? "", 10);

  if (!Number.isFinite(anio) || anio < 2020 || anio > 2100) {
    return new NextResponse("Año inválido", { status: 400 });
  }
  if (!Number.isFinite(mes) || mes < 1 || mes > 12) {
    return new NextResponse("Mes inválido (1-12)", { status: 400 });
  }

  // Rango del mes en hora local Argentina (UTC-3) — la BD guarda UTC.
  const desde = new Date(Date.UTC(anio, mes - 1, 1, 3, 0, 0));
  const hasta = new Date(Date.UTC(anio, mes, 1, 3, 0, 0));

  const [servicios, inspecciones] = await Promise.all([
    prisma.servicio.findMany({ orderBy: { nombreCorto: "asc" } }),
    prisma.inspeccion.findMany({
      where: {
        estado: "PUBLICADA",
        fecha: { gte: desde, lt: hasta },
      },
      orderBy: { fecha: "asc" },
      include: {
        servicio: true,
        prestadora: true,
        inspector: true,
        _count: { select: { fotos: true } },
      },
    }),
  ]);

  // Agrupar por servicio respetando el orden de la tabla
  const porServicio = servicios.map((sv) => ({
    servicioId: sv.id,
    nombre: sv.nombre,
    nombreCorto: sv.nombreCorto,
    inspecciones: inspecciones
      .filter((i) => i.servicioId === sv.id)
      .map((i) => ({
        codigo: i.codigo,
        fecha: i.fecha,
        titulo: i.titulo,
        tipo: i.tipo,
        direccion: i.direccion,
        barrio: i.barrio,
        inspector: {
          nombre: i.inspector.nombre,
          apellido: i.inspector.apellido,
        },
        prestadora: i.prestadora
          ? { razonSocial: i.prestadora.razonSocial }
          : null,
        fotosCount: i._count.fotos,
        tieneAudio: !!i.audioUrl,
      })),
  }));

  // Totales por tipo
  const porTipo: Record<TipoInspeccion, number> = {
    OFICIO: 0,
    DENUNCIA_VECINO: 0,
    SEGUIMIENTO_EXPEDIENTE: 0,
    EVENTO_PUNTUAL: 0,
  };
  for (const i of inspecciones) porTipo[i.tipo]++;

  // Totales por inspector
  const inspMap = new Map<string, { nombre: string; apellido: string; total: number }>();
  for (const i of inspecciones) {
    const key = `${i.inspector.apellido}|${i.inspector.nombre}`;
    const e = inspMap.get(key);
    if (e) e.total++;
    else
      inspMap.set(key, {
        nombre: i.inspector.nombre,
        apellido: i.inspector.apellido,
        total: 1,
      });
  }
  const porInspector = Array.from(inspMap.values()).sort(
    (a, b) => b.total - a.total,
  );

  // Totales por barrio
  const barrioMap = new Map<string, number>();
  for (const i of inspecciones) {
    const k = (i.barrio ?? i.direccion ?? "").trim();
    if (!k) continue;
    barrioMap.set(k, (barrioMap.get(k) ?? 0) + 1);
  }
  const porBarrio = Array.from(barrioMap.entries())
    .map(([barrio, total]) => ({ barrio, total }))
    .sort((a, b) => b.total - a.total);

  const datos: DatosMensualInspecciones = {
    anio,
    mes,
    servicios: porServicio,
    porTipo,
    porInspector,
    porBarrio,
  };

  const buffer = await generarMensualInspecciones(datos);

  const filename = `Inspecciones_${anio}-${String(mes).padStart(2, "0")}.docx`;
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
