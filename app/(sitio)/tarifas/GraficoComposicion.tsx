"use client";

import type { ComposicionCat } from "@/lib/tarifas";
import { pesos } from "@/lib/tarifas";

const META: Record<ComposicionCat, { label: string; color: string }> = {
  ENERGIA: { label: "Energía", color: "#f59e0b" },
  ALUMBRADO: { label: "Alumbrado público", color: "#fbbf24" },
  AGUA: { label: "Agua", color: "#3b82f6" },
  CLOACAS: { label: "Cloacas", color: "#06b6d4" },
  IMPUESTOS: { label: "Impuestos y tasas", color: "#ef4444" },
  SEPELIO: { label: "Sepelios", color: "#8b5cf6" },
  BOMBEROS: { label: "Bomberos", color: "#10b981" },
  OTROS: { label: "Otros", color: "#94a3b8" },
};

const ORDEN: ComposicionCat[] = [
  "ENERGIA",
  "ALUMBRADO",
  "AGUA",
  "CLOACAS",
  "IMPUESTOS",
  "SEPELIO",
  "BOMBEROS",
  "OTROS",
];

export function GraficoComposicion({
  composicion,
}: {
  composicion: Record<ComposicionCat, number>;
}) {
  const items = ORDEN.map((k) => ({ k, ...META[k], monto: composicion[k] })).filter(
    (i) => i.monto > 0,
  );
  const totalPos = items.reduce((a, i) => a + i.monto, 0);
  if (totalPos <= 0) return null;

  // Donut con segmentos de stroke-dasharray (cálculo funcional, sin mutar).
  const R = 70;
  const C = 2 * Math.PI * R;
  const fracs = items.map((i) => i.monto / totalPos);
  const segmentos = items.map((i, idx) => {
    const previas = fracs.slice(0, idx).reduce((a, b) => a + b, 0);
    return {
      color: i.color,
      dash: fracs[idx] * C,
      offset: -previas * C,
    };
  });

  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <div className="text-sm font-bold text-navy mb-4">
        Composición de tu factura
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <svg
          viewBox="0 0 180 180"
          className="w-44 h-44 shrink-0 -rotate-90"
          role="img"
          aria-label="Gráfico de composición de la factura"
        >
          <circle cx="90" cy="90" r={R} fill="none" stroke="#eef0f4" strokeWidth="26" />
          {segmentos.map((s, idx) => (
            <circle
              key={idx}
              cx="90"
              cy="90"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="26"
              strokeDasharray={`${s.dash} ${C - s.dash}`}
              strokeDashoffset={s.offset}
            />
          ))}
        </svg>

        <div className="flex-1 w-full flex flex-col gap-1.5">
          {items.map((i) => {
            const pct = (i.monto / totalPos) * 100;
            return (
              <div key={i.k} className="flex items-center gap-2 text-sm">
                <span
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: i.color }}
                />
                <span className="text-navy flex-1">{i.label}</span>
                <span className="font-bold text-navy tabular-nums">
                  {pct.toFixed(1)}%
                </span>
                <span className="text-muted text-xs tabular-nums w-24 text-right hidden sm:block">
                  {pesos(i.monto)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
