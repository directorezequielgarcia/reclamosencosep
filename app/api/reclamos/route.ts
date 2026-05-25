import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generarCodigo } from "@/lib/codigos";
import { SVC_META, type SvcKey } from "@/lib/servicios";

export const runtime = "nodejs";

const BodySchema = z.object({
  svc: z.enum(["residuos", "energia", "agua", "transporte"]),
  titulo: z.string().min(3).max(120),
  descripcion: z.string().min(5).max(2000),
  direccion: z.string().min(3).max(200),
  barrio: z.string().max(80).optional().nullable(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "no autenticado" }, { status: 401 });
  }

  const raw = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "datos inválidos", detalle: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;
  const svcKey = data.svc as SvcKey;
  const kind = SVC_META[svcKey].kind;

  const servicio = await prisma.servicio.findUnique({ where: { kind } });
  if (!servicio) {
    return NextResponse.json({ error: "servicio inexistente" }, { status: 500 });
  }

  // Buscar primera prestadora con este servicio (auto-derivación)
  const prestadora = await prisma.prestadora.findFirst({
    where: { servicios: { some: { id: servicio.id } }, activa: true },
  });

  // Generar código con reintentos por colisión
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

  const reclamo = await prisma.reclamo.create({
    data: {
      codigo,
      ciudadanoId: session.user.id,
      servicioId: servicio.id,
      prestadoraId: prestadora?.id ?? null,
      titulo: data.titulo,
      descripcion: data.descripcion,
      direccion: data.direccion,
      barrio: data.barrio ?? null,
      slaHoras,
      slaDeadline,
      estado: "RECIBIDO",
      eventos: {
        create: {
          tipo: "CREACION",
          mensaje: `Reclamo registrado por el ciudadano`,
          autorId: session.user.id,
        },
      },
    },
  });

  return NextResponse.json({ ok: true, codigo: reclamo.codigo, id: reclamo.id });
}
