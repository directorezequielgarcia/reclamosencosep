/**
 * Anillos orbitales gigantes — versión decorativa del logo institucional
 * para usar como elemento gráfico envolvente en el hero.
 * Tres anillos concéntricos con segmentos de los colores institucionales.
 */
const NARANJA = "#e88a3c";
const VERDE = "#4a8b3a";
const NAVY = "#1d3550";
const CELESTE = "#4ba8c2";
const ROJO = "#c4393c";

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const sx = cx + r * Math.cos(toRad(startDeg));
  const sy = cy + r * Math.sin(toRad(startDeg));
  const ex = cx + r * Math.cos(toRad(endDeg));
  const ey = cy + r * Math.sin(toRad(endDeg));
  const dlt = ((endDeg - startDeg) % 360 + 360) % 360;
  const largeArc = dlt > 180 ? 1 : 0;
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
}

type Props = {
  /** Opacidad global (0–1). Default 0.85 */
  opacity?: number;
  /** Grosor del trazo en unidades del viewBox */
  strokeWidth?: number;
};

export function AnillosOrbital({
  opacity = 0.85,
  strokeWidth = 8,
}: Props) {
  const C = 500;
  // 3 anillos concéntricos R=470, 440, 410. Distintos cortes por anillo.
  const segs: Array<{
    r: number;
    arcos: Array<{ from: number; to: number; color: string }>;
  }> = [
    {
      r: 470,
      arcos: [
        { from: 210, to: 350, color: NARANJA },
        { from: 10, to: 90, color: NAVY },
        { from: 100, to: 200, color: CELESTE },
      ],
    },
    {
      r: 440,
      arcos: [
        { from: 220, to: 330, color: VERDE },
        { from: 350, to: 80, color: NAVY },
        { from: 100, to: 200, color: NAVY },
      ],
    },
    {
      r: 410,
      arcos: [
        { from: 200, to: 290, color: ROJO },
        { from: 310, to: 70, color: CELESTE },
        { from: 90, to: 180, color: NARANJA },
      ],
    },
  ];

  return (
    <svg
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      style={{ width: "100%", height: "100%", opacity }}
    >
      {segs.flatMap((seg, i) =>
        seg.arcos.map((a, j) => (
          <path
            key={`${i}-${j}`}
            d={arcPath(C, C, seg.r, a.from, a.to)}
            fill="none"
            stroke={a.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )),
      )}
    </svg>
  );
}
