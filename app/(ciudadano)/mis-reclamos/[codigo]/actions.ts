"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function reclamoDelUsuario(codigo: string, userId: string) {
  const r = await prisma.reclamo.findUnique({ where: { codigo } });
  if (!r || r.ciudadanoId !== userId) throw new Error("Reclamo inexistente");
  return r;
}

export async function habilitarRecursoDirecto(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Sin sesión");
  const codigo = String(formData.get("codigo") ?? "");
  const r = await reclamoDelUsuario(codigo, session.user.id);
  await prisma.$transaction([
    prisma.reclamo.update({
      where: { id: r.id },
      data: { recursoDirecto: true, recursoDirectoEn: new Date() },
    }),
    prisma.reclamoEvento.create({
      data: {
        reclamoId: r.id,
        tipo: "NOTIFICACION",
        autorId: session.user.id,
        mensaje:
          "El vecino habilitó el recurso directo a la prestadora. La prestadora tiene 5 días hábiles para responder por escrito.",
      },
    }),
  ]);
  revalidatePath(`/mis-reclamos/${codigo}`);
  revalidatePath(`/admin/reclamo/${r.id}`);
}

export async function solicitarCopiaExpediente(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Sin sesión");
  const codigo = String(formData.get("codigo") ?? "");
  const r = await reclamoDelUsuario(codigo, session.user.id);
  if (!["CERRADO_SIN_SOLUCION", "RECHAZADO"].includes(r.estado)) {
    throw new Error(
      "Sólo se puede solicitar copia tras agotar la vía administrativa.",
    );
  }
  await prisma.$transaction([
    prisma.reclamo.update({
      where: { id: r.id },
      data: {
        copiaExpedienteSolicitada: true,
        copiaExpedienteEn: new Date(),
      },
    }),
    prisma.reclamoEvento.create({
      data: {
        reclamoId: r.id,
        tipo: "NOTIFICACION",
        autorId: session.user.id,
        mensaje:
          "El vecino solicitó copia digital del expediente administrativo agotado.",
      },
    }),
  ]);
  revalidatePath(`/mis-reclamos/${codigo}`);
  revalidatePath(`/admin/reclamo/${r.id}`);
}

const EncuestaSchema = z.object({
  codigo: z.string().min(1),
  puntajeEnte: z.coerce.number().int().min(1).max(5),
  puntajePrestadora: z.coerce.number().int().min(1).max(5),
  comentarioEncuesta: z.string().max(2000).optional(),
});

export async function calificarReclamo(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Sin sesión");
  const parsed = EncuestaSchema.safeParse({
    codigo: formData.get("codigo"),
    puntajeEnte: formData.get("puntajeEnte"),
    puntajePrestadora: formData.get("puntajePrestadora"),
    comentarioEncuesta: formData.get("comentarioEncuesta") || undefined,
  });
  if (!parsed.success) throw new Error("Datos inválidos");
  const r = await reclamoDelUsuario(parsed.data.codigo, session.user.id);
  if (
    !["RESUELTO", "CERRADO_SIN_SOLUCION", "RECHAZADO"].includes(r.estado)
  ) {
    throw new Error("Sólo se puede calificar un reclamo cerrado.");
  }
  await prisma.reclamo.update({
    where: { id: r.id },
    data: {
      puntajeEnte: parsed.data.puntajeEnte,
      puntajePrestadora: parsed.data.puntajePrestadora,
      comentarioEncuesta: parsed.data.comentarioEncuesta ?? null,
      encuestaEn: new Date(),
    },
  });
  revalidatePath(`/mis-reclamos/${parsed.data.codigo}`);
}

const ComentarioSchema = z.object({
  codigo: z.string().min(1),
  mensaje: z.string().trim().min(2, "Escribí tu mensaje").max(2000),
});

// El vecino responde / amplía su reclamo. Queda como comentario visible
// (ida y vuelta con el Ente). Se puede en cualquier estado del reclamo.
export async function responderReclamo(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Sin sesión");
  const parsed = ComentarioSchema.safeParse({
    codigo: formData.get("codigo"),
    mensaje: formData.get("mensaje"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }
  const r = await reclamoDelUsuario(parsed.data.codigo, session.user.id);
  await prisma.reclamoEvento.create({
    data: {
      reclamoId: r.id,
      tipo: "COMENTARIO",
      autorId: session.user.id,
      mensaje: parsed.data.mensaje,
      visibleVecino: true,
    },
  });
  revalidatePath(`/mis-reclamos/${parsed.data.codigo}`);
  revalidatePath(`/admin/reclamo/${r.id}`);
}
