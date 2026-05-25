// admin-dashboard.jsx — Dashboard (2 variantes)

// KPI mini card
function KPI({ label, value, trend, trendDir = 'down', sub }) {
  return (
    <div className="adm-card adm-kpi">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {(trend || sub) && (
        <div style={{ display:'flex', alignItems:'baseline', gap: 8 }}>
          {trend && <span className={'trend ' + trendDir}>{trendDir === 'down' ? '↓' : '↑'} {trend}</span>}
          {sub && <span className="adm-small" style={{ color: 'var(--muted)', fontSize: 12 }}>{sub}</span>}
        </div>
      )}
    </div>
  );
}

// Sparkline-ish bar chart inline
function MiniBars({ data, color = 'var(--c-blue-l)', height = 40 }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1, height: `${(v/max)*100}%`, background: color, opacity: 0.65 + (v/max)*0.35,
          borderRadius: '2px 2px 0 0', minHeight: 2,
        }}></div>
      ))}
    </div>
  );
}

// Donut por servicio (svg)
function DonutByService({ data, size = 160 }) {
  const total = data.reduce((s,d) => s + d.v, 0);
  let acc = 0;
  const r = size/2 - 10;
  const cx = size/2, cy = size/2;
  const seg = data.map((d) => {
    const frac = d.v / total;
    const start = acc * Math.PI * 2 - Math.PI/2;
    const end = (acc + frac) * Math.PI * 2 - Math.PI/2;
    acc += frac;
    const large = frac > 0.5 ? 1 : 0;
    const x1 = cx + Math.cos(start) * r;
    const y1 = cy + Math.sin(start) * r;
    const x2 = cx + Math.cos(end) * r;
    const y2 = cy + Math.sin(end) * r;
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: d.color, label: d.label, v: d.v };
  });
  return (
    <div style={{ display:'flex', alignItems:'center', gap: 20 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {seg.map((s, i) => <path key={i} d={s.d} fill={s.color} stroke="var(--paper)" strokeWidth="2" />)}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="var(--paper)" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontFamily="Open Sans" fontWeight="700" fontSize="22" fill="var(--navy)">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontFamily="Open Sans" fontSize="11" fill="var(--muted)">este mes</text>
      </svg>
      <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
        {seg.map((s, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color }}></span>
            <span style={{ fontSize: 13, color:'var(--navy)', fontWeight: 600 }}>{s.label}</span>
            <span style={{ fontSize: 12, color:'var(--muted)', marginLeft: 'auto' }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Line chart simple (svg)
function LineChart({ data, height = 130, color = 'var(--navy-2)' }) {
  const max = Math.max(...data);
  const step = 100 / (data.length - 1);
  const pts = data.map((v, i) => [i * step, 100 - (v/max) * 90]);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  const area = path + ` L 100 100 L 0 100 Z`;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width:'100%', height }}>
      <defs>
        <linearGradient id="lc-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lc-grad)" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="1.2" fill={color} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────
// Dashboard A · Clásico
// ─────────────────────────────────────────────
function DashboardA() {
  const donut = [
    { label:'Residuos',    v: 55, color: 'var(--c-green)' },
    { label:'Electricidad', v: 41, color: 'var(--c-yellow)' },
    { label:'Agua',        v: 28, color: 'var(--c-blue-l)' },
    { label:'Transporte',  v: 12, color: 'var(--c-red)' },
  ];
  const line = [12, 16, 14, 22, 18, 27, 24, 30, 26, 34, 31, 38];
  const bars = [4, 6, 9, 5, 8, 12, 7, 14, 10, 9, 13, 11, 15];

  return (
    <AdminShell active="dashboard" crumbs={['Panel', 'Dashboard']}>
      <div className="adm-pagehead">
        <div>
          <h1>Buen día, María.</h1>
          <div className="sub">Esto está pasando hoy en los servicios públicos de Comodoro.</div>
        </div>
        <div className="actions">
          <div className="btn">Últimos 30 días ▾</div>
          <div className="btn btn-primary">＋ Reclamo manual</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 16, marginBottom: 18 }}>
        <KPI label="Abiertos" value="136" trend="+12 vs semana ant." trendDir="up" />
        <KPI label="Resueltos (7d)" value="84" trend="−1.3d tiempo prom." trendDir="down" />
        <KPI label="Tiempo prom." value="5,2d" sub="meta SLA: 7d" />
        <KPI label="Satisfacción" value="4,1/5" sub="312 calificaciones" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap: 16, marginBottom: 18 }}>
        {/* Tendencia */}
        <div className="adm-card">
          <div style={{ display:'flex', alignItems:'baseline', marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Reclamos recibidos · 12 meses</div>
            <div style={{ marginLeft:'auto', display:'flex', gap: 6 }}>
              <span className="adm-filter active">Todos</span>
              <SvcTag kind="agua" /><SvcTag kind="energia" /><SvcTag kind="transporte" /><SvcTag kind="residuos" />
            </div>
          </div>
          <LineChart data={line} height={170} />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop: 6, color:'var(--muted)', fontSize: 11 }}>
            <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span><span>Jul</span><span>Ago</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dic</span>
          </div>
        </div>
        {/* Distribución */}
        <div className="adm-card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Distribución por servicio</div>
          <DonutByService data={donut} size={170} />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>
        {/* Hot spots */}
        <div className="adm-card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, display:'flex' }}>
            Zonas con más reclamos
            <span style={{ marginLeft:'auto', color:'var(--muted)', fontSize: 12, fontWeight: 500 }}>últimos 7 días</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
            {[
              { b:'Bº Pueyrredón',   n: 24, s:'agua' },
              { b:'Km 3',             n: 18, s:'residuos' },
              { b:'Bº Próspero Palazzo', n: 14, s:'energia' },
              { b:'Centro',           n: 11, s:'energia' },
              { b:'Bº Standard',      n: 7,  s:'transporte' },
            ].map((row, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap: 10 }}>
                <div style={{ fontSize: 12, color:'var(--muted)', width: 18 }}>#{i+1}</div>
                <div style={{ fontWeight: 600 }}>{row.b}</div>
                <SvcTag kind={row.s} />
                <div style={{ flex: 1, height: 8, background:'var(--paper-3)', borderRadius: 4, marginLeft: 8 }}>
                  <div style={{ width: `${(row.n/24)*100}%`, height: '100%', background:'var(--navy-2)', borderRadius: 4 }}></div>
                </div>
                <div style={{ fontWeight: 700, width: 28, textAlign:'right' }}>{row.n}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas */}
        <div className="adm-card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, display:'flex' }}>
            Alertas
            <span style={{ marginLeft:'auto', color:'var(--c-red)', fontSize: 12, fontWeight: 700 }}>3 nuevas</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap: 10, padding: '10px 12px', border:'1px solid #f1b3b3', background:'#fcdede', borderRadius: 10 }}>
              <span style={{ fontSize: 18 }}>⚠</span>
              <div style={{ flex: 1, fontSize: 13 }}>
                <div style={{ fontWeight: 700 }}>Cluster de 5 reclamos · Agua</div>
                <div style={{ color:'var(--muted)' }}>Av. Rivadavia 2200–2400 · últimas 3hs</div>
              </div>
              <button className="btn" style={{ padding:'4px 10px', fontSize: 12 }}>Ver</button>
            </div>
            <div style={{ display:'flex', alignItems:'flex-start', gap: 10, padding: '10px 12px', border:'1px solid #f0d394', background:'#ffe9c2', borderRadius: 10 }}>
              <span style={{ fontSize: 18 }}>◷</span>
              <div style={{ flex: 1, fontSize: 13 }}>
                <div style={{ fontWeight: 700 }}>SLA en riesgo · 8 reclamos</div>
                <div style={{ color:'var(--muted)' }}>vencen en &lt; 24hs</div>
              </div>
              <button className="btn" style={{ padding:'4px 10px', fontSize: 12 }}>Revisar</button>
            </div>
            <div style={{ display:'flex', alignItems:'flex-start', gap: 10, padding: '10px 12px', border:'1px solid var(--line)', background:'var(--paper-2)', borderRadius: 10 }}>
              <span style={{ fontSize: 18 }}>↗</span>
              <div style={{ flex: 1, fontSize: 13 }}>
                <div style={{ fontWeight: 700 }}>Pico de reclamos · Electricidad</div>
                <div style={{ color:'var(--muted)' }}>+42% vs promedio · hoy</div>
              </div>
              <button className="btn" style={{ padding:'4px 10px', fontSize: 12 }}>Ver</button>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

// ─────────────────────────────────────────────
// Dashboard B · Operativo (foco en cola y SLA)
// ─────────────────────────────────────────────
function DashboardB() {
  return (
    <AdminShell active="dashboard" role="Gestor del Ente" crumbs={['Panel', 'Dashboard operativo']}>
      <div className="adm-pagehead">
        <div>
          <h1>Operación · hoy</h1>
          <div className="sub">25 May · Comodoro Rivadavia · turno mañana</div>
        </div>
        <div className="actions">
          <div className="btn">Exportar</div>
          <div className="btn btn-primary">Tomar siguiente reclamo</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 16, marginBottom: 18 }}>
        {[
          { label:'Sin asignar', value:'28', dot: 'var(--c-red)' },
          { label:'En revisión', value:'14', dot: 'var(--c-yellow)' },
          { label:'En obra',     value:'42', dot: 'var(--c-blue-l)' },
          { label:'Resueltos hoy', value:'9', dot: 'var(--c-green)' },
        ].map((k,i) => (
          <div key={i} className="adm-card" style={{ borderLeft: `4px solid ${k.dot}` }}>
            <div style={{ color:'var(--muted)', fontSize: 11, fontWeight: 700, textTransform:'uppercase', letterSpacing: '0.04em' }}>{k.label}</div>
            <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, marginTop: 4 }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 16 }}>
        <div className="adm-card">
          <div style={{ display:'flex', alignItems:'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 700 }}>SLA por servicio</div>
            <span style={{ marginLeft:'auto', color:'var(--muted)', fontSize: 12 }}>meta · objetivo del Ente</span>
          </div>
          <table style={{ width:'100%', borderCollapse:'separate', borderSpacing: 0, fontSize: 13 }}>
            <tbody>
              {[
                { k:'agua',      meta: '5d', real: '4,2d', cumple: 92 },
                { k:'energia',   meta: '3d', real: '3,8d', cumple: 71 },
                { k:'transporte',meta: '7d', real: '6,1d', cumple: 88 },
                { k:'residuos',  meta: '2d', real: '1,8d', cumple: 95 },
              ].map((r,i) => (
                <tr key={i} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 0', width: 160 }}><SvcTag kind={r.k} /></td>
                  <td style={{ padding: '10px 0', color:'var(--muted)' }}>meta {r.meta}</td>
                  <td style={{ padding: '10px 0', fontWeight: 700 }}>{r.real}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 8, background:'var(--paper-3)', borderRadius: 4 }}>
                        <div style={{ width: `${r.cumple}%`, height:'100%', background: r.cumple >= 85 ? 'var(--c-green)' : r.cumple >= 75 ? 'var(--c-yellow)' : 'var(--c-red)', borderRadius: 4 }}></div>
                      </div>
                      <div style={{ fontWeight: 700, width: 36, textAlign:'right' }}>{r.cumple}%</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="adm-card">
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Por prestadora</div>
          <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
            {[
              { n:'SCPL — Agua y Cloacas', t: 28, ok: 23, svc:'agua' },
              { n:'Coop. Eléctrica',       t: 41, ok: 30, svc:'energia' },
              { n:'Patagonia Buses',       t: 12, ok: 10, svc:'transporte' },
              { n:'Servicios Urbanos S.A.',t: 55, ok: 48, svc:'residuos' },
            ].map((p,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap: 10 }}>
                <SvcTag kind={p.svc} withName={false} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.n}</div>
                  <div style={{ color:'var(--muted)', fontSize: 11 }}>{p.ok} de {p.t} en término</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{Math.round(p.ok/p.t*100)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

Object.assign(window, { DashboardA, DashboardB, KPI, MiniBars, DonutByService, LineChart });
