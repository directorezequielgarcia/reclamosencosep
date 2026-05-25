// screens-extras.jsx — Mapa público + Estadísticas

// EXA · Mapa público de reclamos abiertos (transparencia)
function PublicMap() {
  return (
    <div className="sk-screen-body" style={{ gap: 8 }}>
      <SkHeader title="Reclamos en la ciudad" sub="público · transparencia" />

      <div style={{ display:'flex', gap: 4, flexWrap:'wrap' }}>
        <div className="sk-chip"><span style={{ width:8, height:8, borderRadius:'50%', background:'var(--c-blue-l)' }}></span>Agua 14</div>
        <div className="sk-chip"><span style={{ width:8, height:8, borderRadius:'50%', background:'var(--c-yellow)' }}></span>Electric. 22</div>
        <div className="sk-chip"><span style={{ width:8, height:8, borderRadius:'50%', background:'var(--c-red)' }}></span>Transp. 6</div>
        <div className="sk-chip"><span style={{ width:8, height:8, borderRadius:'50%', background:'var(--c-green)' }}></span>Resid. 31</div>
      </div>

      <div className="sk-map" style={{ flex: 1, position: 'relative', minHeight: 320 }}>
        <div className="sk-map-road" style={{ top: '18%', left: 0, right: 0, height: 12 }}></div>
        <div className="sk-map-road" style={{ top: '50%', left: 0, right: 0, height: 12 }}></div>
        <div className="sk-map-road" style={{ top: '78%', left: 0, right: 0, height: 12 }}></div>
        <div className="sk-map-road" style={{ top: 0, bottom: 0, left: '28%', width: 12 }}></div>
        <div className="sk-map-road" style={{ top: 0, bottom: 0, left: '64%', width: 12 }}></div>

        {/* dots */}
        {[
          { c:'var(--c-blue-l)', t:'14%', l:'15%' },
          { c:'var(--c-yellow)', t:'22%', l:'40%' },
          { c:'var(--c-green)',  t:'25%', l:'70%' },
          { c:'var(--c-green)',  t:'30%', l:'72%' },
          { c:'var(--c-yellow)', t:'42%', l:'18%' },
          { c:'var(--c-red)', t:'56%', l:'45%' },
          { c:'var(--c-blue-l)', t:'60%', l:'52%' },
          { c:'var(--c-green)',  t:'68%', l:'25%' },
          { c:'var(--c-yellow)', t:'70%', l:'70%' },
          { c:'var(--c-red)',    t:'42%', l:'62%', big:true, label:'×5' },
        ].map((d,i) => (
          <div key={i} style={{
            position:'absolute', top: d.t, left: d.l, transform:'translate(-50%,-50%)',
            width: d.big? 30 : 14, height: d.big? 30 : 14, borderRadius:'50%',
            background: d.c, border:'1.5px solid var(--ink)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'var(--paper)', fontFamily:'"Patrick Hand"', fontSize: 11
          }}>{d.label || ''}</div>
        ))}

        <div className="sk-small" style={{ position:'absolute', top: '8%', left: '5%', opacity: 0.6 }}>· Km 3</div>
        <div className="sk-small" style={{ position:'absolute', top: '52%', left: '67%', opacity: 0.6 }}>· Centro</div>
        <div className="sk-small" style={{ position:'absolute', top: '85%', left: '40%', opacity: 0.6 }}>· Pueyrredón</div>
      </div>

      <div className="sk-border-soft" style={{ padding: 8, display:'flex', alignItems:'center', gap: 6 }}>
        <span>🔍</span>
        <span className="sk-small" style={{ flex: 1 }}>Buscar barrio o calle</span>
        <span className="sk-chip" style={{ fontSize: 10 }}>filtros</span>
      </div>

      <SkBottomNav active="map" />

      <Note style={{ position:'absolute', top: 110, right: -100, width: 110, transform:'rotate(-4deg)' }}>
        Cluster rojo<br/>= reclamos<br/>repetidos<br/>(prioridad alta)
      </Note>
    </div>
  );
}

// EXB · Estadísticas por servicio/barrio
function StatsScreen() {
  const bars = [
    { svc:'agua', col:'var(--c-blue-l)', a: 14, r: 28 },
    { svc:'energia', col:'var(--c-yellow)', a: 22, r: 41 },
    { svc:'transporte', col:'var(--c-red)', a: 6, r: 12 },
    { svc:'residuos', col:'var(--c-green)', a: 31, r: 55 },
  ];
  const max = 60;
  return (
    <div className="sk-screen-body" style={{ gap: 10 }}>
      <SkHeader title="Estadísticas" sub="Pueyrredón · últimos 30 días" />

      <div style={{ display:'flex', gap: 6 }}>
        <div className="sk-chip" style={{ background:'var(--ink)', color:'var(--paper)' }}>30 días</div>
        <div className="sk-chip">Trimestre</div>
        <div className="sk-chip">Año</div>
      </div>

      <div className="sk-card" style={{ padding: 10 }}>
        <div className="sk-small">RESUELTOS / ABIERTOS POR SERVICIO</div>
        <div style={{ display:'flex', flexDirection:'column', gap: 8, marginTop: 8 }}>
          {bars.map(b => (
            <div key={b.svc} style={{ display:'flex', alignItems:'center', gap: 8 }}>
              <SvcIcon kind={b.svc} size={26} />
              <div style={{ flex: 1 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 2, height: 14 }}>
                  <div style={{ width: `${(b.r/max)*100}%`, height:'100%', background: b.col, border:'1.5px solid var(--ink)', borderRadius: 3 }}></div>
                  <div style={{ width: `${(b.a/max)*100}%`, height:'100%', background:'var(--paper-3)', border:'1.5px solid var(--ink)', borderLeft:'none', borderRadius: 3 }}></div>
                </div>
                <div className="sk-small" style={{ marginTop: 2 }}>{b.r} resueltos · {b.a} abiertos</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sk-card" style={{ padding: 10 }}>
        <div className="sk-small">TIEMPO PROMEDIO DE RESOLUCIÓN</div>
        <div style={{ display:'flex', alignItems:'baseline', gap: 8, marginTop: 4 }}>
          <div className="sk-h1" style={{ fontSize: 40 }}>5,2</div>
          <div className="sk-body">días</div>
          <div className="sk-chip c-green" style={{ marginLeft:'auto', fontSize: 11 }}>↓ 1,3 vs mes pasado</div>
        </div>
        <div style={{ height: 40, marginTop: 8, position:'relative',
          background:'repeating-linear-gradient(to right, transparent 0 19%, rgba(0,0,0,0.08) 19% 20%)'
        }}>
          <svg viewBox="0 0 100 40" style={{ width:'100%', height:'100%' }} preserveAspectRatio="none">
            <polyline points="0,30 15,28 30,32 45,22 60,20 75,15 90,12 100,10"
              fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className="sk-small" style={{ textAlign:'center', opacity: 0.6 }}>
        Datos abiertos · descargar CSV
      </div>

      <SkBottomNav active="map" />

      <Note style={{ position:'absolute', top: 220, left: -90, width: 100, transform:'rotate(-5deg)' }}>
        Doble-barra =<br/>resueltos<br/>vs abiertos
      </Note>
    </div>
  );
}

Object.assign(window, { PublicMap, StatsScreen });
