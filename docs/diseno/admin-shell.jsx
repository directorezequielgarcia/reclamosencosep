// admin-shell.jsx — Sidebar + Topbar + AdminPage wrapper

const ADM_NAV = [
  { section: 'gestión' },
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'inbox',     label: 'Bandeja de reclamos', icon: '☷', badge: 28 },
  { id: 'mapa',      label: 'Mapa operativo', icon: '◎' },
  { section: 'análisis' },
  { id: 'analitica', label: 'Analítica', icon: '◴' },
  { id: 'reportes',  label: 'Reportes', icon: '⎙' },
  { section: 'configuración' },
  { id: 'prestadoras', label: 'Prestadoras', icon: '◫' },
  { id: 'usuarios',    label: 'Usuarios y roles', icon: '○○' },
  { id: 'notif',       label: 'Comunicaciones', icon: '☎' },
];

function AdminSidebar({ active = 'dashboard', role = 'Gestor del Ente' }) {
  return (
    <aside className="adm-sidebar">
      <div className="adm-sidebar-brand">
        <span className="logo-pill">
          <img src="assets/encosep-logo.png" alt="EnCoSeP" />
        </span>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontWeight: 700, color: 'var(--paper)', fontSize: 12 }}>Panel</div>
          <div className="role">{role}</div>
        </div>
      </div>
      <nav>
        {ADM_NAV.map((it, i) => {
          if (it.section) return <div key={i} className="adm-nav-section">{it.section}</div>;
          return (
            <div key={it.id} className={"adm-nav-item" + (it.id === active ? ' active' : '')}>
              <span className="icon">{it.icon}</span>
              <span>{it.label}</span>
              {it.badge && <span className="badge">{it.badge}</span>}
            </div>
          );
        })}
        <div style={{ flex: 1 }}></div>
      </nav>
      <div style={{ flex: 1 }}></div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background:'var(--c-blue-l)', display:'inline-flex', alignItems:'center', justifyContent:'center', color:'var(--paper)', fontWeight: 700, fontSize: 12 }}>MR</div>
        <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
          <div style={{ color:'var(--paper)', fontSize: 12, fontWeight: 700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>M. Rodríguez</div>
          <div style={{ color:'#9aa9bd', fontSize: 11 }}>Salir →</div>
        </div>
      </div>
    </aside>
  );
}

function AdminTopbar({ crumbs = [], rightActions }) {
  return (
    <header className="adm-topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <span key={i}>
            {i > 0 && <span style={{ margin: '0 6px', opacity: 0.5 }}>/</span>}
            {i === crumbs.length - 1 ? <strong>{c}</strong> : c}
          </span>
        ))}
      </div>
      <div className="adm-search">
        <span>⌕</span>
        <span>Buscar reclamos, vecinos, direcciones…</span>
        <span style={{ marginLeft:'auto', fontSize: 11, padding: '2px 6px', border:'1px solid var(--line)', borderRadius: 4 }}>⌘K</span>
      </div>
      <div style={{ flex: 1 }}></div>
      {rightActions || (
        <>
          <div className="adm-iconbtn" title="Notificaciones">
            <span>🔔</span>
            <span className="dot"></span>
          </div>
          <div className="adm-iconbtn" title="Ayuda">?</div>
          <div className="adm-profile">
            <span className="avatar">MR</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>M. Rodríguez</span>
            <span style={{ color:'var(--muted)' }}>▾</span>
          </div>
        </>
      )}
    </header>
  );
}

// Shell completo
function AdminShell({ active, role, crumbs, children, rightActions }) {
  return (
    <div className="adm-shell">
      <AdminSidebar active={active} role={role} />
      <AdminTopbar crumbs={crumbs} rightActions={rightActions} />
      <main className="adm-main">{children}</main>
    </div>
  );
}

// Browser frame wrapper for an admin page
function AdminFrame({ width = 1280, height = 800, url = 'admin.encosep.gob.ar', tab = 'EnCoSeP · Panel', children }) {
  return (
    <ChromeWindow
      tabs={[{ title: tab, favicon: 'E' }]}
      activeIndex={0}
      url={url}
      width={width}
      height={height}
    >
      {children}
    </ChromeWindow>
  );
}

// Service tag with ring
function SvcTag({ kind, withName = true }) {
  const m = SVC_META[kind];
  return (
    <span className={'svc-tag ' + kind}>
      <span className="ring"></span>
      {withName && <span className="name">{m.short}</span>}
    </span>
  );
}

// Status pill
function StatusPill({ status }) {
  const map = {
    new: 'Nuevo', review: 'En revisión', assigned: 'Asignado',
    work: 'En obra', resolved: 'Resuelto', closed: 'Cerrado', urgent: 'Urgente'
  };
  return <span className={'pill ' + status}><span className="dot"></span>{map[status]}</span>;
}

function Priority({ level = 'media' }) {
  return (
    <span className={'prio ' + level}>
      <span className="bar"><i></i><i></i><i></i></span>
      {level[0].toUpperCase() + level.slice(1)}
    </span>
  );
}

Object.assign(window, { ADM_NAV, AdminSidebar, AdminTopbar, AdminShell, AdminFrame, SvcTag, StatusPill, Priority });
