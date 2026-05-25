// screens-home.jsx — Variantes del Home/Landing (estilo institucional EnCoSeP)

// ─────────────────────────────────────────────
// A · Home directo: 4 servicios como tarjetas grandes
// ─────────────────────────────────────────────
function HomeA() {
  return (
    <div className="sk-screen-body" style={{ gap: 12, paddingTop: 0, position: 'relative' }}>
      <BrandHeader right={<div className="sk-chip" style={{ fontSize: 11 }}>○ Hola, Vec.</div>} />

      <div style={{ marginTop: 4 }}>
        <div className="sk-h1">Control de los<br/>Servicios Públicos</div>
        <div className="sk-body" style={{ color: 'var(--muted)', marginTop: 4 }}>
          Elegí el servicio sobre el que querés hacer tu reclamo.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
        <SvcCard kind="residuos" sub="basura · contenedores" />
        <SvcCard kind="energia"  sub="cortes · postes" />
        <SvcCard kind="agua"     sub="cortes · pérdidas" />
        <SvcCard kind="transporte" sub="líneas · paradas" />
      </div>

      <div style={{ flex: 1 }}></div>

      <div className="sk-small" style={{ textAlign: 'center' }}>
        <span className="sk-underline">Ver reclamos del barrio</span>
      </div>

      <Note style={{ position: 'absolute', top: 110, right: -100, width: 95, transform: 'rotate(-2deg)' }}>
        Mismo orden y<br/>aros de color<br/>que el sitio web
      </Note>

      <SkBottomNav active="home" />
    </div>
  );
}

// ─────────────────────────────────────────────
// B · Home con CTA grande tipo "RECLAMOS"
// ─────────────────────────────────────────────
function HomeB() {
  return (
    <div className="sk-screen-body" style={{ gap: 12, paddingTop: 0, position: 'relative' }}>
      <BrandHeader right={<span className="sk-small">DNI 27.345.×××</span>} />

      <div className="sk-card" style={{
        padding: 16, background: 'linear-gradient(135deg, #1d3550 0%, #2b4a6b 100%)',
        color: 'var(--paper)', border: 'none'
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, letterSpacing: '0.04em' }}>NUEVO RECLAMO</div>
        <div className="sk-h1" style={{ color: 'var(--paper)', marginTop: 4 }}>¿Qué pasa en<br/>tu barrio hoy?</div>
        <button className="sk-btn sk-btn-danger sk-btn-big" style={{ marginTop: 12, width: '100%' }}>
          ＋ Iniciar reclamo
        </button>
      </div>

      <div>
        <div className="sk-h3" style={{ fontWeight: 700, marginBottom: 8 }}>Accesos rápidos</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {['residuos','energia','agua','transporte'].map(k => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <SvcIcon kind={k} size={48} />
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--navy)', textAlign: 'center', lineHeight: 1.15 }}>
                {SVC_META[k].short}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="sk-h3" style={{ fontWeight: 700, marginBottom: 8 }}>Mis reclamos</div>
        <div className="sk-border-soft" style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <SvcIcon kind="agua" size={40} />
          <div style={{ flex: 1, lineHeight: 1.2, minWidth: 0 }}>
            <div className="sk-body" style={{ fontWeight: 700 }}>#A-2418 · en revisión</div>
            <div className="sk-small">Pérdida en Av. Rivadavia 2200</div>
          </div>
          <span style={{ color: 'var(--muted)', fontSize: 22 }}>›</span>
        </div>
      </div>

      <div style={{ flex: 1 }}></div>
      <SkBottomNav active="home" />
    </div>
  );
}

// ─────────────────────────────────────────────
// C · Home conversacional / pregunta primero
// ─────────────────────────────────────────────
function HomeC() {
  const items = [
    { k:'agua',       q:'"No tengo agua"',     d:'o pérdidas, cloacas...' },
    { k:'energia',    q:'"Se cortó la luz"',   d:'o foco quemado en la calle' },
    { k:'transporte', q:'"El cole no pasa"',   d:'recorridos, frecuencia' },
    { k:'residuos',   q:'"No pasó el camión"', d:'basura, contenedores' },
  ];
  return (
    <div className="sk-screen-body" style={{ gap: 12, paddingTop: 0, position: 'relative' }}>
      <BrandHeader right={<span className="sk-small">○ ☰</span>} />

      <div style={{ marginTop: 6 }}>
        <div className="sk-h2" style={{ fontSize: 22 }}>Hola Vecino/a,</div>
        <div className="sk-h1" style={{ marginTop: 2 }}>¿qué te trae<br/>por acá hoy?</div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap: 8, marginTop: 4 }}>
        {items.map(it => (
          <div key={it.k} className="sk-card" style={{ display:'flex', alignItems:'center', gap: 12, padding: 11 }}>
            <SvcIcon kind={it.k} size={44} />
            <div style={{ flex: 1, lineHeight: 1.2 }}>
              <div className="sk-body" style={{ fontWeight:700 }}>{it.q}</div>
              <div className="sk-small">{it.d}</div>
            </div>
            <span style={{ color:'var(--muted)', fontSize:22 }}>›</span>
          </div>
        ))}
      </div>

      <Note style={{ position: 'absolute', bottom: 80, left: -90, width: 95, transform: 'rotate(1deg)' }}>
        Lenguaje cotidiano,<br/>no jerga técnica
      </Note>

      <div style={{ flex: 1 }}></div>
      <SkBottomNav active="home" />
    </div>
  );
}

// ─────────────────────────────────────────────
// D · Home con estado del barrio (transparencia)
// ─────────────────────────────────────────────
function HomeD() {
  return (
    <div className="sk-screen-body" style={{ gap: 10, paddingTop: 0, position: 'relative' }}>
      <BrandHeader right={<div className="sk-chip" style={{ fontSize: 11 }}>Bº Pueyrredón ▾</div>} />

      <div style={{ marginTop: 4 }}>
        <div className="sk-h1">Tu barrio,<br/>esta semana</div>
      </div>

      <div className="sk-card" style={{ padding: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div className="sk-h1 c-red" style={{ fontSize: 28 }}>14</div>
            <div className="sk-small" style={{ fontSize: 11 }}>abiertos</div>
          </div>
          <div style={{ width: 1, background: 'var(--line)' }}></div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div className="sk-h1 c-green" style={{ fontSize: 28 }}>32</div>
            <div className="sk-small" style={{ fontSize: 11 }}>resueltos</div>
          </div>
          <div style={{ width: 1, background: 'var(--line)' }}></div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div className="sk-h1" style={{ fontSize: 28 }}>5d</div>
            <div className="sk-small" style={{ fontSize: 11 }}>promedio</div>
          </div>
        </div>
        <div className="sk-small" style={{ textAlign: 'center', marginTop: 8 }}>
          <span className="sk-underline">Ver mapa del barrio</span>
        </div>
      </div>

      <div className="sk-h3" style={{ marginTop: 2, fontWeight: 700 }}>Lo más reclamado:</div>
      <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
        {[
          { k:'residuos', t:'Recolección irregular', n: 8 },
          { k:'energia', t:'Luminarias apagadas', n: 4 },
          { k:'agua', t:'Pérdidas en vía pública', n: 2 },
        ].map(r => (
          <div key={r.k} className="sk-border-soft" style={{ padding: 10, display:'flex', alignItems:'center', gap: 10 }}>
            <SvcIcon kind={r.k} size={36} />
            <div className="sk-body" style={{ flex: 1 }}>{r.t}</div>
            <div className="sk-chip" style={{ fontSize: 11 }}>×{r.n}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }}></div>
      <button className="sk-btn sk-btn-danger sk-btn-big sk-btn-block" style={{ marginTop: 4 }}>
        ＋ Hacer un reclamo
      </button>

      <SkBottomNav active="home" />
    </div>
  );
}

Object.assign(window, { HomeA, HomeB, HomeC, HomeD });
