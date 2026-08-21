import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generarCodigo } from "@/lib/codigos";
import {
  SVC_META,
  TRANSPORTE_CAMBIO_PARADA_TITULO,
  type SvcKey,
} from "@/lib/servicios";
import {
  guardarFotoReclamo,
  validarUrlBlobDeVideo,
  ALLOWED_VIDEO,
  MAX_VIDEO_BYTES,
} from "@/lib/uploads";
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
    linea: z.string().max(20).optional().nullable(),
    empresa: z.enum(["SOL_BUS", "DIADEMA", "NO_SABE"]).optional().nullable(),
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
  let videos: { url: string; mimeType: string; bytes: number }[] = [];

  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    const obj: Record<string, unknown> = {
      svc: fd.get("svc"),
      titulo: fd.get("titulo"),
      descripcion: fd.get("descripcion"),
      direccion: fd.get("direccion"),
      barrio: fd.get("barrio") || undefined,
      linea: fd.get("linea") || undefined,
      empresa: fd.get("empresa") || undefined,
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

    // Los videos ya están subidos a Vercel Blob (subida directa desde el
    // navegador, ver SubirVideoReclamo) — acá solo llegan sus metadatos.
    const videoUrls = fd.getAll("videoUrl").map(String);
    const videoMimes = fd.getAll("videoMime").map(String);
    const videoBytes = fd.getAll("videoBytes").map(String);
    videos = videoUrls
      .map((url, i) => ({
        url,
        mimeType: videoMimes[i] ?? "",
        bytes: Number(videoBytes[i] ?? 0),
      }))
      .filter((v) => v.url && ALLOWED_VIDEO.has(v.mimeType) && v.bytes > 0 && v.bytes <= MAX_VIDEO_BYTES)
      .slice(0, 2);
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
  // 1°/08/2026), se prioriza lo que el propio vecino indicó (campo
  // "empresa" del wizard). Sin esa indicación, se asigna la prestadora
  // vinculada más recientemente al servicio.
  const EMPRESA_KEYWORD: Record<string, string> = {
    SOL_BUS: "SOL BUS",
    DIADEMA: "DIADEMA",
  };
  let prestadora = null;
  if (datos.empresa && EMPRESA_KEYWORD[datos.empresa]) {
    prestadora = await prisma.prestadora.findFirst({
      where: {
        servicios: { some: { id: servicio.id } },
        activa: true,
        razonSocial: { contains: EMPRESA_KEYWORD[datos.empresa] },
      },
    });
  }
  if (!prestadora) {
    prestadora = await prisma.prestadora.findFirst({
      where: { servicios: { some: { id: servicio.id } }, activa: true },
      orderBy: { createdAt: "desc" },
    });
  }

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

  // El mini-form de cambio de parada ya arma su propia descripción con la
  // línea incluida; para el resto de reclamos de Transporte, la línea y la
  // empresa declarada por el vecino se anteponen como encabezado legible.
  let descripcionPersistida = datos.descripcion;
  if (
    svcKey === "transporte" &&
    datos.titulo !== TRANSPORTE_CAMBIO_PARADA_TITULO &&
    (datos.linea?.trim() || datos.empresa)
  ) {
    const encabezado = [
      datos.linea?.trim() ? `Línea: ${datos.linea.trim()}` : null,
      datos.empresa === "SOL_BUS"
        ? "Empresa declarada: Sol Bus"
        : datos.empresa === "DIADEMA"
          ? "Empresa declarada: Transporte Diadema"
          : datos.empresa === "NO_SABE"
            ? "Empresa declarada: no sabe/no está seguro"
            : null,
    ]
      .filter(Boolean)
      .join(" · ");
    descripcionPersistida = `${encabezado}\n${datos.descripcion}`;
  }

  const reclamo = await prisma.reclamo.create({
    data: {
      codigo,
      ciudadanoId: session.user.id,
      servicioId: servicio.id,
      prestadoraId: prestadora?.id ?? null,
      titulo: datos.titulo,
      descripcion: descripcionPersistida,
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

  // Vincular los videos (ya subidos a Blob) al reclamo recién creado.
  for (const v of videos) {
    try {
      validarUrlBlobDeVideo(v.url, "reclamos/pendientes/");
      await prisma.adjunto.create({
        data: {
          reclamoId: reclamo.id,
          tipo: "VIDEO",
          url: v.url,
          mimeType: v.mimeType,
          bytes: v.bytes,
        },
      });
    } catch (e) {
      console.error("video rechazado:", (e as Error).message);
    }
  }

  return NextResponse.json({
    ok: true,
    codigo: reclamo.codigo,
    id: reclamo.id,
  });
}
