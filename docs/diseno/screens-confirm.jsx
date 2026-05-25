// screens-confirm.jsx — Variantes de confirmación + seguimiento

// CA · Confirmación con código grande y siguiente paso
function ConfirmA() {
  return (
    <div className="sk-screen-body" style={{ gap: 10, position:'relative' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <EncosepMini size={28} />
        <span className="sk-small">✕</span>
      </div>

      <div style={{ textAlign:'center', marginTop: 8 }}>
        <div style={{
          width: 70, height: 70, borderRadius:'50%',
          border:'2.5px solid var(--ink)', background:'var(--c-green)',
          margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center',
          fontSize: 38, color:'var(--paper)', boxShadow:'3px 3px 0 var(--ink)'
        }}>✓</div>
        <div className="sk-h1" style={{ marginTop: 10 }}>¡Listo!</div>
        <div className="sk-body" style={{ opacity:0.7, marginTop: 4 }}>Tu reclamo fue registrado.</div>
      </div>

      <div className="sk-card" style={{ padding: 12, textAlign:'center' }}>
        <div className="sk-small">NÚMERO DE SEGUIMIENTO</div>
        <div className="sk-h1 c-blue-d" style={{ fontSize: 36, letterSpacing: 2, marginTop: 4 }}>A-2418</div>
        <div className="sk-small" style={{ marginTop: 4 }}>guardalo o sacale foto a esta pantalla</div>
      </div>

      <div className="sk-border-soft" style={{ padding: 10, display:'flex', alignItems:'center', gap: 10 }}>
        <SvcIcon kind="agua" size={32} />
        <div style={{ flex: 1, lineHeight: 1.15 }}>
          <div className="sk-body" style={{ fontWeight:'bold' }}>Pérdida en la calle</div>
          <div className="sk-small">Av. Rivadavia 2200, Pueyrredón</div>
        </div>
      </div>

      <div className="sk-small" style={{ opacity: 0.75, textAlign:'center' }}>
        Te avisaremos por <b>WhatsApp y email</b> cada vez que cambie.
      </div>

      <div style={{ flex: 1 }}></div>
      <div className="sk-btn sk-btn-primary sk-btn-block">Ver el estado</div>
      <div className="sk-btn sk-btn-block">Hacer otro reclamo</div>

      <Note style={{ position:'absolute', top: 140, right: -90, width: 90, transform:'rotate(5deg)' }}>
        Código<br/>HUMANO,<br/>memorizable
      </Note>
    </div>
  );
}

// CB · Seguimiento (timeline)
function TrackA() {
  const steps = [
    { t:'Recibido', d:'Hoy · 14:32', done:true },
    { t:'En revisión', d:'Hoy · 16:10', done:true, active:true },
    { t:'Asignado a Aguas SCPL', d:'mañana est.', done:false },
    { t:'En obra', d:'2-3 días est.', done:false },
    { t:'Resuelto', d:'', done:false },
  ];
  return (
    <div className="sk-screen-body" style={{ gap: 10 }}>
      <SkHeader title="A-2418" sub="Pérdida · Agua" />
      <div className="sk-border-soft" style={{ padding: 10, display:'flex', alignItems:'center', gap: 10 }}>
        <SvcIcon kind="agua" size={32} />
        <div style={{ flex: 1, lineHeight: 1.1 }}>
          <div className="sk-body" style={{ fontWeight:'bold' }}>Pérdida en la calle</div>
          <div className="sk-small">Av. Rivadavia 2200</div>
        </div>
        <div className="sk-chip bg-yellow" style={{ fontWeight:'bold' }}>en revisión</div>
      </div>

      <div className="sk-h3" style={{ marginTop: 4, fontWeight:'bold' }}>Estado</div>

      <div style={{ position:'relative', paddingLeft: 22, display:'flex', flexDirection:'column', gap: 12 }}>
        <div style={{ position:'absolute', left: 8, top: 8, bottom: 8, width: 2, background:'var(--ink)', opacity: 0.3 }}></div>
        {steps.map((s,i) => (
          <div key={i} style={{ position:'relative' }}>
            <div style={{
              position:'absolute', left: -22, top: 2, width: 16, height: 16,
              border:'2px solid var(--ink)', borderRadius:'50%',
              background: s.done ? (s.active ? 'var(--c-yellow)' : 'var(--ink)') : 'var(--paper)'
            }}></div>
            <div className="sk-body" style={{ fontWeight: s.active ? 'bold' : 'normal', lineHeight:1.1 }}>{s.t}</div>
            <div className="sk-small">{s.d}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }}></div>
      <div className="sk-btn sk-btn-block">Agregar info / foto</div>
      <Note style={{ position:'absolute', top: 200, right: -90, width: 100, transform:'rotate(-4deg)' }}>
        Pasos en<br/>lenguaje<br/>cotidiano
      </Note>
    </div>
  );
}

// CC · Confirmación + share + acción comunitaria
function ConfirmB() {
  return (
    <div className="sk-screen-body" style={{ gap: 10, position:'relative' }}>
      <SkHeader title="Reclamo enviado" sub="A-2418" back={true} />

      <div className="sk-card bg-green" style={{ padding: 12, color:'var(--paper)' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius:'50%', background:'var(--paper)',
            border:'2px solid var(--ink)', display:'flex', alignItems:'center', justifyContent:'center',
            fontSize: 24, color:'var(--c-green)', fontWeight:'bold'
          }}>✓</div>
          <div style={{ flex: 1 }}>
            <div className="sk-h2" style={{ color:'var(--paper)' }}>Recibido</div>
            <div className="sk-small" style={{ color:'var(--paper)', opacity: 0.9 }}>A-2418 · Lo seguimos juntos.</div>
          </div>
        </div>
      </div>

      <div className="sk-card" style={{ padding: 12 }}>
        <div className="sk-body" style={{ fontWeight:'bold', marginBottom: 4 }}>👥 Otros vecinos reportaron lo mismo</div>
        <div className="sk-small" style={{ opacity: 0.8 }}>3 reclamos en la cuadra esta semana.</div>
        <div className="sk-btn" style={{ marginTop: 8, fontSize: 12 }}>Ver el grupo en el mapa →</div>
      </div>

      <div className="sk-card" style={{ padding: 12 }}>
        <div className="sk-body" style={{ fontWeight:'bold', marginBottom: 6 }}>Compartí con tus vecinos</div>
        <div style={{ display:'flex', gap: 6 }}>
          <div className="sk-chip" style={{ flex: 1, justifyContent:'center' }}>WhatsApp</div>
          <div className="sk-chip" style={{ flex: 1, justifyContent:'center' }}>Copiar link</div>
        </div>
      </div>

      <div style={{ flex: 1 }}></div>
      <div className="sk-btn sk-btn-primary sk-btn-block">Volver al inicio</div>

      <Note style={{ position:'absolute', top: 90, right: -90, width: 90, transform:'rotate(5deg)' }}>
        Detectar<br/>casos<br/>colectivos
      </Note>
    </div>
  );
}

Object.assign(window, { ConfirmA, TrackA, ConfirmB });
