# Bandeja de WhatsApp

Reclamos que llegan al WhatsApp institucional del Ente se cargaban dos veces:
Yanina respondía por WhatsApp y aparte cargaba el reclamo en el sistema. Este
módulo automatiza la captura: los mensajes entrantes quedan en una bandeja de
triado (`/admin/whatsapp`) y, al convertir uno en reclamo, el sistema genera el
código y responde automáticamente al vecino por WhatsApp.

Usa la **WhatsApp Business Cloud API** oficial de Meta — no automatiza
WhatsApp Web. Con el volumen actual (~50 reclamos/mes) es gratis: las
conversaciones que inicia el vecino ("service conversations") son gratis e
ilimitadas dentro de las 24hs de respuesta.

## Qué falta para que funcione

El código ya está escrito y listo (`app/api/whatsapp/webhook/route.ts`,
`app/admin/whatsapp/`, `lib/whatsapp.ts`), pero necesita dos cosas que solo el
Ente puede gestionar:

### 1. Migración de la base de datos

Agrega `whatsappId` a `Usuario`, `origen` a `Reclamo`, y el modelo
`MensajeWhatsApp`. **La base de dev es la misma que producción (Neon)** — no
correr `prisma migrate dev` sin confirmar que es el momento. Cuando estén
listos:

```
npx prisma migrate dev --name add_whatsapp_inbox
```

### 2. Alta del número institucional en Meta

1. Crear (o usar) una cuenta en **Meta Business Suite** (business.facebook.com)
   a nombre del ENCOSEP.
2. En **Meta for Developers** (developers.facebook.com), crear una app tipo
   "Business" y agregarle el producto **WhatsApp**.
3. Verificar el número institucional: Meta manda un código por SMS/llamada a
   ese número. Requiere que alguien con acceso al teléfono lo reciba en el
   momento del alta.
4. En la app de Meta, generar un **token de System User permanente** (no el
   token temporal de prueba que expira en 24hs) con permiso
   `whatsapp_business_messaging`.
5. Copiar a `.env` (producción: variables de entorno en Vercel):
   - `WHATSAPP_TOKEN` — el token del System User.
   - `WHATSAPP_PHONE_NUMBER_ID` — lo muestra el panel de WhatsApp > Empezar.
   - `WHATSAPP_APP_SECRET` — Configuración de la app > Básico.
   - `WHATSAPP_VERIFY_TOKEN` — inventar cualquier string propio (ej. una
     contraseña larga generada al azar), no lo provee Meta.
6. Configurar el **webhook**: Producto WhatsApp > Configuración > Webhooks →
   URL `https://<dominio-de-produccion>/api/whatsapp/webhook`, verify token =
   el mismo valor que `WHATSAPP_VERIFY_TOKEN`. Suscribirse al campo
   `messages`.

Importante: una vez que el número queda registrado en la Cloud API, deja de
poder usarse en paralelo desde la app normal de WhatsApp en un celular — todo
el manejo de esa línea pasa por este sistema.

## Cómo lo usa Yanina

1. Un vecino escribe al WhatsApp institucional.
2. El mensaje aparece en `/admin/whatsapp` (mismo permiso que la Bandeja).
3. Yanina abre el mensaje, elige el servicio, completa dirección/barrio
   (WhatsApp no manda esos datos estructurados) y hace clic en **Convertir en
   reclamo**.
4. El sistema genera el código, crea el reclamo con `origen = WHATSAPP` (se
   distingue de los cargados por el wizard web) y le responde al vecino por
   WhatsApp con el número asignado — sin que Yanina tenga que escribirlo.
5. Si el mensaje no es un reclamo (consulta, spam), el botón **Descartar** lo
   saca de la bandeja sin crear nada.

## Probarlo sin esperar el alta en Meta

`scripts/test-whatsapp-webhook.mjs` simula un mensaje entrante contra el
webhook local, firmado igual que lo haría Meta. Sirve para validar el flujo
completo (webhook → bandeja → conversión → reclamo) antes de tener
credenciales reales — el envío de la respuesta por WhatsApp fallará (no hay
token real) pero el reclamo se crea igual.

**Ojo: escribe en la base real (dev = prod).** Requiere `WHATSAPP_APP_SECRET`
y `WHATSAPP_VERIFY_TOKEN` en `.env` (pueden ser cualquier string inventado
para esta prueba). Correr con el server local levantado (`npm run dev`):

```
node --env-file=.env scripts/test-whatsapp-webhook.mjs
```

## Fotos y audio

MVP: solo procesa mensajes de **texto**. Un mensaje con foto o audio no se
descarta pero tampoco se guarda su adjunto — queda como próximo paso si hace
falta (requiere una llamada extra a la Graph API para resolver la URL
temporal del media y subirlo a Blob).
