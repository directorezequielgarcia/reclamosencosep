// Redes oficiales del ENCOSEP. Mismo patrón que el ícono de WhatsApp del
// home (SVG inline, sin depender de un logo externo con derechos de marca).
export const INSTAGRAM_URL = "https://www.instagram.com/encosep_comodororivadavia/";
export const FACEBOOK_URL = "https://www.facebook.com/p/Encosep-100092156558601/";

export function IconoInstagram({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      className="fill-current"
    >
      <path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.97.24 2.43.4a4.9 4.9 0 0 1 1.77 1.15 4.9 4.9 0 0 1 1.15 1.77c.16.46.35 1.26.4 2.43.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.24 1.97-.4 2.43a4.9 4.9 0 0 1-1.15 1.77 4.9 4.9 0 0 1-1.77 1.15c-.46.16-1.26.35-2.43.4-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.97-.24-2.43-.4a4.9 4.9 0 0 1-1.77-1.15 4.9 4.9 0 0 1-1.15-1.77c-.16-.46-.35-1.26-.4-2.43C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.24-1.97.4-2.43a4.9 4.9 0 0 1 1.15-1.77 4.9 4.9 0 0 1 1.77-1.15c.46-.16 1.26-.35 2.43-.4C8.42 2.21 8.8 2.2 12 2.2zm0 1.8c-3.15 0-3.5.01-4.73.07-.96.04-1.48.2-1.82.34-.46.18-.78.39-1.13.73-.34.35-.55.67-.73 1.13-.14.34-.3.86-.34 1.82-.06 1.23-.07 1.58-.07 4.73s.01 3.5.07 4.73c.04.96.2 1.48.34 1.82.18.46.39.78.73 1.13.35.34.67.55 1.13.73.34.14.86.3 1.82.34 1.23.06 1.58.07 4.73.07s3.5-.01 4.73-.07c.96-.04 1.48-.2 1.82-.34.46-.18.78-.39 1.13-.73.34-.35.55-.67.73-1.13.14-.34.3-.86.34-1.82.06-1.23.07-1.58.07-4.73s-.01-3.5-.07-4.73c-.04-.96-.2-1.48-.34-1.82a3.1 3.1 0 0 0-.73-1.13 3.1 3.1 0 0 0-1.13-.73c-.34-.14-.86-.3-1.82-.34C15.5 4.01 15.15 4 12 4zm0 3.05a4.95 4.95 0 1 1 0 9.9 4.95 4.95 0 0 1 0-9.9zm0 1.8a3.15 3.15 0 1 0 0 6.3 3.15 3.15 0 0 0 0-6.3zm5.15-1.99a1.16 1.16 0 1 1-2.31 0 1.16 1.16 0 0 1 2.31 0z" />
    </svg>
  );
}

export function IconoFacebook({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      className="fill-current"
    >
      <path d="M13.5 21.9v-8.1h2.72l.41-3.16h-3.13V8.66c0-.91.25-1.53 1.56-1.53h1.66V4.31C15.9 4.24 14.9 4.15 13.75 4.15c-2.4 0-4.05 1.47-4.05 4.16v2.32H7v3.16h2.7v8.1h3.8z" />
    </svg>
  );
}

export function RedesSociales({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram de ENCOSEP"
        title="Instagram de ENCOSEP"
        className="hover:opacity-75 transition"
      >
        <IconoInstagram size={size} />
      </a>
      <a
        href={FACEBOOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook de ENCOSEP"
        title="Facebook de ENCOSEP"
        className="hover:opacity-75 transition"
      >
        <IconoFacebook size={size} />
      </a>
    </div>
  );
}
