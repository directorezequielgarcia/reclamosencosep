// admin-extras.jsx — Mapa operativo, Analítica, Prestadoras, Usuarios

// ─────────────────────────────────────────────
// Mapa operativo (vista geográfica para gestores)
// ─────────────────────────────────────────────
function MapaOperativo() {
  const dots = [
    { c:'var(--c-blue-l)', t:'18%', l:'12%', s:'agua' },
    { c:'var(--c-yellow)', t:'22%', l:'34%', s:'energia' },
    { c:'var(--c-green)',  t:'24%', l:'60%', s:'residuos' },
    { c:'var(--c-green)',  t:'27%', l:'62%', s:'residuos' },
    { c:'var(--c-yellow)', t:'34%', l:'20%', s:'energia' },
    { c:'var(--c-red)',    t:'42%', l:'50%', s:'transporte', big:true, n: 5 },
    { c:'var(--c-blue-l)', t:'50%', l:'58%', s:'agua' },
    { c:'var(--c-green)',  t:'58%', l:'28%', s:'residuos' },
    { c:'var(--c-yellow)', t:'62%', l:'72%', s:'energia' },
    { c:'var(--c-blue-l)', t:'72%', l:'45%', s:'agua' },
    { c:'var(--c-red)',    t:'78%', l:'80%', s:'transporte' },
    { c:'var(--c-green)',  t:'82%', l:'18%', s:'residuos' },
  ];
  return (
    <AdminShell active="mapa" crumbs={['Panel', 'Mapa operativo']}>
      <div className="adm-pagehead">
        <div>
          <h1>Mapa operativo</h1>
          <div className="sub">98 reclamos activos en Comodoro Rivadavia · vista en vivo</div>
        </div>
        <div className="actions">
          <div className="btn">Capas ▾</div>
          <div className="btn">Heatmap</div>
          <div className="btn btn-primary">Exportar GIS</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap: 16, height: 'calc(100% - 60px)' }}>
        <div className="adm-card" style={{ padding: 0, position:'relative', overflow:'hidden', minHeight: 540 }}>
          <div style={{
            position:'absolute', inset: 0,
            background: 'var(--paper-2)',
            backgroundImage: 'linear-gradient(to right, rgba(29,53,80,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(29,53,80,0.06) 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}>
            {/* "carreteras" */}
            <div style={{ position:'absolute', top:'30%', left: 0, right: 0, height: 20, background:'var(--paper)' }}></div>
            <div style={{ position:'absolute', top:'62%', left: 0, right: 0, height: 16, background:'var(--paper)' }}></div>
            <div style={{ position:'absolute', top: 0, bottom: 0, left:'40%', width: 18, background:'var(--paper)' }}></div>
            <div style={{ position:'absolute', top: 0, bottom: 0, left:'70%', width: 14, background:'var(--paper)' }}></div>

            {/* labels barrios */}
            <div style={{ position:'absolute', top:'12%', left:'7%', color:'var(--muted)', fontSize: 12, fontWeight: 600 }}>Km 3</div>
            <div style={{ position:'absolute', top:'42%', left:'7%', color:'var(--muted)', fontSize: 12, fontWeight: 600 }}>Pueyrredón</div>
            <div style={{ position:'absolute', top:'40%', left:'74%', color:'var(--muted)', fontSize: 12, fontWeight: 600 }}>Centro</div>
            <div style={{ position:'absolute', top:'85%', left:'45%', color:'var(--muted)', fontSize: 12, fontWeight: 600 }}>Próspero Palazzo</div>

            {dots.map((d, i) => (
              <div key={i} style={{
                position:'absolute', top: d.t, left: d.l, transform:'translate(-50%, -50%)',
                width: d.big ? 36 : 14, height: d.big ? 36 : 14, borderRadius: '50%',
                background: d.c, border: '2px solid var(--paper)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'var(--paper)', fontSize: 12, fontWeight: 800, cursor:'pointer'
              }}>{d.big ? `×${d.n}` : ''}</div>
            ))}

            {/* Leyenda */}
            <div style={{ position:'absolute', bottom: 14, left: 14, background:'var(--paper)', border:'1px solid var(--line)', borderRadius: 10, padding: 12, fontSize: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Leyenda</div>
              <div style={{ display:'flex', flexDirection:'column', gap: 4 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius:'50%', background:'var(--c-blue-l)' }}></span> Agua</div>
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius:'50%', background:'var(--c-yellow)' }}></span> Electricidad</div>
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius:'50%', background:'var(--c-red)' }}></span> Transporte</div>
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius:'50%', background:'var(--c-green)' }}></span> Residuos</div>
                <div style={{ borderTop: '1px solid var(--line)', marginTop: 6, paddingTop: 6, color:'var(--muted)' }}>Círculo grande = cluster</div>
              </div>
            </div>

            {/* Controles zoom */}
            <div style={{ position:'absolute', top: 14, right: 14, display:'flex', flexDirection:'column', gap: 6 }}>
              <span className="adm-iconbtn">＋</span>
              <span className="adm-iconbtn">－</span>
              <span className="adm-iconbtn">⌖</span>
            </div>
          </div>
        </div>

        {/* Panel lateral */}
        <aside style={{ display:'flex', flexDirection:'column', gap: 14, overflow:'auto' }}>
          <div className="adm-card">
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Filtros</div>
            <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
              <label style={{ display:'flex', alignItems:'center', gap: 8 }}>
                <input type="checkbox" defaultChecked /> Todos los servicios
              </label>
              {['agua','energia','transporte','residuos'].map(k => (
                <label key={k} style={{ display:'flex', alignItems:'center', gap: 8, marginLeft: 16 }}>
                  <input type="checkbox" defaultChecked /> <SvcTag kind={k} />
                </label>
              ))}
              <div style={{ borderTop:'1px solid var(--line)', margin:'4px 0' }}></div>
              <label style={{ display:'flex', alignItems:'center', gap: 8 }}>
                <input type="checkbox" defaultChecked /> Solo abiertos
              </label>
              <label style={{ display:'flex', alignItems:'center', gap: 8 }}>
                <input type="checkbox" /> Vencen en &lt; 24hs
              </label>
              <label style={{ display:'flex', alignItems:'center', gap: 8 }}>
                <input type="checkbox" /> Solo clusters
              </label>
            </div>
          </div>

          <div className="adm-card">
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Cluster seleccionado</div>
            <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 6 }}>
              <SvcTag kind="transporte" />
              <span style={{ marginLeft:'auto', fontWeight: 700, color:'var(--c-red)' }}>5 reclamos</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Línea 8 · Km 3</div>
            <div style={{ color:'var(--muted)', fontSize: 12, marginBottom: 8 }}>Frecuencia irregular reportada en 3 días</div>
            <div style={{ display:'flex', gap: 6 }}>
              <button className="btn" style={{ flex: 1 }}>Ver lista</button>
              <button className="btn btn-primary" style={{ flex: 1 }}>Tratar como uno</button>
            </div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

// ─────────────────────────────────────────────
// Analítica
// ─────────────────────────────────────────────
function Analitica() {
  return (
    <AdminShell active="analitica" crumbs={['Panel', 'Analítica']}>
      <div className="adm-pagehead">
        <div>
          <h1>Analítica</h1>
          <div className="sub">Tendencias y desempeño · personalizable</div>
        </div>
        <div className="actions">
          <div className="btn">Período: 2026 ▾</div>
          <div className="btn">⇧ Exportar PDF</div>
          <div className="btn btn-primary">＋ Reporte</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="adm-card">
          <div style={{ display:'flex', alignItems:'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 700 }}>Reclamos por mes</div>
            <span style={{ marginLeft:'auto', display:'flex', gap: 4 }}>
              <span className="adm-filter active">Acumulado</span>
              <span className="adm-filter">Por servicio</span>
            </span>
          </div>
          <LineChart data={[42, 51, 49, 63, 58, 71, 68, 80, 76, 95, 88, 102]} height={180} color="var(--navy-2)" />
        </div>

        <div className="adm-card">
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Composición por servicio</div>
          <DonutByService
            data={[
              { label:'Residuos',    v: 348, color: 'var(--c-green)' },
              { label:'Electricidad', v: 261, color: 'var(--c-yellow)' },
              { label:'Agua',        v: 180, color: 'var(--c-blue-l)' },
              { label:'Transporte',  v: 82,  color: 'var(--c-red)' },
            ]}
            size={180}
          />
        </div>
      </div>

      <div className="adm-card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Mapa de calor por barrio</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap: 4 }}>
          {['Pueyrredón','Centro','Km 3','Roca','Standard','Próspero P.','Industrial','LaLoma','Saavedra','Belgrano','30 de Oct','Don Bosco','Quirno C.','13 de Dic','Ciudadela','Astra'].map((b, i) => {
            const intensity = Math.random();
            return (
              <div key={i} style={{
                padding: '14px 10px', borderRadius: 8, background: `rgba(196, 57, 60, ${0.15 + intensity * 0.55})`,
                color: intensity > 0.6 ? 'var(--paper)' : 'var(--navy)', fontSize: 12, fontWeight: 600
              }}>
                <div>{b}</div>
                <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>{Math.round(8 + intensity * 40)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>
        <div className="adm-card">
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Tiempo de resolución por servicio</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize: 13 }}>
            <tbody>
              {[
                { k:'agua',       prom:'4,2d', mejor:'1d', peor:'18d' },
                { k:'energia',    prom:'3,8d', mejor:'2h', peor:'12d' },
                { k:'transporte', prom:'6,1d', mejor:'1d', peor:'30d' },
                { k:'residuos',   prom:'1,8d', mejor:'4h', peor:'9d' },
              ].map((r,i) => (
                <tr key={i} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 0', width: 130 }}><SvcTag kind={r.k} /></td>
                  <td style={{ padding: '10px 0' }}><strong style={{ fontSize: 18 }}>{r.prom}</strong> <span style={{ color:'var(--muted)', fontSize: 12 }}>promedio</span></td>
                  <td style={{ padding: '10px 0', color:'var(--muted)', fontSize: 12 }}>min {r.mejor} · max {r.peor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="adm-card">
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Top problemas reportados</div>
          <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
            {[
              { t:'Recolección irregular', s:'residuos', n: 89 },
              { t:'Luminarias apagadas',   s:'energia', n: 71 },
              { t:'Pérdidas en vía pública', s:'agua', n: 53 },
              { t:'Frecuencia irregular', s:'transporte', n: 42 },
              { t:'Microbasurales',       s:'residuos', n: 31 },
            ].map((row, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap: 10 }}>
                <SvcTag kind={row.s} withName={false} />
                <div style={{ flex: 1, fontWeight: 600 }}>{row.t}</div>
                <div style={{ width: 120, height: 6, background:'var(--paper-3)', borderRadius: 3 }}>
                  <div style={{ width: `${(row.n/89)*100}%`, height:'100%', background:'var(--navy-2)', borderRadius: 3 }}></div>
                </div>
                <div style={{ width: 32, textAlign:'right', fontWeight: 700 }}>{row.n}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

// ─────────────────────────────────────────────
// Prestadoras
// ─────────────────────────────────────────────
function Prestadoras() {
  const rows = [
    { svc:'agua', n:'SCPL · Sociedad Coop. Popular Ltda.', email:'reclamos@scpl.coop', tel:'0297 446-7100', open: 38, sla: 92, contrato: 'vigente' },
    { svc:'energia', n:'Cooperativa Eléctrica Patagónica', email:'atencion@coopelec.com.ar', tel:'0297 444-2222', open: 41, sla: 71, contrato: 'vigente' },
    { svc:'transporte', n:'Patagonia Buses S.A.', email:'rrpp@patagoniabuses.ar', tel:'0297 449-0000', open: 12, sla: 88, contrato: 'vigente' },
    { svc:'residuos', n:'Servicios Urbanos S.A.', email:'gestion@suusa.com.ar', tel:'0297 447-3030', open: 55, sla: 95, contrato: 'renovar Dic 2026' },
  ];
  return (
    <AdminShell active="prestadoras" crumbs={['Panel', 'Prestadoras']}>
      <div className="adm-pagehead">
        <div>
          <h1>Prestadoras de servicios</h1>
          <div className="sub">Empresas y cooperativas bajo control del Ente</div>
        </div>
        <div className="actions">
          <div className="btn btn-primary">＋ Nueva prestadora</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>
        {rows.map((r, i) => (
          <div key={i} className="adm-card">
            <div style={{ display:'flex', alignItems:'flex-start', gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, border:'3px solid', borderColor: ({agua:'var(--c-blue-l)',energia:'var(--c-yellow)',transporte:'var(--c-red)',residuos:'var(--c-green)'})[r.svc], display:'flex', alignItems:'center', justifyContent:'center' }}>
                <SvcIcon kind={r.svc} size={40} ring={false} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{r.n}</div>
                <div style={{ color:'var(--muted)', fontSize: 12, marginTop: 2 }}>{r.email} · {r.tel}</div>
              </div>
              <span className="pill review" style={{ background: r.contrato === 'vigente' ? '#d6efdf' : '#ffe9c2', color: r.contrato === 'vigente' ? '#1d6d40' : '#6c4a00', borderColor: r.contrato === 'vigente' ? '#b9dec7' : '#f0d394' }}>{r.contrato}</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 12, marginTop: 14 }}>
              <div>
                <div style={{ color:'var(--muted)', fontSize: 11, fontWeight: 700 }}>RECLAMOS ACTIVOS</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{r.open}</div>
              </div>
              <div>
                <div style={{ color:'var(--muted)', fontSize: 11, fontWeight: 700 }}>CUMPLIMIENTO SLA</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: r.sla >= 85 ? 'var(--c-green)' : r.sla >= 75 ? 'var(--c-yellow)' : 'var(--c-red)' }}>{r.sla}%</div>
              </div>
              <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'flex-end' }}>
                <button className="btn">Ver ficha →</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

// ─────────────────────────────────────────────
// Usuarios y roles
// ─────────────────────────────────────────────
function Usuarios() {
  const rows = [
    { n:'María Rodríguez', email:'m.rodriguez@encosep.gob.ar', rol:'Super admin', ult:'hoy · 9:12', estado:'activo', ini:'MR', col:'var(--c-orange)' },
    { n:'Carlos Domínguez', email:'c.dominguez@encosep.gob.ar', rol:'Gestor del Ente', ult:'hoy · 8:30', estado:'activo', ini:'CD', col:'var(--c-blue-l)' },
    { n:'Lucía Núñez', email:'l.nunez@encosep.gob.ar', rol:'Gestor del Ente', ult:'ayer · 17:45', estado:'activo', ini:'LN', col:'var(--c-green)' },
    { n:'Op. SCPL Agua', email:'op-agua@scpl.coop', rol:'Operador prestadora', ult:'hoy · 11:00', estado:'activo', ini:'SC', col:'var(--c-blue-l)' },
    { n:'Op. Coop. Eléctrica', email:'op@coopelec.com.ar', rol:'Operador prestadora', ult:'hoy · 10:15', estado:'activo', ini:'CE', col:'var(--c-yellow)' },
    { n:'Auditor Defensoría', email:'auditor@defensoria.gob.ar', rol:'Auditor (solo lectura)', ult:'hace 3d', estado:'activo', ini:'AD', col:'var(--navy-soft)' },
    { n:'J. Pérez', email:'j.perez@encosep.gob.ar', rol:'Gestor del Ente', ult:'hace 21d', estado:'suspendido', ini:'JP', col:'var(--muted)' },
  ];
  return (
    <AdminShell active="usuarios" crumbs={['Panel', 'Usuarios y roles']}>
      <div className="adm-pagehead">
        <div>
          <h1>Usuarios y roles</h1>
          <div className="sub">Quién puede acceder al panel · permisos por rol</div>
        </div>
        <div className="actions">
          <div className="btn">Roles y permisos</div>
          <div className="btn btn-primary">＋ Invitar usuario</div>
        </div>
      </div>

      <div className="adm-tabs">
        <div className="adm-tab active"><span>Todos</span><span className="count">{rows.length}</span></div>
        <div className="adm-tab"><span>Ente</span><span className="count">4</span></div>
        <div className="adm-tab"><span>Prestadoras</span><span className="count">2</span></div>
        <div className="adm-tab"><span>Auditoría</span><span className="count">1</span></div>
        <div className="adm-tab"><span>Suspendidos</span><span className="count">1</span></div>
      </div>

      <div className="adm-card" style={{ padding: 0, overflow:'hidden' }}>
        <table className="adm-table">
          <thead>
            <tr>
              <th style={{ width: 28 }}><input type="checkbox" /></th>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Último acceso</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u, i) => (
              <tr key={i}>
                <td><input type="checkbox" /></td>
                <td>
                  <div className="who">
                    <span className="avatar" style={{ background: u.col }}>{u.ini}</span>
                    <div style={{ fontWeight: 600 }}>{u.n}</div>
                  </div>
                </td>
                <td style={{ color:'var(--muted)' }}>{u.email}</td>
                <td><span className="pill assigned">{u.rol}</span></td>
                <td style={{ color:'var(--muted)', fontSize: 12 }}>{u.ult}</td>
                <td>
                  {u.estado === 'activo'
                    ? <span className="pill resolved">activo</span>
                    : <span className="pill closed">suspendido</span>}
                </td>
                <td><span style={{ color:'var(--muted)', cursor:'pointer' }}>⋯</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16 }} className="adm-card">
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Roles definidos</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 12 }}>
          {[
            { n:'Super admin', d:'Acceso total al sistema, configuración y facturación.', i: 1 },
            { n:'Gestor del Ente', d:'Recibe, revisa, asigna y cierra reclamos. Acceso a analítica.', i: 3 },
            { n:'Operador prestadora', d:'Solo ve reclamos asignados a su prestadora. Actualiza estado.', i: 6 },
            { n:'Auditor (solo lectura)', d:'Acceso de consulta a métricas y reclamos cerrados.', i: 2 },
          ].map((r, i) => (
            <div key={i} style={{ border:'1px solid var(--line)', borderRadius: 10, padding: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{r.n}</div>
              <div style={{ color:'var(--muted)', fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>{r.d}</div>
              <div style={{ marginTop: 10, fontSize: 12, color:'var(--muted)' }}>{r.i} {r.i === 1 ? 'persona' : 'personas'} · <a href="#" style={{ color:'var(--navy-2)' }}>permisos</a></div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

// ─────────────────────────────────────────────
// Login admin
// ─────────────────────────────────────────────
function AdminLogin() {
  return (
    <div style={{ height: '100%', display:'flex', background:'var(--paper-2)', fontFamily: 'var(--font-base)' }}>
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #1d3550 0%, #2b4a6b 100%)', color:'var(--paper)', padding: 60, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        <div style={{ background:'var(--paper)', borderRadius: 12, padding: '8px 14px', alignSelf:'flex-start' }}>
          <img src="assets/encosep-logo.png" alt="EnCoSeP" style={{ height: 44, display:'block' }} />
        </div>
        <div>
          <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.1 }}>Panel de control<br/>de Servicios Públicos</div>
          <div style={{ fontSize: 14, opacity: 0.85, marginTop: 14, maxWidth: 440, lineHeight: 1.5 }}>
            Plataforma de gestión del Ente de Control de Servicios Públicos de Comodoro Rivadavia.
            Acceso restringido a personal autorizado.
          </div>
          <BrandStripe height={6} style={{ marginTop: 28, maxWidth: 320, borderRadius: 3 }} />
        </div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>© 2026 EnCoSeP · Comodoro Rivadavia</div>
      </div>

      <div style={{ width: 460, padding: 60, display:'flex', flexDirection:'column', justifyContent:'center', background:'var(--paper)' }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Iniciar sesión</div>
        <div style={{ color:'var(--muted)', fontSize: 13, marginBottom: 24 }}>Ingresá con tu cuenta institucional.</div>

        <label style={{ display:'block', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Email institucional</div>
          <input type="email" className="sk-input" defaultValue="m.rodriguez@encosep.gob.ar" />
        </label>
        <label style={{ display:'block', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Contraseña</div>
          <input type="password" className="sk-input" defaultValue="••••••••••" />
        </label>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 20 }}>
          <label style={{ fontSize: 13, display:'flex', alignItems:'center', gap: 6 }}>
            <input type="checkbox" /> Recordarme
          </label>
          <a href="#" style={{ fontSize: 13, color:'var(--navy-2)' }}>¿Olvidaste tu contraseña?</a>
        </div>
        <button className="btn btn-primary" style={{ width:'100%', padding:'12px', fontSize: 14 }}>Ingresar</button>

        <div style={{ margin:'20px 0', display:'flex', alignItems:'center', gap: 8 }}>
          <div style={{ flex: 1, height: 1, background:'var(--line)' }}></div>
          <span style={{ fontSize: 11, color:'var(--muted)' }}>O</span>
          <div style={{ flex: 1, height: 1, background:'var(--line)' }}></div>
        </div>

        <button className="btn" style={{ width:'100%' }}>🔐 Ingresar con MiArgentina</button>

        <div style={{ marginTop: 28, padding: 12, background:'var(--paper-2)', borderRadius: 8, fontSize: 12, color:'var(--muted)' }}>
          ⚠ Los accesos son auditados. Si necesitás una cuenta, contactá al administrador del sistema.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MapaOperativo, Analitica, Prestadoras, Usuarios, AdminLogin });
