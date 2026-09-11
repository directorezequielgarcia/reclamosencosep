import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  extraerMensajesDeTexto,
  verificarFirmaWebhook,
  type WhatsAppWebhookPayload,
} from "@/lib/whatsapp";

export const runtime = "nodejs";

// Handshake de verificación que Meta hace una sola vez al configurar el
// webhook en Meta for Developers (Configuración > Webhooks).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("token de verificación inválido", { status: 403 });
}

// Meta reintenta el POST si no responde 200 rápido, así que primero se
// persiste el mensaje en la bandeja (sin bloquear en clasificarlo ni en
// llamadas salientes) y se responde OK.
export async function POST(req: Request) {
  const rawBody = await req.text();

  if (!verificarFirmaWebhook(rawBody, req.headers.get("x-hub-signature-256"))) {
    return new NextResponse("firma inválida", { status: 401 });
  }

  const payload = JSON.parse(rawBody) as WhatsAppWebhookPayload;
  const mensajes = extraerMensajesDeTexto(payload);

  for (const m of mensajes) {
    // messageId es único: si Meta reintenta la entrega, el segundo intento
    // choca contra el unique y no duplica el mensaje en la bandeja.
    await prisma.mensajeWhatsApp
      .create({
        data: {
          messageId: m.messageId,
          waId: m.waId,
          nombrePerfil: m.nombrePerfil,
          cuerpo: m.cuerpo,
        },
      })
      .catch((e: { code?: string }) => {
        if (e.code !== "P2002") throw e; // P2002 = ya existía (reintento de Meta)
      });
  }

  return NextResponse.json({ ok: true });
}
