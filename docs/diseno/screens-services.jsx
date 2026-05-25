// screens-services.jsx — Variantes de selección de servicio + Login

// ─────────────────────────────────────────────
// LOGIN — DNI obligatorio
// ─────────────────────────────────────────────
function LoginA() {
  return (
    <div className="sk-screen-body" style={{ gap: 12, justifyContent: 'flex-start' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
        <EncosepMini size={70} />
      </div>
      <div className="sk-h2" style={{ textAlign: 'center', marginTop: 6 }}>Ingresá con tu DNI</div>
      <div className="sk-small" style={{ textAlign: 'center', opacity: 0.7, marginTop: -8 }}>para hacer y seguir tus reclamos</div>

      <div style={{ marginTop: 12 }}>
        <div className="sk-small" style={{ marginBottom: 4 }}>Número de DNI</div>
        <div className="sk-input">27.345.678</div>
      </div>
      <div>
        <div className="sk-small" style={{ marginBottom: 4 }}>Sexo (como figura en DNI)</div>
        <div style={{ display:'flex', gap: 8 }}>
          <div className="sk-chip" style={{ flex: 1, justifyContent: 'center' }}>F</div>
          <div className="sk-chip" style={{ flex: 1, justifyContent: 'center', background:'var(--ink)', color:'var(--paper)' }}>M</div>
          <div className="sk-chip" style={{ flex: 1, justifyContent: 'center' }}>X</div>
        </div>
      </div>
      <div>
        <div className="sk-small" style={{ marginBottom: 4 }}>Nº de trámite</div>
        <div className="sk-input">00123456789</div>
        <div className="sk-small" style={{ marginTop: 2 }}>👁  ¿dónde lo encuentro?</div>
      </div>

      <div className="sk-btn sk-btn-primary sk-btn-big sk-btn-block" style={{ marginTop: 6 }}>Ingresar</div>
      <div className="sk-small" style={{ textAlign: 'center' }}>
        <span className="sk-underline">No tengo cuenta · Crear</span>
      </div>

      <Note style={{ position:'absolute', bottom: 110, right: -90, width: 100, transform:'rotate(4deg)' }}>
        Validar contra<br/>RENAPER →
      </Note>
    </div>
  );
}

// ─────────────────────────────────────────────
// SELECCIÓN DE SERVICIO
// ─────────────────────────────────────────────

// SA · Grilla 2x2 grande (la que probablemente gana)
function ServSelA() {
  return (
    <div className="sk-screen-body" style={{ gap: 10 }}>
      <SkHeader title="Nuevo reclamo" sub="Paso 1 de 4 · Servicio" />
      <div className="sk-h2" style={{ marginTop: 4 }}>¿Sobre qué servicio?</div>
      <div className="sk-small" style={{ opacity: 0.7 }}>Tocá una opción</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6, flex: 1 }}>
        <SvcCard kind="agua" label="Agua y Saneamiento" size="md" />
        <SvcCard kind="energia" label="Electricidad e Iluminación" size="md" />
        <SvcCard kind="transporte" label="Transporte Público" size="md" />
        <SvcCard kind="residuos" label="Gestión de Residuos" size="md" />
      </div>

      <div className="sk-small" style={{ textAlign: 'center', marginTop: 4 }}>
        ¿No sabés cuál? <span className="sk-underline">Preguntanos</span>
      </div>

      <Note style={{ position:'absolute', top: 180, right: -100, width: 110, transform:'rotate(6deg)' }}>
        Iconos a color =<br/>fáciles de<br/>distinguir
      </Note>
    </div>
  );
}

// SB · Lista vertical con descripción
function ServSelB() {
  const items = [
    { k:'agua', t:'Agua y Saneamiento', d:'Falta de agua, pérdidas, cloacas' },
    { k:'energia', t:'Electricidad e Iluminación', d:'Cortes, postes, alumbrado público' },
    { k:'transporte', t:'Transporte Público', d:'Frecuencias, paradas, líneas' },
    { k:'residuos', t:'Gestión de Residuos', d:'Recolección, contenedores, micro-basurales' },
  ];
  return (
    <div className="sk-screen-body" style={{ gap: 8 }}>
      <SkHeader title="Elegí el servicio" sub="Paso 1 de 4" />
      <div className="sk-h2" style={{ marginTop: 2 }}>¿De qué se trata?</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
        {items.map(it => (
          <div key={it.k} className="sk-card" style={{ display:'flex', alignItems:'center', gap:12, padding: 10 }}>
            <SvcIcon kind={it.k} size={42} />
            <div style={{ flex: 1, lineHeight: 1.15 }}>
              <div className="sk-body" style={{ fontWeight:'bold' }}>{it.t}</div>
              <div className="sk-small">{it.d}</div>
            </div>
            <span style={{ fontSize: 18 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// SC · Modo "tipográfico" — palabras enormes
function ServSelC() {
  return (
    <div className="sk-screen-body" style={{ gap: 0, padding: 0 }}>
      <div style={{ padding: '8px 14px' }}>
        <SkHeader title="" sub="" back={true} />
        <div className="sk-h3" style={{ marginTop: 4 }}>¿De qué servicio?</div>
      </div>
      <div style={{ flex: 1, display:'flex', flexDirection:'column' }}>
        {[
          { k:'agua', t:'AGUA', col:'var(--c-blue-l)' },
          { k:'energia', t:'ELECTRICIDAD', col:'var(--c-yellow)' },
          { k:'transporte', t:'TRANSPORTE', col:'var(--c-red)' },
          { k:'residuos', t:'RESIDUOS', col:'var(--c-green)' },
        ].map((it,i) => (
          <div key={it.k} className="bg-paper-row" style={{
            flex: 1, display:'flex', alignItems:'center', gap: 12, padding: '0 16px',
            borderTop: '1.5px solid var(--ink)',
            background: i % 2 === 0 ? 'var(--paper)' : 'var(--paper-2)',
          }}>
            <SvcIcon kind={it.k} size={42} />
            <div className="sk-h1" style={{ fontSize: 30, color: it.col, flex: 1 }}>{it.t}</div>
            <span style={{ fontSize: 22 }}>›</span>
          </div>
        ))}
      </div>
      <Note style={{ position:'absolute', top: 90, right: -90, width: 100, transform:'rotate(-5deg)' }}>
        Tipografía<br/>JUMBO,<br/>muy accesible
      </Note>
    </div>
  );
}

// SD · Mapa-categoría: elegís sobre un croquis de Comodoro
function ServSelD() {
  return (
    <div className="sk-screen-body" style={{ gap: 8 }}>
      <SkHeader title="¿Qué pasa cerca?" sub="Paso 1 · servicio" />
      <div className="sk-body" style={{ opacity: 0.7 }}>Tocá un ícono cerca de donde está el problema</div>

      <div className="sk-map" style={{ flex: 1, position: 'relative', minHeight: 280 }}>
        <div className="sk-map-road" style={{ top: '30%', left: 0, right: 0, height: 14 }}></div>
        <div className="sk-map-road" style={{ top: '65%', left: 0, right: 0, height: 14 }}></div>
        <div className="sk-map-road" style={{ top: 0, bottom: 0, left: '40%', width: 14 }}></div>
        <div className="sk-map-road" style={{ top: 0, bottom: 0, left: '75%', width: 14 }}></div>

        <div style={{ position:'absolute', top: '12%', left:'20%' }}><SvcCard kind="agua" label="" size="sm" /></div>
        <div style={{ position:'absolute', top: '50%', left:'55%' }}><SvcCard kind="energia" label="" size="sm" /></div>
        <div style={{ position:'absolute', top: '20%', left:'78%' }}><SvcCard kind="transporte" label="" size="sm" /></div>
        <div style={{ position:'absolute', top: '72%', left:'15%' }}><SvcCard kind="residuos" label="" size="sm" /></div>

        <div style={{
          position:'absolute', bottom: 8, left: 8, right: 8,
          padding: '6px 10px', background: 'var(--paper)', borderRadius: 8,
          border: '1px solid var(--ink)', display: 'flex', alignItems:'center', gap: 6
        }}>
          <span style={{ fontSize: 14 }}>◎</span>
          <span className="sk-body" style={{ fontSize: 12 }}>Tu ubicación · Av. Rivadavia 2200</span>
        </div>
      </div>

      <Note style={{ position:'absolute', top: 130, left: -90, width: 100, transform:'rotate(-6deg)' }}>
        Variante<br/>experimental:<br/>elegís en el<br/>mapa
      </Note>
    </div>
  );
}

Object.assign(window, { LoginA, ServSelA, ServSelB, ServSelC, ServSelD });
