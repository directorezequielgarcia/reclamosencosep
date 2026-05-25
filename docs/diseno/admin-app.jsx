// admin-app.jsx — Panel admin · canvas con todas las pantallas

const W = 1280;
const H = 800;

function AdminArtboard({ url, tab, children }) {
  return (
    <ChromeWindow
      tabs={[{ title: tab || 'EnCoSeP · Panel', favicon: 'E' }]}
      activeIndex={0}
      url={url || 'admin.encosep.gob.ar'}
      width={W}
      height={H}
    >
      {children}
    </ChromeWindow>
  );
}

function BriefCardAdmin() {
  return (
    <div style={{
      width: W, height: H, padding: 56, background: 'var(--paper)',
      borderRadius: 20, border: '1px solid var(--line)',
      boxShadow: '0 1px 2px rgba(29,53,80,0.04), 0 16px 40px -20px rgba(29,53,80,0.22)',
      display:'flex', gap: 40
    }}>
      <div style={{ flex: 1, display:'flex', flexDirection:'column', gap: 18 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 16 }}>
          <EncosepMini size={72} />
          <div>
            <div className="sk-h1" style={{ fontSize: 30 }}>Panel administrativo</div>
            <div className="sk-small">Aplicación web · gestores y prestadoras</div>
          </div>
        </div>
        <BrandStripe height={6} style={{ borderRadius: 3, maxWidth: 320 }} />

        <div>
          <div className="sk-small" style={{ fontWeight: 700, letterSpacing:'0.04em', color:'var(--muted)' }}>QUIÉNES LO USAN</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14, marginTop: 8 }}>
            {[
              { n:'Super admin', d:'Configura el sistema, factura, audita logs.' },
              { n:'Gestor del Ente', d:'Recibe, revisa, asigna, cierra reclamos.' },
              { n:'Operador prestadora', d:'Ve solo lo asignado a su empresa.' },
              { n:'Auditor', d:'Solo lectura · métricas + reclamos cerrados.' },
            ].map((r, i) => (
              <div key={i} style={{ border:'1px solid var(--line)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{r.n}</div>
                <div style={{ color:'var(--muted)', fontSize: 12, marginTop: 4 }}>{r.d}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="sk-small" style={{ fontWeight: 700, letterSpacing:'0.04em', color:'var(--muted)' }}>SECCIONES PRINCIPALES</div>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 14, lineHeight: 1.7 }}>
            <li><strong>Dashboard</strong> — KPIs, tendencias, alertas, SLA por servicio</li>
            <li><strong>Bandeja</strong> — cola de reclamos (tabla densa o tablero kanban)</li>
            <li><strong>Detalle</strong> — workspace por reclamo (estado, asignación, notas, mapa)</li>
            <li><strong>Mapa operativo</strong> — vista geográfica con clusters</li>
            <li><strong>Analítica</strong> — tendencias, heatmap, top problemas</li>
            <li><strong>Prestadoras</strong> — empresas controladas + cumplimiento SLA</li>
            <li><strong>Usuarios y roles</strong> — gestión interna de accesos</li>
          </ul>
        </div>
      </div>

      <div style={{ width: 320, display:'flex', flexDirection:'column', gap: 14 }}>
        <div className="adm-card" style={{ background: 'linear-gradient(135deg, #1d3550 0%, #2b4a6b 100%)', color:'var(--paper)', borderColor:'transparent' }}>
          <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, letterSpacing:'0.04em' }}>STACK SUGERIDO</div>
          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6 }}>
            • React + TypeScript<br/>
            • Tailwind o CSS modules<br/>
            • Backend: Node + Postgres<br/>
            • Auth: JWT + RBAC<br/>
            • Mapa: Leaflet o Mapbox<br/>
            • Push: WhatsApp Business + SMTP
          </div>
        </div>
        <div className="adm-card">
          <div style={{ fontSize: 12, fontWeight: 700, color:'var(--muted)', letterSpacing:'0.04em' }}>DOS PRODUCTOS</div>
          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6 }}>
            <strong>App móvil</strong> para el ciudadano (ya diseñada).<br/>
            <strong>Panel web</strong> para gestores y prestadoras (este).<br/>
            <span style={{ color:'var(--muted)' }}>Comparten el mismo backend y modelo de datos.</span>
          </div>
        </div>
        <div className="adm-card">
          <div style={{ fontSize: 12, fontWeight: 700, color:'var(--muted)', letterSpacing:'0.04em' }}>SIGUIENTE PASO</div>
          <div style={{ marginTop: 8, fontSize: 13 }}>
            Handoff a Claude Code con este diseño como referencia visual + especificación de flujos.
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <DesignCanvas>

      <DCSection id="brief" title="Panel Administrativo EnCoSeP" subtitle="Web app · gestores del Ente, prestadoras y auditoría">
        <DCArtboard id="adm-brief" label="0 · Brief" width={W} height={H}>
          <BriefCardAdmin />
        </DCArtboard>
        <DCArtboard id="adm-login" label="1 · Login institucional" width={W} height={H}>
          <AdminArtboard url="admin.encosep.gob.ar/login" tab="Acceso · Panel"><AdminLogin /></AdminArtboard>
        </DCArtboard>
      </DCSection>

      <DCSection id="dash" title="① Dashboard" subtitle="Bienvenida + KPIs + tendencias">
        <DCArtboard id="dash-a" label="A · Resumen general" width={W} height={H}>
          <AdminArtboard url="admin.encosep.gob.ar/dashboard"><DashboardA /></AdminArtboard>
        </DCArtboard>
        <DCArtboard id="dash-b" label="B · Operativo (foco SLA)" width={W} height={H}>
          <AdminArtboard url="admin.encosep.gob.ar/operativo"><DashboardB /></AdminArtboard>
        </DCArtboard>
      </DCSection>

      <DCSection id="inbox" title="② Bandeja de reclamos" subtitle="Cola de trabajo · 2 maneras de operarla">
        <DCArtboard id="inbox-a" label="A · Tabla densa" width={W} height={H}>
          <AdminArtboard url="admin.encosep.gob.ar/bandeja"><InboxA /></AdminArtboard>
        </DCArtboard>
        <DCArtboard id="inbox-b" label="B · Tablero kanban" width={W} height={H}>
          <AdminArtboard url="admin.encosep.gob.ar/bandeja/tablero"><InboxB /></AdminArtboard>
        </DCArtboard>
      </DCSection>

      <DCSection id="detail" title="③ Detalle del reclamo" subtitle="Workspace · todo lo que necesita el gestor para resolver">
        <DCArtboard id="detail-a" label="A · Vista completa" width={W} height={H}>
          <AdminArtboard url="admin.encosep.gob.ar/reclamo/A-2418" tab="A-2418 · Pérdida en la calle"><DetailA /></AdminArtboard>
        </DCArtboard>
      </DCSection>

      <DCSection id="ops" title="④ Mapa operativo + Analítica" subtitle="Vista geográfica y métricas">
        <DCArtboard id="mapa" label="A · Mapa operativo" width={W} height={H}>
          <AdminArtboard url="admin.encosep.gob.ar/mapa"><MapaOperativo /></AdminArtboard>
        </DCArtboard>
        <DCArtboard id="analitica" label="B · Analítica" width={W} height={H}>
          <AdminArtboard url="admin.encosep.gob.ar/analitica"><Analitica /></AdminArtboard>
        </DCArtboard>
      </DCSection>

      <DCSection id="config" title="⑤ Configuración" subtitle="Prestadoras y usuarios">
        <DCArtboard id="prestadoras" label="A · Prestadoras" width={W} height={H}>
          <AdminArtboard url="admin.encosep.gob.ar/prestadoras"><Prestadoras /></AdminArtboard>
        </DCArtboard>
        <DCArtboard id="usuarios" label="B · Usuarios y roles" width={W} height={H}>
          <AdminArtboard url="admin.encosep.gob.ar/usuarios"><Usuarios /></AdminArtboard>
        </DCArtboard>
      </DCSection>

    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
