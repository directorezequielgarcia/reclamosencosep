// admin-detail.jsx — Workspace de detalle de un reclamo

function DetailA() {
  return (
    <AdminShell active="inbox" crumbs={['Panel', 'Bandeja', 'A-2418 · Pérdida en la calle']}>
      <div className="adm-pagehead">
        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
          <button className="btn" style={{ padding: '6px 10px' }}>‹ Volver</button>
          <SvcTag kind="agua" />
          <div>
            <h1 style={{ fontSize: 20 }}>Pérdida en la calle</h1>
            <div className="sub">
              <span className="id" style={{ fontWeight: 700, color: 'var(--navy)' }}>A-2418</span>
              <span style={{ margin:'0 8px', color:'var(--line-strong)' }}>·</span>
              Creado hoy · 14:32 por Juana Vega
              <span style={{ margin:'0 8px', color:'var(--line-strong)' }}>·</span>
              <span style={{ color:'var(--c-red)', fontWeight: 700 }}>Vence en 11h</span>
            </div>
          </div>
        </div>
        <div className="actions">
          <div className="btn">Imprimir</div>
          <div className="btn">⋯ Más</div>
          <div className="btn btn-primary">Marcar resuelto</div>
        </div>
      </div>

      <div className="adm-detail-grid">
        {/* LEFT — datos */}
        <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
          {/* Estado / banner */}
          <div className="adm-card" style={{ display:'flex', alignItems:'center', gap: 14, borderLeft: '4px solid var(--c-yellow)', padding: 14 }}>
            <StatusPill status="review" />
            <div style={{ flex: 1, fontSize: 13 }}>
              <div style={{ fontWeight: 700 }}>En revisión por el Ente</div>
              <div style={{ color:'var(--muted)' }}>5 reclamos similares en la misma cuadra · podría ser un único caso.</div>
            </div>
            <button className="btn">Ver grupo (5)</button>
          </div>

          {/* Descripción */}
          <div className="adm-card">
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Descripción del vecino</div>
            <p style={{ margin: 0, lineHeight: 1.5, fontSize: 14 }}>
              "Hay una pérdida importante en la vereda hace 3 días. Sale agua sin parar y se está
              haciendo barro en la calle. No es la primera vez en esta cuadra."
            </p>
            <div style={{ display:'flex', gap: 10, marginTop: 14 }}>
              <div style={{
                width: 130, height: 95, borderRadius: 10, border:'1px solid var(--line)',
                background: 'repeating-linear-gradient(45deg, var(--paper-2) 0 8px, var(--paper-3) 8px 9px)',
                display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', fontSize: 11, fontFamily:'ui-monospace, monospace'
              }}>[ foto 1 ]</div>
              <div style={{
                width: 130, height: 95, borderRadius: 10, border:'1px solid var(--line)',
                background: 'repeating-linear-gradient(45deg, var(--paper-2) 0 8px, var(--paper-3) 8px 9px)',
                display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', fontSize: 11, fontFamily:'ui-monospace, monospace'
              }}>[ foto 2 ]</div>
              <div style={{
                width: 130, height: 95, borderRadius: 10, border:'1px solid var(--line)',
                background: 'var(--paper-2)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 4, color:'var(--navy)'
              }}>
                <span style={{ fontSize: 22 }}>♪</span>
                <span style={{ fontSize: 11 }}>audio · 0:42</span>
              </div>
            </div>
          </div>

          {/* Ubicación / mapa */}
          <div className="adm-card">
            <div style={{ display:'flex', alignItems:'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 700 }}>Ubicación</div>
              <div style={{ marginLeft:'auto', color:'var(--muted)', fontSize: 12 }}>Av. Rivadavia 2200 · Bº Pueyrredón</div>
            </div>
            <div style={{
              height: 240, borderRadius: 10, border:'1px solid var(--line)', position:'relative', overflow:'hidden',
              background: 'var(--paper-2)',
              backgroundImage: 'linear-gradient(to right, rgba(29,53,80,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(29,53,80,0.06) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}>
              {/* carreteras */}
              <div style={{ position:'absolute', top:'45%', left: 0, right: 0, height: 18, background:'var(--paper)', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)' }}></div>
              <div style={{ position:'absolute', top: 0, bottom: 0, left:'45%', width: 18, background:'var(--paper)', borderLeft:'1px solid var(--line)', borderRight:'1px solid var(--line)' }}></div>
              {/* otros pins (cluster) */}
              {[
                { t:'42%', l:'30%' }, { t:'40%', l:'52%' }, { t:'55%', l:'48%' }, { t:'58%', l:'40%' },
              ].map((p,i) => (
                <div key={i} style={{ position:'absolute', top: p.t, left: p.l, transform:'translate(-50%, -50%)', width: 12, height: 12, borderRadius:'50%', background:'var(--c-blue-l)', border:'1.5px solid var(--paper)' }}></div>
              ))}
              {/* pin principal */}
              <div style={{ position:'absolute', top:'48%', left:'46%', transform:'translate(-50%, -100%)' }}>
                <div style={{
                  width: 24, height: 24, background: 'var(--c-red)', border:'2px solid var(--paper)',
                  borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', boxShadow:'0 4px 8px rgba(0,0,0,0.2)'
                }}></div>
              </div>
              <div style={{ position:'absolute', bottom: 10, left: 10, background:'var(--paper)', border:'1px solid var(--line)', borderRadius: 8, padding: '6px 10px', fontSize: 12 }}>
                <div style={{ fontWeight: 700 }}>Av. Rivadavia 2200</div>
                <div style={{ color:'var(--muted)', fontSize: 11 }}>Lat -45.87 · Lon -67.50</div>
              </div>
              <div style={{ position:'absolute', top: 10, right: 10, display:'flex', flexDirection:'column', gap: 4 }}>
                <span className="adm-iconbtn">＋</span>
                <span className="adm-iconbtn">－</span>
              </div>
            </div>
          </div>

          {/* Historial / actividad */}
          <div className="adm-card">
            <div style={{ display:'flex', alignItems:'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700 }}>Actividad</div>
              <span style={{ marginLeft:'auto', display:'inline-flex', gap: 6 }}>
                <span className="adm-filter active">Todo</span>
                <span className="adm-filter">Estados</span>
                <span className="adm-filter">Notas</span>
              </span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
              {[
                { who:'Juana Vega · ciudadana', when:'hoy · 14:32', what:'Creó el reclamo desde la app móvil.', tag:'crear' },
                { who:'Sistema', when:'hoy · 14:33', what:'Detectó 5 reclamos similares en un radio de 80m. Marcado como posible cluster.', tag:'auto' },
                { who:'M. Rodríguez · Ente', when:'hoy · 16:10', what:'Cambió estado a "En revisión". Solicitó verificación visual previa a asignar a SCPL Agua.', tag:'estado' },
                { who:'M. Rodríguez · Ente', when:'hoy · 16:12', what:'Nota interna: "Coordinar con cuadrilla nocturna, zona con corte programado el viernes."', tag:'nota' },
              ].map((a, i) => (
                <div key={i} style={{ display:'flex', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius:'50%', background: a.tag === 'crear' ? 'var(--c-red)' : a.tag === 'auto' ? 'var(--c-blue-l)' : a.tag === 'estado' ? 'var(--c-yellow)' : 'var(--navy-soft)', marginTop: 6, flex:'0 0 auto' }}></div>
                  <div style={{ flex: 1, fontSize: 13 }}>
                    <div><strong>{a.who}</strong> <span style={{ color:'var(--muted)', marginLeft: 6, fontSize: 11 }}>{a.when}</span></div>
                    <div style={{ color:'var(--navy)', marginTop: 2 }}>{a.what}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, display:'flex', gap: 8 }}>
              <input className="sk-input" style={{ flex: 1, fontSize: 13 }} placeholder="Agregar nota interna…" />
              <button className="btn btn-primary">Comentar</button>
            </div>
          </div>
        </div>

        {/* RIGHT — workflow */}
        <aside style={{ display:'flex', flexDirection:'column', gap: 14, position:'sticky', top: 0, alignSelf:'start' }}>
          <div className="adm-card">
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Workflow</div>
            <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
              <div>
                <div style={{ color:'var(--muted)', fontSize: 11, fontWeight: 700, textTransform:'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Estado</div>
                <div className="sk-input" style={{ justifyContent:'space-between' }}>
                  <span style={{ display:'flex', alignItems:'center', gap: 8 }}><StatusPill status="review" /></span>
                  <span style={{ color:'var(--muted)' }}>▾</span>
                </div>
              </div>
              <div>
                <div style={{ color:'var(--muted)', fontSize: 11, fontWeight: 700, textTransform:'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Prioridad</div>
                <div className="sk-input" style={{ justifyContent:'space-between' }}>
                  <Priority level="alta" />
                  <span style={{ color:'var(--muted)' }}>▾</span>
                </div>
              </div>
              <div>
                <div style={{ color:'var(--muted)', fontSize: 11, fontWeight: 700, textTransform:'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Asignar a prestadora</div>
                <div className="sk-input" style={{ justifyContent:'space-between' }}>
                  <span style={{ color:'var(--muted)' }}>— elegir —</span>
                  <span style={{ color:'var(--muted)' }}>▾</span>
                </div>
                <div style={{ marginTop: 6, display:'flex', flexWrap:'wrap', gap: 6 }}>
                  <span className="adm-filter">SCPL Agua</span>
                  <span className="adm-filter">Cuadrilla del Ente</span>
                </div>
              </div>
              <div>
                <div style={{ color:'var(--muted)', fontSize: 11, fontWeight: 700, textTransform:'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Responsable interno</div>
                <div className="sk-input" style={{ justifyContent:'space-between' }}>
                  <span style={{ display:'flex', alignItems:'center', gap: 6 }}>
                    <span style={{ width: 22, height: 22, borderRadius:'50%', background:'var(--c-orange)', color:'var(--paper)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize: 11, fontWeight: 700 }}>MR</span>
                    M. Rodríguez
                  </span>
                  <span style={{ color:'var(--muted)' }}>▾</span>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap: 8, marginTop: 14 }}>
              <button className="btn" style={{ flex: 1 }}>Guardar</button>
              <button className="btn btn-primary" style={{ flex: 1 }}>Asignar y notificar</button>
            </div>
          </div>

          <div className="adm-card">
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Vecino que reclamó</div>
            <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius:'50%', background:'var(--navy-soft)', color:'var(--paper)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontWeight: 700 }}>JV</div>
              <div style={{ flex: 1, lineHeight: 1.2 }}>
                <div style={{ fontWeight: 700 }}>Juana Vega</div>
                <div style={{ color:'var(--muted)', fontSize: 12 }}>DNI 27.345.678</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 6, marginTop: 10, fontSize: 12 }}>
              <div><div style={{ color:'var(--muted)' }}>Teléfono</div><div style={{ fontWeight: 600 }}>0297 444-1199</div></div>
              <div><div style={{ color:'var(--muted)' }}>Email</div><div style={{ fontWeight: 600 }}>j.vega@…</div></div>
              <div><div style={{ color:'var(--muted)' }}>Reclamos previos</div><div style={{ fontWeight: 600 }}>3</div></div>
              <div><div style={{ color:'var(--muted)' }}>Cuenta desde</div><div style={{ fontWeight: 600 }}>2023</div></div>
            </div>
          </div>

          <div className="adm-card">
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Notificaciones al vecino</div>
            <div style={{ color:'var(--muted)', fontSize: 12, marginBottom: 8 }}>Cada cambio de estado se notifica automáticamente.</div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, padding: '4px 0' }}><span>WhatsApp</span><span style={{ fontWeight: 700, color:'var(--c-green)' }}>✓ activo</span></div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, padding: '4px 0' }}><span>Email</span><span style={{ fontWeight: 700, color:'var(--c-green)' }}>✓ activo</span></div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, padding: '4px 0' }}><span>Push (app)</span><span style={{ fontWeight: 700, color:'var(--c-green)' }}>✓ activo</span></div>
            <button className="btn" style={{ marginTop: 10, width:'100%' }}>Enviar mensaje manual</button>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

Object.assign(window, { DetailA });
