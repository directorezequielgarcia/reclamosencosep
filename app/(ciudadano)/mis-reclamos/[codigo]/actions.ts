"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { guardarFotoReclamo } from "@/lib/uploads";

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

// El vecino agrega documentación (fotos / imágenes de facturas) en cualquier
// momento — "ampliar declaratoria". Queda registrado con fecha en el historial.
export async function agregarDocumental(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Sin sesión");
  const codigo = String(formData.get("codigo") ?? "");
  const r = await reclamoDelUsuario(codigo, session.user.id);

  const archivos = formData
    .getAll("archivo")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, 5);
  if (archivos.length === 0) throw new Error("Adjuntá al menos un archivo");

  let guardados = 0;
  for (const f of archivos) {
    try {
      const saved = await guardarFotoReclamo(r.id, f);
      await prisma.adjunto.create({
        data: {
          reclamoId: r.id,
          tipo: "FOTO",
          url: saved.url,
          mimeType: saved.mimeType,
          bytes: saved.bytes,
        },
      });
      guardados++;
    } catch (e) {
      console.error("adjunto rechazado:", (e as Error).message);
    }
  }
  if (guardados > 0) {
    await prisma.reclamoEvento.create({
      data: {
        reclamoId: r.id,
        tipo: "ADJUNTO",
        autorId: session.user.id,
        mensaje: `Agregaste ${guardados} archivo${guardados === 1 ? "" : "s"} de documentación.`,
        visibleVecino: true,
      },
    });
  }
  revalidatePath(`/mis-reclamos/${codigo}`);
  revalidatePath(`/admin/reclamo/${r.id}`);
}

// El vecino puede borrar su reclamo SOLO mientras no fue revisado por el Ente.
export async function borrarReclamo(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Sin sesión");
  const codigo = String(formData.get("codigo") ?? "");
  const r = await reclamoDelUsuario(codigo, session.user.id);
  if (r.estado !== "RECIBIDO") {
    throw new Error(
      "Ya no podés borrar este reclamo: el Ente comenzó a revisarlo.",
    );
  }
  await prisma.reclamo.delete({ where: { id: r.id } });
  revalidatePath("/mis-reclamos");
  redirect("/mis-reclamos");
}
