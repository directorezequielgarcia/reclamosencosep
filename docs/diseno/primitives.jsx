// primitives.jsx — Primitivas hi-fi alineadas al branding EnCoSeP

// ─────────────────────────────────────────────
// Marco de teléfono limpio (estilo iOS minimal)
// ─────────────────────────────────────────────
function SketchPhone({ children, density = 'comfortable', notes = true, mono = false, clean = false }) {
  const cls = [
    'sk-phone',
    density === 'compact' ? 'density-compact' : '',
    notes ? '' : 'no-notes',
    mono ? 'mono' : '',
  ].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <div className="sk-phone-notch"></div>
      <div className="sk-phone-screen">
        <div className="sk-statusbar">
          <span>9:41</span>
          <span>
            <span>·il</span><span>◐</span><span>▮</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

// Header de pantalla con back + título + acciones
function SkHeader({ back = true, title, right, sub, brand = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 0 12px', borderBottom: '1px solid var(--line)' }}>
      {back && (
        <button style={{
          width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)',
          background: 'var(--paper)', color: 'var(--navy)', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
        }}>‹</button>
      )}
      <div style={{ flex: 1, lineHeight: 1.15, minWidth: 0 }}>
        <div className="sk-h3" style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
        {sub && <div className="sk-small" style={{ fontSize: 11 }}>{sub}</div>}
      </div>
      {right || null}
    </div>
  );
}

// Bottom nav institucional
function SkBottomNav({ active = 'home' }) {
  const items = [
    { id: 'home',    label: 'Inicio',    sym: '⌂' },
    { id: 'new',     label: 'Reclamar',  sym: '＋' },
    { id: 'history', label: 'Historial', sym: '☷' },
    { id: 'map',     label: 'Mapa',      sym: '◎' },
    { id: 'me',      label: 'Mi cuenta', sym: '○' },
  ];
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '8px 4px 10px', borderTop: '1px solid var(--line)', background: 'var(--paper)',
      marginLeft: -18, marginRight: -18, marginBottom: -14,
    }}>
      {items.map(it => (
        <div key={it.id} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          color: active === it.id ? 'var(--c-orange)' : 'var(--muted)',
          fontWeight: active === it.id ? 700 : 500,
          padding: '2px 6px',
        }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>{it.sym}</span>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-base)' }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// Línea de relleno (texto fake)
function FillLine({ w = '100%', mb = 6 }) {
  return <div className="sk-fillline" style={{ width: w, marginBottom: mb }}></div>;
}

// Imagen placeholder
function ImgSlot({ h = 80, label = 'foto' }) {
  return (
    <div className="sk-border-dashed" style={{
      height: h, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--muted)', fontFamily: 'ui-monospace, "SF Mono", monospace', fontSize: 11,
      background: 'repeating-linear-gradient(45deg, transparent 0 8px, rgba(29,53,80,0.04) 8px 9px)',
    }}>[ {label} ]</div>
  );
}

// Anotación de diseñador (post-it discreto)
function Note({ children, style = {}, arrow = null }) {
  return (
    <div className="sk-note" style={style}>
      {arrow && <span className="sk-note-arrow" style={{ ...arrow }}>{arrow.glyph}</span>}
      {children}
    </div>
  );
}

// Logo EnCoSeP — img del archivo
function EncosepMini({ size = 38 }) {
  return (
    <img src="assets/encosep-logo.png" alt="EnCoSeP" style={{
      height: size, width: 'auto', display: 'block',
    }} />
  );
}

// Marca tricolor (banda decorativa del logo)
function BrandStripe({ height = 4, style = {} }) {
  return (
    <div className="sk-brandstrip" style={{ height, ...style }}>
      <div style={{ background: 'var(--c-orange)' }}></div>
      <div style={{ background: 'var(--c-green)'  }}></div>
      <div style={{ background: 'var(--c-blue-l)' }}></div>
      <div style={{ background: 'var(--c-red)'    }}></div>
    </div>
  );
}

// Header de marca EnCoSeP (logo + banda)
function BrandHeader({ right }) {
  return (
    <div style={{ margin: '-10px -18px 0', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px' }}>
        <EncosepMini size={34} />
        {right || null}
      </div>
      <BrandStripe />
    </div>
  );
}

// FAB rojo flotante "RECLAMOS"
function FabReclamos() {
  return (
    <div style={{
      position: 'absolute', right: 14, bottom: 72, zIndex: 20,
    }}>
      <div className="fab-reclamos">
        <span style={{
          width: 26, height: 26, borderRadius: '50%', background: 'var(--paper)',
          color: 'var(--c-red)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 16, lineHeight: 1
        }}>＋</span>
        RECLAMOS
      </div>
    </div>
  );
}

Object.assign(window, { SketchPhone, SkHeader, SkBottomNav, FillLine, ImgSlot, Note, EncosepMini, BrandStripe, BrandHeader, FabReclamos });
