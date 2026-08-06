import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generarCodigo } from "@/lib/codigos";
import { SVC_META, type SvcKey } from "@/lib/servicios";
import { guardarFotoReclamo } from "@/lib/uploads";
import { geocodificarDireccion } from "@/lib/geocode";

export const runtime = "nodejs";

const BodySchema = z
  .object({
    svc: z.enum(["residuos", "energia", "agua", "transporte"]),
    titulo: z.string().min(3).max(120),
    descripcion: z.string().min(5).max(2000),
    direccion: z.string().max(200).optional().nullable(),
    barrio: z.string().max(80).optional().nullable(),
    lat: z.number().min(-90).max(90).optional().nullable(),
    lng: z.number().min(-180).max(180).optional().nullable(),
  })
  .refine(
    (d) =>
      (typeof d.direccion === "string" && d.direccion.trim().length >= 3) ||
      (d.lat !== null && d.lat !== undefined && d.lng !== null && d.lng !== undefined),
    { message: "Se requiere dirección o coordenadas GPS" },
  );

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "no autenticado" }, { status: 401 });
  }

  // Aceptamos JSON puro o multipart/form-data (cuando viene con fotos)
  const ct = req.headers.get("content-type") ?? "";
  let datos: z.infer<typeof BodySchema>;
  let fotos: File[] = [];

  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    const obj: Record<string, unknown> = {
      svc: fd.get("svc"),
      titulo: fd.get("titulo"),
      descripcion: fd.get("descripcion"),
      direccion: fd.get("direccion"),
      barrio: fd.get("barrio") || undefined,
    };
    const lat = fd.get("lat");
    const lng = fd.get("lng");
    if (typeof lat === "string" && lat !== "") obj.lat = Number(lat);
    if (typeof lng === "string" && lng !== "") obj.lng = Number(lng);

    const parsed = BodySchema.safeParse(obj);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "datos inválidos", detalle: parsed.error.flatten() },
        { status: 400 },
      );
    }
    datos = parsed.data;

    for (const f of fd.getAll("foto")) {
      if (f instanceof File && f.size > 0) fotos.push(f);
    }
    if (fotos.length > 5) fotos = fotos.slice(0, 5);
  } else {
    const raw = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "datos inválidos", detalle: parsed.error.flatten() },
        { status: 400 },
      );
    }
    datos = parsed.data;
  }

  const svcKey = datos.svc as SvcKey;
  const kind = SVC_META[svcKey].kind;

  const servicio = await prisma.servicio.findUnique({ where: { kind } });
  if (!servicio) {
    return NextResponse.json(
      { error: "servicio inexistente" },
      { status: 500 },
    );
  }

  // Cuando hay más de una prestadora activa para el mismo servicio (p.ej.
  // Transporte con Sol Bus y Diadema tras el recambio de Patagonia del
  // 1°/08/2026), se asigna la vinculada más recientemente: es la que
  // refleja el último cambio de operador.
  const prestadora = await prisma.prestadora.findFirst({
    where: { servicios: { some: { id: servicio.id } }, activa: true },
    orderBy: { createdAt: "desc" },
  });

  let codigo = "";
  for (let i = 0; i < 5; i++) {
    const candidato = generarCodigo(kind);
    const existe = await prisma.reclamo.findUnique({
      where: { codigo: candidato },
    });
    if (!existe) {
      codigo = candidato;
      break;
    }
  }
  if (!codigo) {
    return NextResponse.json(
      { error: "no se pudo generar código, reintentar" },
      { status: 503 },
    );
  }

  const slaHoras = 72;
  const slaDeadline = new Date(Date.now() + slaHoras * 60 * 60 * 1000);

  const direccionPersistida =
    (datos.direccion && datos.direccion.trim()) ||
    (datos.lat !== null && datos.lat !== undefined
      ? `Coordenadas GPS ${datos.lat?.toFixed(5)}, ${datos.lng?.toFixed(5)}`
      : "Sin dirección");

  // Si el vecino NO mandó GPS pero SÍ una dirección escrita, geocodificamos
  // con Nominatim (OpenStreetMap). La función siempre devuelve coordenadas
  // (centro de Comodoro con jitter como último recurso), nunca null.
  let lat = datos.lat ?? null;
  let lng = datos.lng ?? null;
  if ((lat === null || lng === null) && datos.direccion?.trim()) {
    const geo = await geocodificarDireccion(datos.direccion, datos.barrio);
    lat = geo.lat;
    lng = geo.lng;
  }

  const reclamo = await prisma.reclamo.create({
    data: {
      codigo,
      ciudadanoId: session.user.id,
      servicioId: servicio.id,
      prestadoraId: prestadora?.id ?? null,
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      direccion: direccionPersistida,
      barrio: datos.barrio ?? null,
      lat,
      lng,
      slaHoras,
      slaDeadline,
      estado: "RECIBIDO",
      eventos: {
        create: {
          tipo: "CREACION",
          mensaje: "Reclamo registrado por el ciudadano",
          autorId: session.user.id,
        },
      },
    },
  });

  // Guardar fotos (si las hay) — no abortamos la creación si alguna falla
  for (const f of fotos) {
    try {
      const saved = await guardarFotoReclamo(reclamo.id, f);
      await prisma.adjunto.create({
        data: {
          reclamoId: reclamo.id,
          tipo: "FOTO",
          url: saved.url,
          mimeType: saved.mimeType,
          bytes: saved.bytes,
        },
      });
    } catch (e) {
      console.error("foto rechazada:", (e as Error).message);
    }
  }

  return NextResponse.json({
    ok: true,
    codigo: reclamo.codigo,
    id: reclamo.id,
  });
}
