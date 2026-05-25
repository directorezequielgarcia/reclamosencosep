// admin-inbox.jsx — Bandeja de reclamos (2 variantes)

const INBOX_ROWS = [
  { id:'A-2418', svc:'agua', title:'Pérdida en la calle', addr:'Av. Rivadavia 2200, Pueyrredón', who:'Vega, Juana', dni:'27.345.678', when:'hoy · 14:32', status:'review', prio:'alta', assigned:null, group: 5 },
  { id:'A-2417', svc:'residuos', title:'Camión no pasó', addr:'Pje. Valdivia 435, Centro', who:'Aguilar, M.', dni:'31.001.221', when:'hoy · 13:08', status:'new', prio:'media', assigned:null },
  { id:'A-2416', svc:'energia', title:'Foco apagado en plaza', addr:'Pza. Centenario', who:'Núñez, L.', dni:'24.880.110', when:'hoy · 11:21', status:'assigned', prio:'baja', assigned:'Coop. Eléctrica' },
  { id:'A-2415', svc:'transporte', title:'Línea 8 no pasa', addr:'Km 3 · parada 42', who:'Pereyra, R.', dni:'29.401.998', when:'hoy · 10:02', status:'work', prio:'media', assigned:'Patagonia Buses' },
  { id:'A-2414', svc:'agua', title:'Sin presión', addr:'Bº Standard, mz 12', who:'Coronel, P.', dni:'22.110.045', when:'ayer · 19:44', status:'work', prio:'media', assigned:'SCPL Agua' },
  { id:'A-2413', svc:'residuos', title:'Microbasural', addr:'Bº Próspero Palazzo', who:'Salazar, F.', dni:'33.450.700', when:'ayer · 18:11', status:'urgent', prio:'alta', assigned:null },
  { id:'A-2412', svc:'energia', title:'Corte parcial', addr:'Av. Roca 1500', who:'Domínguez, A.', dni:'19.667.301', when:'ayer · 16:55', status:'resolved', prio:'alta', assigned:'Coop. Eléctrica' },
  { id:'A-2411', svc:'agua', title:'Cloaca tapada', addr:'Bº Roca 245', who:'Mansilla, V.', dni:'30.221.890', when:'ayer · 14:20', status:'review', prio:'media', assigned:null },
  { id:'A-2410', svc:'transporte', title:'Parada sin refugio', addr:'Av. Polonia 100', who:'Toledo, E.', dni:'28.998.110', when:'ayer · 12:00', status:'closed', prio:'baja', assigned:'Patagonia Buses' },
];

// ─────────────────────────────────────────────
// A · Tabla densa (power user)
// ─────────────────────────────────────────────
function InboxA() {
  return (
    <AdminShell active="inbox" crumbs={['Panel', 'Bandeja de reclamos']}>
      <div className="adm-pagehead">
        <div>
          <h1>Bandeja de reclamos</h1>
          <div className="sub">98 reclamos · 28 sin asignar · 8 vencen hoy</div>
        </div>
        <div className="actions">
          <div className="btn">⇧ Exportar</div>
          <div className="btn">⤓ Importar</div>
          <div className="btn btn-primary">＋ Reclamo manual</div>
        </div>
      </div>

      {/* Tabs por estado */}
      <div className="adm-tabs">
        <div className="adm-tab"><span>Todos</span><span className="count">98</span></div>
        <div className="adm-tab active"><span>Sin asignar</span><span className="count">28</span></div>
        <div className="adm-tab"><span>En revisión</span><span className="count">14</span></div>
        <div className="adm-tab"><span>Asignados</span><span className="count">12</span></div>
        <div className="adm-tab"><span>En obra</span><span className="count">42</span></div>
        <div className="adm-tab"><span>Cerrados</span><span className="count">132</span></div>
      </div>

      {/* Filtros */}
      <div className="adm-filter-bar">
        <span className="adm-filter">Servicio ▾</span>
        <span className="adm-filter active">⚪ Agua ⊗</span>
        <span className="adm-filter">Prestadora ▾</span>
        <span className="adm-filter">Barrio ▾</span>
        <span className="adm-filter">Prioridad ▾</span>
        <span className="adm-filter">Vence en ▾</span>
        <span className="adm-filter">Fecha ▾</span>
        <span style={{ marginLeft:'auto', color:'var(--muted)', fontSize: 12 }}>9 resultados · ordenar por: <strong style={{ color:'var(--navy)' }}>Más antiguo ▾</strong></span>
      </div>

      {/* Tabla */}
      <div className="adm-card" style={{ padding: 0, overflow:'hidden' }}>
        <table className="adm-table">
          <thead>
            <tr>
              <th style={{ width: 28 }}><input type="checkbox" /></th>
              <th>ID</th>
              <th>Servicio</th>
              <th>Reclamo</th>
              <th>Vecino</th>
              <th>Ubicación</th>
              <th>Creado</th>
              <th>Estado</th>
              <th>Prio.</th>
              <th>Asignado a</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {INBOX_ROWS.map((r) => (
              <tr key={r.id}>
                <td><input type="checkbox" /></td>
                <td><span className="id">{r.id}</span>{r.group && <span title={`${r.group} reclamos similares`} style={{ marginLeft: 6, fontSize: 11, color:'var(--c-red)', fontWeight: 700 }}>×{r.group}</span>}</td>
                <td><SvcTag kind={r.svc} /></td>
                <td style={{ fontWeight: 600, maxWidth: 220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.title}</td>
                <td>
                  <div className="who">
                    <span className="avatar">{r.who.split(',')[0].slice(0,1)+(r.who.split(' ').pop()||'').slice(0,1)}</span>
                    <div style={{ lineHeight: 1.2 }}>
                      <div>{r.who}</div>
                      <div style={{ color:'var(--muted)', fontSize: 11 }}>{r.dni}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color:'var(--muted)', fontSize: 12, maxWidth: 200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.addr}</td>
                <td style={{ color:'var(--muted)', fontSize: 12 }}>{r.when}</td>
                <td><StatusPill status={r.status} /></td>
                <td><Priority level={r.prio} /></td>
                <td style={{ color: r.assigned ? 'var(--navy)' : 'var(--muted)', fontWeight: r.assigned ? 600 : 400 }}>
                  {r.assigned || '— sin asignar —'}
                </td>
                <td><span style={{ color:'var(--muted)', cursor:'pointer' }}>⋯</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop: 14 }}>
        <div style={{ color:'var(--muted)', fontSize: 12 }}>Mostrando 1–9 de 28</div>
        <div style={{ display:'flex', gap: 4 }}>
          <span className="btn" style={{ padding:'6px 10px' }}>‹</span>
          <span className="btn btn-primary" style={{ padding:'6px 12px' }}>1</span>
          <span className="btn" style={{ padding:'6px 10px' }}>2</span>
          <span className="btn" style={{ padding:'6px 10px' }}>3</span>
          <span className="btn" style={{ padding:'6px 10px' }}>›</span>
        </div>
      </div>
    </AdminShell>
  );
}

// ─────────────────────────────────────────────
// B · Kanban por estado (visual / colaborativo)
// ─────────────────────────────────────────────
function InboxB() {
  const cols = [
    { id:'new',      title: 'Sin asignar', color: 'var(--c-red)',     items: INBOX_ROWS.filter(r => r.status === 'new' || r.status === 'urgent' || r.status === 'review' && !r.assigned) },
    { id:'review',   title: 'En revisión', color: 'var(--c-yellow)',  items: INBOX_ROWS.filter(r => r.status === 'review') },
    { id:'work',     title: 'En obra',     color: 'var(--c-blue-l)',  items: INBOX_ROWS.filter(r => r.status === 'work' || r.status === 'assigned') },
    { id:'done',     title: 'Resueltos',   color: 'var(--c-green)',   items: INBOX_ROWS.filter(r => r.status === 'resolved' || r.status === 'closed') },
  ];
  return (
    <AdminShell active="inbox" crumbs={['Panel', 'Bandeja', 'Tablero']}>
      <div className="adm-pagehead">
        <div>
          <h1>Tablero de reclamos</h1>
          <div className="sub">Arrastrá tarjetas para cambiar de estado · vista en vivo</div>
        </div>
        <div className="actions">
          <div className="btn">Vista lista</div>
          <div className="btn">Filtros (2)</div>
          <div className="btn btn-primary">＋ Reclamo manual</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 14, alignItems:'flex-start' }}>
        {cols.map(col => (
          <div key={col.id} style={{ background:'var(--paper-2)', borderRadius: 12, border:'1px solid var(--line)', padding: 12, minHeight: 480 }}>
            <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }}></span>
              <div style={{ fontWeight: 700 }}>{col.title}</div>
              <div style={{ marginLeft:'auto', background:'var(--paper)', border:'1px solid var(--line)', borderRadius: 999, padding: '0 8px', fontSize: 11, fontWeight: 700 }}>{col.items.length}</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
              {col.items.map(r => (
                <div key={r.id} className="adm-card" style={{ padding: 12, boxShadow: '0 1px 0 var(--line)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 6 }}>
                    <SvcTag kind={r.svc} withName={false} />
                    <span className="id" style={{ fontWeight: 600 }}>{r.id}</span>
                    {r.group && <span style={{ fontSize: 10, color:'var(--c-red)', fontWeight: 700, marginLeft: 4 }}>×{r.group} similares</span>}
                    <span style={{ marginLeft:'auto' }}><Priority level={r.prio} /></span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{r.title}</div>
                  <div style={{ color:'var(--muted)', fontSize: 11, marginBottom: 8, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.addr}</div>
                  <div style={{ display:'flex', alignItems:'center', gap: 8, color:'var(--muted)', fontSize: 11 }}>
                    <span>{r.when}</span>
                    {r.assigned && <><span>·</span><span style={{ fontWeight: 600, color:'var(--navy)' }}>{r.assigned}</span></>}
                  </div>
                </div>
              ))}
              <div style={{ padding: 10, border:'1.5px dashed var(--line-strong)', borderRadius: 10, color:'var(--muted)', fontSize: 12, textAlign:'center', cursor:'pointer' }}>＋ agregar</div>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

Object.assign(window, { InboxA, InboxB });
