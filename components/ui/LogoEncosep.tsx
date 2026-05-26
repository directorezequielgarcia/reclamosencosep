/**
 * Logo institucional del EnCoSeP — círculo con 4 cuartos de color
 * (verde-residuos, amarillo-electricidad, azul-agua, rojo-transporte)
 * con el nombre del Ente en el centro.
 *
 * Replicado en SVG para no depender de un archivo de imagen.
 */
type Props = {
  size?: number;
  conTexto?: boolean;
};

export function LogoEncosep({ size = 56, conTexto = true }: Props) {
  // viewBox 100x100. Centro 50,50, radio 48.
  // 4 cuartos arrancando arriba-izquierda en sentido horario.
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label="EnCoSeP — Ente de Control de Servicios Públicos"
      style={{ display: "block" }}
    >
      <defs>
        <clipPath id="logo-clip-circle">
          <circle cx="50" cy="50" r="46" />
        </clipPath>
      </defs>

      {/* Fondo blanco con borde */}
      <circle cx="50" cy="50" r="48" fill="white" />

      {/* Banda multicolor curva (anillo) */}
      <g clipPath="url(#logo-clip-circle)">
        {/* arriba-izq: verde */}
        <path d="M 50 4 A 46 46 0 0 0 4 50 L 12 50 A 38 38 0 0 1 50 12 Z" fill="#4a8b3a" />
        {/* arriba-der: amarillo */}
        <path d="M 50 4 A 46 46 0 0 1 96 50 L 88 50 A 38 38 0 0 0 50 12 Z" fill="#f0bc40" />
        {/* abajo-der: azul */}
        <path d="M 96 50 A 46 46 0 0 1 50 96 L 50 88 A 38 38 0 0 0 88 50 Z" fill="#4ba8c2" />
        {/* abajo-izq: rojo */}
        <path d="M 4 50 A 46 46 0 0 0 50 96 L 50 88 A 38 38 0 0 1 12 50 Z" fill="#c4393c" />
        {/* acento naranja entre verde y amarillo (arriba) */}
        <path
          d="M 47 4 A 46 46 0 0 1 53 4 L 53 12 A 38 38 0 0 0 47 12 Z"
          fill="#e88a3c"
        />
      </g>

      {/* Borde sutil del círculo */}
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="#1d3550"
        strokeOpacity="0.08"
        strokeWidth="0.6"
      />

      {/* Texto central — solo si el tamaño lo justifica */}
      {conTexto && size >= 40 && (
        <>
          <text
            x="50"
            y="55"
            textAnchor="middle"
            fontFamily="'Open Sans', system-ui, sans-serif"
            fontWeight="800"
            fontSize="18"
            fill="#1d3550"
            letterSpacing="-0.5"
          >
            EnCoSeP
          </text>
          {size >= 80 && (
            <text
              x="50"
              y="68"
              textAnchor="middle"
              fontFamily="'Open Sans', system-ui, sans-serif"
              fontWeight="600"
              fontSize="4.5"
              fill="#6c7a8c"
              letterSpacing="0.5"
            >
              ENTE DE CONTROL DE SERVICIOS PÚBLICOS
            </text>
          )}
        </>
      )}
    </svg>
  );
}
