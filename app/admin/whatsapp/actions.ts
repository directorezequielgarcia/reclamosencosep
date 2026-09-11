"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { puedeVerBandejaWhatsApp } from "@/lib/admin";
import { generarCodigo } from "@/lib/codigos";
import { SVC_META, type SvcKey } from "@/lib/servicios";
import { geocodificarDireccion } from "@/lib/geocode";
import { enviarMensajeWhatsApp, obtenerOCrearCiudadanoWhatsApp } from "@/lib/whatsapp";

const ConvertirSchema = z.object({
  mensajeId: z.string().min(1),
  svc: z.enum(["residuos", "energia", "agua", "transporte"]),
  titulo: z.string().min(3).max(60),
  descripcion: z.string().min(5).max(2000),
  direccion: z.string().min(3).max(200),
  barrio: z.string().max(80).optional(),
});

/**
 * Convierte un mensaje pendiente de la bandeja de WhatsApp en un Reclamo
 * formal: crea (o reutiliza) el Usuario ciudadano por wa_id, genera el
 * código, dispara el mismo evento CREACION que el wizard web, y responde
 * al vecino por WhatsApp con el número asignado — así Yanina no tiene que
 * escribir esa respuesta a mano.
 */
export async function convertirEnReclamo(formData: FormData) {
  const session = await auth();
  if (!session || !puedeVerBandejaWhatsApp(session.user.rol)) {
    throw new Error("Sin permisos");
  }

  const parsed = ConvertirSchema.safeParse({
    mensajeId: formData.get("mensajeId"),
    svc: formData.get("svc"),
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    direccion: formData.get("direccion"),
    barrio: String(formData.get("barrio") ?? "").trim() || undefined,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }
  const datos = parsed.data;

  const mensaje = await prisma.mensajeWhatsApp.findUnique({
    where: { id: datos.mensajeId },
  });
  if (!mensaje) throw new Error("Mensaje no encontrado");
  if (mensaje.procesado) throw new Error("Este mensaje ya fue convertido en reclamo");

  const svcKey = datos.svc as SvcKey;
  const kind = SVC_META[svcKey].kind;

  const servicio = await prisma.servicio.findUnique({ where: { kind } });
  if (!servicio) throw new Error("Servicio inexistente");

  const prestadora = await prisma.prestadora.findFirst({
    where: { servicios: { some: { id: servicio.id } }, activa: true },
    orderBy: { createdAt: "desc" },
  });

  const ciudadano = await obtenerOCrearCiudadanoWhatsApp(
    mensaje.waId,
    mensaje.nombrePerfil,
  );

  const geo = await geocodificarDireccion(datos.direccion, datos.barrio ?? null);

  let codigo = "";
  for (let i = 0; i < 5; i++) {
    const candidato = generarCodigo(kind);
    const existe = await prisma.reclamo.findUnique({ where: { codigo: candidato } });
    if (!existe) {
      codigo = candidato;
      break;
    }
  }
  if (!codigo) throw new Error("No se pudo generar código, reintentar");

  const slaHoras = 72;
  const slaDeadline = new Date(Date.now() + slaHoras * 60 * 60 * 1000);

  const reclamo = await prisma.reclamo.create({
    data: {
      codigo,
      origen: "WHATSAPP",
      ciudadanoId: ciudadano.id,
      servicioId: servicio.id,
      prestadoraId: prestadora?.id ?? null,
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      direccion: datos.direccion,
      barrio: datos.barrio ?? null,
      lat: geo.lat,
      lng: geo.lng,
      slaHoras,
      slaDeadline,
      estado: "RECIBIDO",
      eventos: {
        create: {
          tipo: "CREACION",
          mensaje: `Reclamo registrado desde WhatsApp por ${session.user.name}`,
          autorId: session.user.id,
        },
      },
    },
  });

  await prisma.mensajeWhatsApp.update({
    where: { id: mensaje.id },
    data: { procesado: true, reclamoId: reclamo.id },
  });

  // No aborta la conversión si el envío falla (p.ej. ventana de 24hs
  // vencida) — el reclamo ya quedó cargado, que es lo que importa.
  try {
    await enviarMensajeWhatsApp(
      mensaje.waId,
      `Tu reclamo quedó registrado en el ENCOSEP con el número ${reclamo.codigo}. ` +
        `Podés seguir su estado en la web del Ente.`,
    );
  } catch (e) {
    console.error("no se pudo responder por WhatsApp:", (e as Error).message);
  }

  revalidatePath("/admin/whatsapp");
  revalidatePath("/admin/bandeja");
}

/** Descarta un mensaje que no es un reclamo (consulta, spam, ya resuelto por chat, etc.). */
export async function descartarMensaje(formData: FormData) {
  const session = await auth();
  if (!session || !puedeVerBandejaWhatsApp(session.user.rol)) {
    throw new Error("Sin permisos");
  }
  const mensajeId = String(formData.get("mensajeId") ?? "");
  await prisma.mensajeWhatsApp.update({
    where: { id: mensajeId },
    data: { procesado: true },
  });
  revalidatePath("/admin/whatsapp");
}
