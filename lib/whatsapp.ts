import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Integración con WhatsApp Business Cloud API (Meta) para la bandeja de
// reclamos del número institucional del Ente. Ver docs/09_whatsapp.md para
// el alta en Meta Business y las variables de entorno requeridas.

const GRAPH_VERSION = "v21.0";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable de entorno ${name}`);
  return v;
}

/**
 * Valida que el POST del webhook venga realmente de Meta, comparando la
 * firma HMAC-SHA256 del header `x-hub-signature-256` contra el body crudo
 * firmado con WHATSAPP_APP_SECRET. Sin esto, cualquiera que adivine la URL
 * podría insertar mensajes falsos en la bandeja.
 */
export function verificarFirmaWebhook(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const appSecret = requireEnv("WHATSAPP_APP_SECRET");
  const esperada = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");
  const recibida = signatureHeader.slice("sha256=".length);
  const a = Buffer.from(esperada, "hex");
  const b = Buffer.from(recibida, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Busca o crea el Usuario (rol CIUDADANO) asociado a un wa_id de WhatsApp. */
export async function obtenerOCrearCiudadanoWhatsApp(
  waId: string,
  nombrePerfil: string | null,
) {
  const existente = await prisma.usuario.findUnique({ where: { whatsappId: waId } });
  if (existente) return existente;

  // No hay DNI real disponible desde WhatsApp: se usa un identificador
  // sintético fuera del rango de DNI (prefijo "W") para no colisionar con
  // cuentas reales y para que estas cuentas no puedan loguearse por DNI.
  const dniSintetico = `W${waId}`.slice(0, 20);
  const claveInutilizable = await bcrypt.hash(crypto.randomUUID(), 10);
  const [nombre, ...resto] = (nombrePerfil?.trim() || "Vecino WhatsApp").split(" ");

  return prisma.usuario.create({
    data: {
      dni: dniSintetico,
      nombre: nombre || "Vecino",
      apellido: resto.join(" ") || "(WhatsApp)",
      telefono: waId,
      whatsappId: waId,
      passwordHash: claveInutilizable,
      rol: "CIUDADANO",
    },
  });
}

/** Envía un mensaje de texto de vuelta al vecino (gratis dentro de la ventana de 24hs de servicio). */
export async function enviarMensajeWhatsApp(waId: string, texto: string) {
  const token = requireEnv("WHATSAPP_TOKEN");
  const phoneNumberId = requireEnv("WHATSAPP_PHONE_NUMBER_ID");

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: waId,
        type: "text",
        text: { body: texto },
      }),
    },
  );

  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    throw new Error(`Meta rechazó el envío (${res.status}): ${detalle}`);
  }
  return res.json();
}

// Forma mínima del payload del webhook de WhatsApp que efectivamente se usa.
// Meta manda más campos de los tipados acá.
export type WhatsAppWebhookPayload = {
  entry?: {
    changes?: {
      value?: {
        contacts?: { profile?: { name?: string }; wa_id?: string }[];
        messages?: {
          id: string;
          from: string;
          type: string;
          text?: { body?: string };
        }[];
      };
    }[];
  }[];
};

export type MensajeEntrante = {
  messageId: string;
  waId: string;
  nombrePerfil: string | null;
  cuerpo: string;
};

/** Extrae los mensajes de texto entrantes de un payload de webhook de Meta. */
export function extraerMensajesDeTexto(
  payload: WhatsAppWebhookPayload,
): MensajeEntrante[] {
  const mensajes: MensajeEntrante[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages) continue;
      const nombrePorWaId = new Map(
        (value.contacts ?? []).map((c) => [c.wa_id, c.profile?.name ?? null]),
      );
      for (const m of value.messages) {
        if (m.type !== "text" || !m.text?.body) continue; // MVP: solo texto
        mensajes.push({
          messageId: m.id,
          waId: m.from,
          nombrePerfil: nombrePorWaId.get(m.from) ?? null,
          cuerpo: m.text.body,
        });
      }
    }
  }
  return mensajes;
}
