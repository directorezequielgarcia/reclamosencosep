/**
 * Logo institucional EnCoSeP — versión "Vigilancia Orbital".
 *
 * Anillos orbitales con segmentos de color (naranja, verde, navy, azul,
 * celeste, rojo) que rodean el nombre del Ente en tipografía bold.
 * Reemplaza al logo previo de "engranajes con íconos".
 *
 * Replicado en SVG para escalar sin pérdida desde favicon (16px)
 * hasta cartel de vía pública.
 */
type Props = {
  size?: number;
  conTexto?: boolean;
};

// Paleta institucional
const NARANJA = "#e88a3c";
const VERDE = "#4a8b3a";
const NAVY = "#1d3550";
const NAVY_2 = "#2b4a6b";
const CELESTE = "#4ba8c2";
const ROJO = "#c4393c";

/** Devuelve `d` de una arc SVG entre dos ángulos (en grados) sobre un círculo. */
function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180; // 0° apunta arriba
  const sx = cx + r * Math.cos(toRad(startDeg));
  const sy = cy + r * Math.sin(toRad(startDeg));
  const ex = cx + r * Math.cos(toRad(endDeg));
  const ey = cy + r * Math.sin(toRad(endDeg));
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
}

export function LogoEncosep({ size = 56, conTexto = true }: Props) {
  const C = 100; // centro
  const SW = 4.5; // ancho de stroke

  // 3 anillos concéntricos con segmentos
  // R = 90 (outer), 82 (middle), 74 (inner)
  // Cada anillo dividido en arcos con gaps entre ellos
  const segmentos: Array<{
    r: number;
    arcos: Array<{ from: number; to: number; color: string }>;
  }> = [
    {
      r: 90,
      arcos: [
        { from: 200, to: 350, color: NARANJA },
        { from: 10, to: 80, color: NAVY },
        { from: 100, to: 180, color: CELESTE },
      ],
    },
    {
      r: 82,
      arcos: [
        { from: 220, to: 320, color: VERDE },
        { from: 340, to: 70, color: NAVY_2 },
        { from: 90, to: 200, color: NAVY },
      ],
    },
    {
      r: 74,
      arcos: [
        { from: 195, to: 285, color: ROJO },
        { from: 300, to: 60, color: CELESTE },
        { from: 80, to: 175, color: NARANJA },
      ],
    },
  ];

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label="EnCoSeP — Ente de Control de Servicios Públicos"
      style={{ display: "block" }}
    >
      {/* Fondo transparente, los anillos quedan sobre lo que esté detrás */}
      {segmentos.flatMap((seg, i) =>
        seg.arcos.map((a, j) => (
          <path
            key={`${i}-${j}`}
            d={arcPath(C, C, seg.r, a.from, a.to)}
            fill="none"
            stroke={a.color}
            strokeWidth={SW}
            strokeLinecap="round"
          />
        )),
      )}

      {/* Texto central */}
      {conTexto && size >= 40 && (
        <>
          <text
            x="100"
            y={size >= 80 ? 102 : 108}
            textAnchor="middle"
            fontFamily="'Open Sans', 'Helvetica Neue', system-ui, sans-serif"
            fontWeight="800"
            fontSize={size >= 80 ? 30 : 28}
            fill={NAVY}
            letterSpacing="-1"
          >
            EnCoSeP
          </text>
          {size >= 80 && (
            <>
              <line
                x1="46"
                y1="112"
                x2="154"
                y2="112"
                stroke={NAVY}
                strokeWidth="0.8"
                opacity="0.5"
              />
              <text
                x="100"
                y="123"
                textAnchor="middle"
                fontFamily="'Open Sans', 'Helvetica Neue', system-ui, sans-serif"
                fontWeight="600"
                fontSize="5.5"
                fill={NAVY}
                letterSpacing="0.8"
              >
                ENTE DE CONTROL DE SERVICIOS PÚBLICOS
              </text>
            </>
          )}
        </>
      )}
    </svg>
  );
}
