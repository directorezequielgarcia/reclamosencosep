// Simula un mensaje entrante de WhatsApp contra el webhook local, firmado
// igual que lo haría Meta, para validar el flujo sin esperar el alta real
// en Meta Business. Ver docs/09_whatsapp.md.
//
// OJO: este proyecto usa la misma base de datos en dev y en producción
// (Neon) — correrlo crea un mensaje real en la bandeja de /admin/whatsapp.
//
// Uso: node --env-file=.env scripts/test-whatsapp-webhook.mjs

import crypto from "node:crypto";

const URL_LOCAL = process.env.WEBHOOK_URL_LOCAL ?? "http://localhost:3000/api/whatsapp/webhook";
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

if (!APP_SECRET) {
  console.error("Falta WHATSAPP_APP_SECRET en el entorno (.env). Podés inventar cualquier valor para esta prueba.");
  process.exit(1);
}

const waId = "549297" + Math.floor(1000000 + Math.random() * 8999999);
const payload = {
  entry: [
    {
      changes: [
        {
          value: {
            contacts: [{ wa_id: waId, profile: { name: "Vecino de Prueba" } }],
            messages: [
              {
                id: `wamid.TEST_${crypto.randomUUID()}`,
                from: waId,
                type: "text",
                text: { body: "No tengo agua hace 3 días en Barrio General Mosconi" },
              },
            ],
          },
        },
      ],
    },
  ],
};

const rawBody = JSON.stringify(payload);
const firma = "sha256=" + crypto.createHmac("sha256", APP_SECRET).update(rawBody, "utf8").digest("hex");

const res = await fetch(URL_LOCAL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-hub-signature-256": firma,
  },
  body: rawBody,
});

console.log("Status:", res.status);
console.log(await res.text());
if (res.ok) {
  console.log(`\nOK — revisá /admin/whatsapp, debería aparecer un mensaje de "${waId}".`);
}
