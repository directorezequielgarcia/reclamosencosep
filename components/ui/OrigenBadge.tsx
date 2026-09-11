import type { ReclamoOrigen } from "@prisma/client";

// Distingue de un vistazo los reclamos que entraron por el wizard web de
// los que Yanina (o el equipo) triaron desde la bandeja de WhatsApp.
// No se muestra nada para WEB: es el caso por defecto y no aporta.
export function OrigenBadge({
  origen,
  size = "md",
}: {
  origen: ReclamoOrigen;
  size?: "sm" | "md";
}) {
  if (origen !== "WHATSAPP") return null;
  const sizeCls = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1 uppercase tracking-wider font-bold rounded-full border border-svc-green text-svc-green bg-svc-green/10 ${sizeCls}`}
      title="Reclamo cargado desde la bandeja de WhatsApp"
    >
      📱 WhatsApp
    </span>
  );
}
