// Helpers compartidos para los comprobantes imprimibles (calculadora y control
// de factura): meta de colores por rubro + donut SVG embebido en HTML.

export const COMPO_META: Record<string, { label: string; color: string }> = {
  ENERGIA: { label: "Energía", color: "#f59e0b" },
  ALUMBRADO: { label: "Alumbrado público", color: "#fbbf24" },
  AGUA: { label: "Agua", color: "#3b82f6" },
  CLOACAS: { label: "Cloacas", color: "#06b6d4" },
  IMPUESTOS: { label: "Impuestos y tasas", color: "#ef4444" },
  SEPELIO: { label: "Sepelios", color: "#8b5cf6" },
  BOMBEROS: { label: "Bomberos", color: "#10b981" },
  OTROS: { label: "Otros", color: "#94a3b8" },
};

export const COMPO_ORDEN = [
  "ENERGIA",
  "ALUMBRADO",
  "AGUA",
  "CLOACAS",
  "IMPUESTOS",
  "SEPELIO",
  "BOMBEROS",
  "OTROS",
];

/** Donut SVG + leyenda como HTML, para el comprobante imprimible. */
export function donutComprobanteHTML(
  comp: Record<string, number>,
  titulo = "Composición de la factura",
): string {
  const items = COMPO_ORDEN.map((k) => ({
    k,
    ...COMPO_META[k],
    monto: comp[k] ?? 0,
  })).filter((i) => i.monto > 0);
  const total = items.reduce((a, i) => a + i.monto, 0);
  if (total <= 0) return "";
  const R = 60;
  const C = 2 * Math.PI * R;
  const fracs = items.map((i) => i.monto / total);
  const circ = items
    .map((i, idx) => {
      const previas = fracs.slice(0, idx).reduce((a, b) => a + b, 0);
      return `<circle cx="80" cy="80" r="${R}" fill="none" stroke="${i.color}" stroke-width="24" stroke-dasharray="${fracs[idx] * C} ${C - fracs[idx] * C}" stroke-dashoffset="${-previas * C}"></circle>`;
    })
    .join("");
  const leyenda = items
    .map(
      (i) =>
        `<div class="lg"><span class="dot" style="background:${i.color}"></span>${i.label} <b>${((i.monto / total) * 100).toFixed(1)}%</b></div>`,
    )
    .join("");
  return `<div class="chart"><div class="chart-t">${titulo}</div>
  <div class="chart-row">
    <svg viewBox="0 0 160 160" width="150" height="150" style="transform:rotate(-90deg)">
      <circle cx="80" cy="80" r="${R}" fill="none" stroke="#eef0f4" stroke-width="24"></circle>${circ}
    </svg>
    <div class="leyenda">${leyenda}</div>
  </div></div>`;
}

/** Abre el HTML autocontenido en una ventana nueva para imprimir / guardar PDF. */
export function abrirComprobante(html: string): void {
  const w = window.open("", "_blank", "width=820,height=900");
  if (!w) {
    alert(
      "El navegador bloqueó la ventana. Permití las ventanas emergentes para imprimir o guardar el comprobante.",
    );
    return;
  }
  w.document.write(html);
  w.document.close();
}
