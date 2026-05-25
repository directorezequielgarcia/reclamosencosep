// screens-location.jsx — Variantes para ubicar el problema

// LA · Mapa interactivo con pin
function LocA() {
  return (
    <div className="sk-screen-body" style={{ gap: 8 }}>
      <SkHeader title="¿Dónde está el problema?" sub="Paso 2" />
      <div className="sk-body" style={{ opacity: 0.7 }}>Arrastrá el pin al lugar exacto</div>

      <div className="sk-map" style={{ flex: 1, position: 'relative', minHeight: 280 }}>
        <div className="sk-map-road" style={{ top: '28%', left: 0, right: 0, height: 14 }}></div>
        <div className="sk-map-road" style={{ top: '60%', left: 0, right: 0, height: 14 }}></div>
        <div className="sk-map-road" style={{ top: 0, bottom: 0, left: '30%', width: 14 }}></div>
        <div className="sk-map-road" style={{ top: 0, bottom: 0, left: '68%', width: 14 }}></div>

        {/* Bloques de manzanas */}
        <div className="sk-small" style={{ position:'absolute', top: '10%', left: '8%' }}>· Pueyrredón</div>
        <div className="sk-small" style={{ position:'absolute', top: '40%', left: '70%' }}>· Centro</div>

        {/* PIN central */}
        <div style={{ position:'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -100%)', textAlign:'center' }}>
          <div style={{
            width: 28, height: 28, background: 'var(--c-red)', border:'2px solid var(--ink)',
            borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)',
            margin: '0 auto', boxShadow: '2px 2px 0 var(--ink)'
          }}></div>
          <div style={{ width: 8, height: 8, borderRadius:'50%', background:'var(--ink)', margin:'2px auto 0' }}></div>
        </div>
      </div>

      <div className="sk-card" style={{ padding: 10 }}>
        <div className="sk-small">DIRECCIÓN DETECTADA</div>
        <div className="sk-body" style={{ fontWeight:'bold' }}>Av. Rivadavia 2200</div>
        <div className="sk-small">Bº Pueyrredón · Comodoro Rivadavia</div>
      </div>

      <div style={{ display:'flex', gap: 8 }}>
        <div className="sk-btn" style={{ flex: 1 }}>← Atrás</div>
        <div className="sk-btn sk-btn-primary" style={{ flex: 2 }}>Confirmar →</div>
      </div>

      <Note style={{ position:'absolute', top: 90, right: -90, width: 100, transform:'rotate(5deg)' }}>
        Pin con<br/>shadow lo-fi<br/>+ snap a calle
      </Note>
    </div>
  );
}

// LB · Dirección escrita + barrio dropdown
function LocB() {
  return (
    <div className="sk-screen-body" style={{ gap: 10 }}>
      <SkHeader title="¿Dónde está el problema?" sub="Paso 2" />
      <div className="sk-body" style={{ opacity: 0.7 }}>Decinos la dirección o referencia</div>

      <div>
        <div className="sk-small" style={{ marginBottom: 4 }}>Calle y altura</div>
        <div className="sk-input">Av. Rivadavia 2200</div>
        <div className="sk-small" style={{ marginTop: 2 }}>* o esquina con otra calle</div>
      </div>
      <div>
        <div className="sk-small" style={{ marginBottom: 4 }}>Barrio</div>
        <div className="sk-input" style={{ display:'flex', justifyContent:'space-between' }}>
          <span>Pueyrredón</span><span>▾</span>
        </div>
      </div>
      <div>
        <div className="sk-small" style={{ marginBottom: 4 }}>Referencia (opcional)</div>
        <div className="sk-border-soft" style={{ padding: 8, minHeight: 50 }}>
          <FillLine w="86%" /><FillLine w="56%" />
        </div>
      </div>

      <div className="sk-border-dashed" style={{ padding: 8, display:'flex', alignItems:'center', gap: 8 }}>
        <div style={{ fontSize: 22 }}>◎</div>
        <div style={{ flex: 1 }}>
          <div className="sk-body" style={{ fontWeight:'bold' }}>Usar mi ubicación</div>
          <div className="sk-small">si estás cerca del problema</div>
        </div>
      </div>

      <div style={{ flex: 1 }}></div>
      <div style={{ display:'flex', gap: 8 }}>
        <div className="sk-btn" style={{ flex: 1 }}>← Atrás</div>
        <div className="sk-btn sk-btn-primary" style={{ flex: 2 }}>Continuar →</div>
      </div>

      <Note style={{ position:'absolute', top: 80, left: -90, width: 100, transform:'rotate(-5deg)' }}>
        Sin mapa,<br/>solo texto<br/>↘ baja data
      </Note>
    </div>
  );
}

// LC · GPS automático con ajuste posterior
function LocC() {
  return (
    <div className="sk-screen-body" style={{ gap: 10, alignItems:'stretch' }}>
      <SkHeader title="Usando tu ubicación..." sub="Paso 2" />

      <div style={{ display:'flex', justifyContent:'center', marginTop: 14 }}>
        <div style={{
          width: 120, height: 120, borderRadius:'50%',
          border:'2.5px solid var(--ink)',
          display:'flex', alignItems:'center', justifyContent:'center',
          background: 'radial-gradient(circle, var(--c-blue-l) 0%, transparent 70%)',
          position:'relative'
        }}>
          <div style={{
            position:'absolute', inset: 24, borderRadius:'50%', border:'2px dashed var(--ink)',
          }}></div>
          <div style={{
            width: 18, height: 18, borderRadius:'50%', background:'var(--c-red)', border:'2px solid var(--ink)'
          }}></div>
        </div>
      </div>

      <div className="sk-h2" style={{ textAlign:'center', marginTop: 4 }}>Te ubicamos acá</div>
      <div className="sk-body" style={{ textAlign:'center', opacity: 0.7, marginTop: -8 }}>
        Av. Rivadavia 2200, Pueyrredón
      </div>

      <div className="sk-card" style={{ padding: 10 }}>
        <div className="sk-small" style={{ fontWeight:'bold' }}>¿Es correcto?</div>
        <div style={{ display:'flex', gap: 6, marginTop: 6 }}>
          <div className="sk-btn" style={{ flex: 1, fontSize: 13 }}>Ajustar en mapa</div>
          <div className="sk-btn" style={{ flex: 1, fontSize: 13 }}>Escribir dirección</div>
        </div>
      </div>

      <div style={{ flex: 1 }}></div>
      <div className="sk-btn sk-btn-primary sk-btn-big sk-btn-block">Sí, es acá →</div>

      <Note style={{ position:'absolute', top: 220, right: -90, width: 100, transform:'rotate(4deg)' }}>
        GPS primero,<br/>pero SIEMPRE<br/>permite editar
      </Note>
    </div>
  );
}

Object.assign(window, { LocA, LocB, LocC });
