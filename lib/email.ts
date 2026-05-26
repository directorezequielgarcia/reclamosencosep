/**
 * Helper de envío de emails — usa Resend si hay API key configurada,
 * caso contrario hace fallback a console.log (útil en dev y como
 * salvaguarda para que ninguna acción crashee si falta la key).
 *
 * Para habilitar emails reales:
 * 1. Crear cuenta gratis en https://resend.com (3.000 emails/mes free)
 * 2. Obtener API key del dashboard de Resend
 * 3. En Vercel → Settings → Environment Variables agregar:
 *      RESEND_API_KEY=re_xxxxxxxxxxxx
 *      EMAIL_FROM="ENCOSEP <onboarding@resend.dev>"
 *      (cuando tengamos dominio propio, EMAIL_FROM puede ser
 *       "ENCOSEP <no-reply@encosepcomodoro.gob.ar>")
 */

type EnviarEmailParams = {
  para: string;
  asunto: string;
  html: string;
  texto?: string;
};

export async function enviarEmail({
  para,
  asunto,
  html,
  texto,
}: EnviarEmailParams): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "ENCOSEP <onboarding@resend.dev>";

  if (!apiKey) {
    console.log("─────────────────────────────────────────────");
    console.log("EMAIL (fallback console, sin RESEND_API_KEY):");
    console.log("  Para:", para);
    console.log("  Asunto:", asunto);
    console.log("  Texto:", texto ?? "(solo HTML)");
    console.log("  HTML:", html.slice(0, 200) + (html.length > 200 ? "..." : ""));
    console.log("─────────────────────────────────────────────");
    return { ok: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [para],
        subject: asunto,
        html,
        text: texto,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend error:", error);
      return { ok: false, error };
    }
    return { ok: true };
  } catch (err) {
    console.error("Error enviando email:", err);
    return { ok: false, error: String(err) };
  }
}

const NAVY = "#1d3550";
const RED = "#c4393c";

export function plantillaResetClave(opts: {
  nombre: string;
  link: string;
  expiraEnHoras: number;
}): { html: string; texto: string } {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="border-bottom: 3px solid ${NAVY}; padding-bottom: 16px; margin-bottom: 24px;">
      <h1 style="color: ${NAVY}; margin: 0; font-size: 22px;">Portal ENCOSEP</h1>
      <p style="color: #666; margin: 4px 0 0; font-size: 12px; letter-spacing: 1px;">ENTE DE CONTROL DE SERVICIOS PÚBLICOS · COMODORO RIVADAVIA</p>
    </div>
    <p style="color: #333; font-size: 15px;">Hola ${opts.nombre},</p>
    <p style="color: #333; font-size: 15px;">Recibimos un pedido de restablecer la clave de tu cuenta en el Portal ENCOSEP.</p>
    <p style="color: #333; font-size: 15px;">Hacé click en el siguiente botón para fijar una nueva clave. El link vence en ${opts.expiraEnHoras} ${opts.expiraEnHoras === 1 ? "hora" : "horas"}.</p>
    <p style="text-align: center; margin: 32px 0;">
      <a href="${opts.link}" style="background: ${RED}; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block;">Restablecer mi clave</a>
    </p>
    <p style="color: #666; font-size: 13px;">Si el botón no funciona, copiá y pegá este enlace en tu navegador:</p>
    <p style="color: ${NAVY}; font-size: 12px; word-break: break-all; background: #f0f0f0; padding: 8px; border-radius: 6px;">${opts.link}</p>
    <p style="color: #666; font-size: 13px; margin-top: 24px;">Si no pediste este cambio, podés ignorar este email. Tu clave actual sigue siendo válida.</p>
    <p style="color: #999; font-size: 11px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">ENCOSEP · Ente de Control de Servicios Públicos · Comodoro Rivadavia, Chubut</p>
  </div>
</body>
</html>`;
  const texto = `Hola ${opts.nombre},

Recibimos un pedido de restablecer la clave de tu cuenta en el Portal ENCOSEP.

Para fijar una nueva clave, abrí este link en tu navegador (vence en ${opts.expiraEnHoras} ${opts.expiraEnHoras === 1 ? "hora" : "horas"}):

${opts.link}

Si no pediste este cambio, ignorá este email. Tu clave actual sigue siendo válida.

ENCOSEP — Ente de Control de Servicios Públicos
Comodoro Rivadavia, Chubut`;
  return { html, texto };
}

export function plantillaBienvenida(opts: {
  nombre: string;
  dni: string;
  link: string;
}): { html: string; texto: string } {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="border-bottom: 3px solid ${NAVY}; padding-bottom: 16px; margin-bottom: 24px;">
      <h1 style="color: ${NAVY}; margin: 0; font-size: 22px;">Bienvenido al Portal ENCOSEP</h1>
      <p style="color: #666; margin: 4px 0 0; font-size: 12px; letter-spacing: 1px;">ENTE DE CONTROL DE SERVICIOS PÚBLICOS · COMODORO RIVADAVIA</p>
    </div>
    <p style="color: #333; font-size: 15px;">Hola ${opts.nombre},</p>
    <p style="color: #333; font-size: 15px;">Tu cuenta fue creada con éxito. Desde ahora podés registrar reclamos sobre los servicios públicos bajo control del Ente: agua, energía, residuos y transporte.</p>
    <p style="color: #333; font-size: 15px;">Tu identificador de usuario es tu <strong>DNI ${opts.dni}</strong>.</p>
    <p style="text-align: center; margin: 32px 0;">
      <a href="${opts.link}" style="background: ${RED}; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block;">Ingresar al Portal</a>
    </p>
    <p style="color: #999; font-size: 11px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">ENCOSEP · Ente de Control de Servicios Públicos · Comodoro Rivadavia, Chubut</p>
  </div>
</body>
</html>`;
  const texto = `Hola ${opts.nombre},

Tu cuenta del Portal ENCOSEP fue creada con éxito.

Tu identificador de usuario es tu DNI ${opts.dni}.

Ingresá al portal: ${opts.link}

ENCOSEP — Ente de Control de Servicios Públicos
Comodoro Rivadavia, Chubut`;
  return { html, texto };
}
