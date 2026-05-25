import type { ReclamoEstado } from "@prisma/client";
import { ESTADO_META, TONE_CLASS } from "@/lib/admin";

export function EstadoBadge({
  estado,
  size = "md",
}: {
  estado: ReclamoEstado;
  size?: "sm" | "md";
}) {
  const m = ESTADO_META[estado];
  const sizeCls =
    size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1 uppercase tracking-wider font-bold rounded-full border ${TONE_CLASS[m.tone]} ${sizeCls}`}
    >
      {m.label}
    </span>
  );
}
