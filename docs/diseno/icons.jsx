// icons.jsx — Iconografía de servicios públicos
// Estilo institucional: línea-arte en navy dentro de un anillo de color.

const SVC_META = {
  agua:        { ring: 'var(--c-blue-l)', label: 'Agua y Saneamiento',     short: 'Agua' },
  energia:     { ring: 'var(--c-yellow)', label: 'Electricidad e Iluminación', short: 'Electricidad' },
  transporte:  { ring: 'var(--c-red)',    label: 'Transporte Público',     short: 'Transporte' },
  residuos:    { ring: 'var(--c-green)',  label: 'Gestión de Residuos',    short: 'Residuos' },
};

function SvcIcon({ kind, size = 56, ring = true, ringWidth }) {
  const m = SVC_META[kind] || SVC_META.agua;
  const r = ringWidth ?? Math.max(3, size * 0.07);
  const inner = size - r * 2 - 4;
  return (
    <div
      className="svc-ring"
      style={{
        width: size,
        height: size,
        borderWidth: ring ? r : 0,
        borderColor: m.ring,
      }}
    >
      <svg viewBox="0 0 64 64" width={inner} height={inner} style={{ display: 'block' }}>
        <g className="service-glyph" stroke="var(--navy)" strokeWidth="2.4"
           strokeLinecap="round" strokeLinejoin="round" fill="none">
          {kind === 'agua' && <AguaGlyph />}
          {kind === 'energia' && <EnergiaGlyph />}
          {kind === 'transporte' && <TransporteGlyph />}
          {kind === 'residuos' && <ResiduosGlyph />}
        </g>
      </svg>
    </div>
  );
}

// Canilla con gota — Agua y Saneamiento
function AguaGlyph() {
  return (
    <g>
      {/* canilla */}
      <path d="M14 18 L 30 18 L 30 28 L 14 28 Z" />
      <path d="M22 14 L 22 18" />
      <path d="M18 14 L 26 14" />
      <path d="M30 22 L 40 22 L 40 32" />
      <path d="M36 32 L 44 32" />
      {/* gota */}
      <path d="M40 36 C 36 41, 35 45, 35 48 C 35 51, 37 53, 40 53 C 43 53, 45 51, 45 48 C 45 45, 44 41, 40 36 Z" />
    </g>
  );
}

// Bombilla + rayo — Electricidad e Iluminación
function EnergiaGlyph() {
  return (
    <g>
      {/* bombilla */}
      <path d="M24 28 Q 24 16, 36 16 Q 48 16, 48 28 Q 48 34, 44 38 L 44 44 L 28 44 L 28 38 Q 24 34, 24 28 Z" />
      <path d="M30 48 L 42 48" />
      <path d="M32 52 L 40 52" />
      {/* rayo */}
      <path d="M36 22 L 32 30 L 36 30 L 34 38" strokeLinejoin="miter" />
      {/* postes de luz mínimos abajo opcionales — omito por claridad */}
    </g>
  );
}

// Colectivo de frente — Transporte Público
function TransporteGlyph() {
  return (
    <g>
      <path d="M14 22 Q 14 14, 22 14 L 42 14 Q 50 14, 50 22 L 50 46 Q 50 50, 46 50 L 18 50 Q 14 50, 14 46 Z" />
      <path d="M20 22 L 30 22 L 30 30 L 20 30 Z" />
      <path d="M34 22 L 44 22 L 44 30 L 34 30 Z" />
      <path d="M14 36 L 50 36" />
      <circle cx="22" cy="52" r="3.5" />
      <circle cx="42" cy="52" r="3.5" />
      <path d="M22 40 L 22 44" />
      <path d="M42 40 L 42 44" />
    </g>
  );
}

// Camión de basura simplificado — Gestión de Residuos
function ResiduosGlyph() {
  return (
    <g>
      {/* contenedor */}
      <path d="M18 22 L 38 22 L 38 44 L 18 44 Z" />
      <path d="M14 22 L 42 22" strokeWidth="2.6" />
      <path d="M22 18 L 34 18 L 34 22 L 22 22 Z" />
      <path d="M24 28 L 24 38" />
      <path d="M32 28 L 32 38" />
      <path d="M28 28 L 28 38" />
      {/* cabina del camión */}
      <path d="M40 30 L 50 30 L 50 44 L 40 44 Z" />
      <path d="M43 32 L 48 32 L 48 36 L 43 36 Z" />
      {/* ruedas */}
      <circle cx="24" cy="48" r="3" />
      <circle cx="44" cy="48" r="3" />
    </g>
  );
}

// Tarjeta de servicio — variante por defecto = anillo + label centrado
function SvcCard({ kind, label, sub, size = 'md', layout = 'stack' }) {
  const m = SVC_META[kind] || SVC_META.agua;
  const sizes = { sm: 56, md: 76, lg: 96 };
  const ic = sizes[size];
  const useLabel = label ?? m.short;
  if (layout === 'row') {
    return (
      <div className="sk-card sk-tap" style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: 12
      }}>
        <SvcIcon kind={kind} size={ic} />
        <div style={{ flex: 1, lineHeight: 1.2 }}>
          <div className="sk-body" style={{ fontWeight: 700 }}>{useLabel}</div>
          {sub && <div className="sk-small">{sub}</div>}
        </div>
        <span style={{ color: 'var(--muted)', fontSize: 22, fontWeight: 300 }}>›</span>
      </div>
    );
  }
  return (
    <div className="sk-card sk-tap" style={{
      padding: 12, display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 8, textAlign: 'center', minHeight: 0
    }}>
      <SvcIcon kind={kind} size={ic} />
      {useLabel && (
        <div style={{
          fontFamily: 'var(--font-base)',
          fontSize: size === 'sm' ? 12 : 13,
          fontWeight: 700,
          color: 'var(--navy)',
          lineHeight: 1.15,
        }}>{useLabel}</div>
      )}
      {sub && <div className="sk-small" style={{ fontSize: 11 }}>{sub}</div>}
    </div>
  );
}

Object.assign(window, { SvcIcon, SvcCard, SVC_META });
