// screens-form.jsx — Variantes del formulario paso a paso

// ─────────────────────────────────────────────
// FA · Wizard clásico, un paso por pantalla
// ─────────────────────────────────────────────
function FormA() {
  return (
    <div className="sk-screen-body" style={{ gap: 10 }}>
      <SkHeader title="Reclamo · Agua" sub="Paso 2 de 4 · Detalle" />
      {/* Progreso */}
      <div style={{ display: 'flex', gap: 4, alignItems:'center' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 6, borderRadius: 3,
            background: i <= 2 ? 'var(--ink)' : 'var(--paper-3)',
            border: '1px solid var(--ink)'
          }}></div>
        ))}
      </div>
      <div className="sk-small">2 / 4 pasos</div>

      <div className="sk-h2">¿Qué pasa exactamente?</div>
      <div className="sk-small" style={{ opacity: 0.7, marginTop: -8 }}>Elegí una opción</div>

      <div style={{ display:'flex', flexDirection:'column', gap: 6, marginTop: 4 }}>
        {['No tengo agua','Sale poca / con baja presión','Pérdida en la calle','Cloaca tapada / desborde','Agua turbia o con olor','Otro'].map((t,i) => (
          <div key={i} className="sk-border-soft" style={{
            display:'flex', alignItems:'center', gap: 10, padding: '10px 12px',
            background: i === 2 ? 'var(--paper-3)' : 'var(--paper)'
          }}>
            <div style={{
              width: 18, height: 18, border: '1.5px solid var(--ink)', borderRadius: '50%',
              background: i === 2 ? 'var(--ink)' : 'transparent'
            }}></div>
            <div className="sk-body">{t}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }}></div>
      <div style={{ display:'flex', gap: 8 }}>
        <div className="sk-btn" style={{ flex: 1 }}>← Atrás</div>
        <div className="sk-btn sk-btn-primary" style={{ flex: 2 }}>Siguiente →</div>
      </div>

      <Note style={{ position:'absolute', top: 130, right: -90, width: 100, transform:'rotate(5deg)' }}>
        Opciones, NO<br/>texto libre<br/>(low literacy)
      </Note>
    </div>
  );
}

// ─────────────────────────────────────────────
// FB · Wizard con foto / voz / texto (multimodal)
// ─────────────────────────────────────────────
function FormB() {
  return (
    <div className="sk-screen-body" style={{ gap: 10 }}>
      <SkHeader title="Contanos qué pasa" sub="Paso 3 de 4 · Evidencia" />
      <div style={{ display: 'flex', gap: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex:1, height:6, borderRadius:3, background: i<=3?'var(--ink)':'var(--paper-3)', border:'1px solid var(--ink)'}}></div>
        ))}
      </div>

      <div className="sk-h2" style={{ marginTop: 4 }}>Sumá una foto o<br/>contanos en audio</div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8, marginTop: 6 }}>
        <div className="sk-card" style={{ padding: 14, textAlign:'center', aspectRatio:'1/1', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', gap: 6 }}>
          <div style={{ fontSize: 32 }}>📷</div>
          <div className="sk-body" style={{ fontWeight:'bold' }}>Foto</div>
          <div className="sk-small">cámara o galería</div>
        </div>
        <div className="sk-card" style={{ padding: 14, textAlign:'center', aspectRatio:'1/1', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', gap: 6 }}>
          <div style={{ fontSize: 32 }}>🎙</div>
          <div className="sk-body" style={{ fontWeight:'bold' }}>Audio</div>
          <div className="sk-small">explicalo hablando</div>
        </div>
      </div>

      <div className="sk-small" style={{ textAlign:'center', marginTop: 2, opacity: 0.7 }}>— o si preferís escribir —</div>

      <div className="sk-border-soft" style={{ padding: 10, minHeight: 70 }}>
        <FillLine w="92%" /><FillLine w="78%" /><FillLine w="60%" />
      </div>

      <div className="sk-card" style={{ padding: 8, display:'flex', gap: 8, alignItems:'center', marginTop: 4 }}>
        <ImgSlot h={50} label="foto 1" />
        <div className="sk-border-dashed" style={{ width: 50, height: 50, display:'flex', alignItems:'center', justifyContent:'center', color: 'var(--ink-soft)' }}>＋</div>
      </div>

      <div style={{ flex: 1 }}></div>
      <div style={{ display:'flex', gap: 8 }}>
        <div className="sk-btn" style={{ flex: 1 }}>← Atrás</div>
        <div className="sk-btn sk-btn-primary" style={{ flex: 2 }}>Continuar →</div>
      </div>

      <Note style={{ position:'absolute', top: 100, left: -90, width: 100, transform:'rotate(-5deg)' }}>
        Audio para<br/>gente que no<br/>escribe rápido
      </Note>
    </div>
  );
}

// ─────────────────────────────────────────────
// FC · Una sola pantalla, scroll (single-page form)
// ─────────────────────────────────────────────
function FormC() {
  return (
    <div className="sk-screen-body" style={{ gap: 10, overflow:'hidden' }}>
      <SkHeader title="Nuevo reclamo" sub="Completá lo que sepas" />
      <div style={{ overflow:'hidden', flex: 1, display:'flex', flexDirection:'column', gap: 10 }}>
        <div>
          <div className="sk-small" style={{ marginBottom: 4, fontWeight:'bold' }}>① Servicio</div>
          <div className="sk-input" style={{ display:'flex', alignItems:'center', gap: 8 }}>
            <SvcIcon kind="agua" size={22} />
            <span style={{ color:'var(--ink)' }}>Agua y Saneamiento</span>
            <span style={{ marginLeft:'auto' }}>▾</span>
          </div>
        </div>
        <div>
          <div className="sk-small" style={{ marginBottom: 4, fontWeight:'bold' }}>② Problema</div>
          <div className="sk-input"><span>Pérdida en la calle ▾</span></div>
        </div>
        <div>
          <div className="sk-small" style={{ marginBottom: 4, fontWeight:'bold' }}>③ Dónde</div>
          <div className="sk-input"><span>Av. Rivadavia 2200, Pueyrredón</span></div>
          <div className="sk-small" style={{ marginTop: 2 }}>◎ usar mi ubicación</div>
        </div>
        <div>
          <div className="sk-small" style={{ marginBottom: 4, fontWeight:'bold' }}>④ Detalle (opcional)</div>
          <div className="sk-border-soft" style={{ padding: 8, minHeight: 50 }}>
            <FillLine w="88%" /><FillLine w="64%" />
          </div>
        </div>
        <div>
          <div className="sk-small" style={{ marginBottom: 4, fontWeight:'bold' }}>⑤ Evidencia</div>
          <div style={{ display:'flex', gap: 6 }}>
            <ImgSlot h={44} label="foto" />
            <div className="sk-border-dashed" style={{ flex: 1, height: 44, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--ink-soft)', fontSize: 11 }}>＋ agregar</div>
          </div>
        </div>
      </div>

      <div className="sk-btn sk-btn-primary sk-btn-big sk-btn-block">Enviar reclamo</div>

      <Note style={{ position:'absolute', bottom: 60, right: -80, width: 90, transform:'rotate(5deg)' }}>
        Todo a la vista,<br/>1 sola pantalla
      </Note>
    </div>
  );
}

// ─────────────────────────────────────────────
// FD · Conversacional — tipo chat
// ─────────────────────────────────────────────
function FormD() {
  const Bubble = ({ who, children, bg }) => (
    <div style={{ alignSelf: who==='bot'?'flex-start':'flex-end', maxWidth:'80%' }}>
      <div className="sk-border-soft" style={{
        padding: '8px 10px',
        background: bg || (who==='bot' ? 'var(--paper)' : 'var(--paper-3)'),
        borderRadius: who==='bot' ? '14px 14px 14px 4px' : '14px 14px 4px 14px'
      }}>
        <div className="sk-body">{children}</div>
      </div>
    </div>
  );
  return (
    <div className="sk-screen-body" style={{ gap: 8 }}>
      <SkHeader title="Asistente EnCoSeP" sub="te ayudo paso a paso" />
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap: 8, paddingTop: 4 }}>
        <Bubble who="bot">Hola Vec! ¿De qué querés hablar?</Bubble>
        <Bubble who="me">💧 Agua</Bubble>
        <Bubble who="bot">¿Qué pasa con el agua?</Bubble>
        <Bubble who="me">Pérdida en la calle</Bubble>
        <Bubble who="bot">¿Está cerca tuyo? Mando tu ubicación 📍</Bubble>
        <div style={{ alignSelf:'flex-end', display:'flex', gap: 6 }}>
          <div className="sk-chip">Sí, mandala</div>
          <div className="sk-chip">Otra dirección</div>
        </div>
      </div>
      <div className="sk-input" style={{ marginTop: 4, justifyContent:'space-between' }}>
        <span>Escribí o decí... 🎙</span>
        <span>➤</span>
      </div>

      <Note style={{ position:'absolute', top: 110, right: -100, width: 110, transform:'rotate(-4deg)' }}>
        Variante<br/>conversacional<br/>↘ accesible<br/>para mayores
      </Note>
    </div>
  );
}

Object.assign(window, { FormA, FormB, FormC, FormD });
