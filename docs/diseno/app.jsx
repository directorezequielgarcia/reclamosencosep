// app.jsx — EnCoSeP · Portal de Reclamos · Mobile
// Hi-fi alineado al sitio web institucional. Múltiples variantes por pantalla clave.

const PHONE_W = 320;
const PHONE_H = 680;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "comfortable",
  "color": "accent",
  "notes": true
}/*EDITMODE-END*/;

function Phone({ children }) {
  const t = window.__tweaks || {};
  return (
    <div style={{ width: PHONE_W, height: PHONE_H, position:'relative' }}>
      <SketchPhone
        density={t.density || 'comfortable'}
        mono={t.color === 'mono'}
        notes={t.notes !== false}
      >
        {children}
      </SketchPhone>
    </div>
  );
}

// Brief / sistema visual
function BriefCard() {
  return (
    <div style={{
      width: PHONE_W + 60, height: PHONE_H, padding: 24, background: 'var(--paper)',
      border: '1px solid var(--line)', borderRadius: 18,
      boxShadow: '0 1px 2px rgba(29,53,80,0.04), 0 16px 40px -20px rgba(29,53,80,0.22)',
      display: 'flex', flexDirection: 'column', gap: 14
    }}>
      <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
        <EncosepMini size={56} />
        <div>
          <div className="sk-h1" style={{ fontSize: 22 }}>Portal de Reclamos</div>
          <div className="sk-small">Ente de Control · Comodoro Rivadavia</div>
        </div>
      </div>
      <BrandStripe />

      <div className="sk-small" style={{ fontWeight: 700, letterSpacing:'0.04em', color: 'var(--muted)' }}>OBJETIVO</div>
      <div className="sk-body">App móvil para vecinos: registrar y seguir reclamos sobre los 4 servicios bajo control del Ente.</div>

      <div className="sk-small" style={{ fontWeight: 700, letterSpacing:'0.04em', color: 'var(--muted)', marginTop: 4 }}>DECISIONES BASE</div>
      <ul style={{ margin: 0, paddingLeft: 18 }} className="sk-body">
        <li>Móvil primero · hit-target ≥ 44px</li>
        <li>Login obligatorio con DNI + Nº de trámite</li>
        <li>Audiencia amplia · lenguaje cotidiano</li>
        <li>Multimodal: foto, voz y opciones (no solo texto)</li>
      </ul>

      <div className="sk-small" style={{ fontWeight: 700, letterSpacing:'0.04em', color: 'var(--muted)', marginTop: 4 }}>SERVICIOS</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10 }}>
        {['residuos','energia','agua','transporte'].map(k => (
          <div key={k} style={{ display:'flex', alignItems:'center', gap: 8 }}>
            <SvcIcon kind={k} size={40} />
            <div style={{ lineHeight: 1.15 }}>
              <div className="sk-body" style={{ fontSize: 12, fontWeight: 700 }}>{SVC_META[k].short}</div>
              <div className="sk-small" style={{ fontSize: 10 }}>aro · {({residuos:'verde',energia:'amarillo',agua:'azul',transporte:'rojo'})[k]}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }}></div>
      <div className="sk-small" style={{ textAlign:'right', color:'var(--muted)' }}>→ Explorá las variantes a la derecha</div>
    </div>
  );
}

// Showcase de iconografía
function IconSet({ mono = false }) {
  const cls = mono ? 'mono' : '';
  return (
    <div className={cls} style={{
      width: PHONE_W, padding: 22, background:'var(--paper)',
      border:'1px solid var(--line)', borderRadius: 18,
      boxShadow: '0 1px 2px rgba(29,53,80,0.04), 0 16px 40px -20px rgba(29,53,80,0.22)',
      height: PHONE_H, display:'flex', flexDirection:'column', gap: 14
    }}>
      <div>
        <div className="sk-h2">Iconografía · servicios</div>
        <div className="sk-small" style={{ marginTop: 2 }}>
          {mono ? 'Modo monocromo · accesibilidad / impresión' : 'Aro de color del servicio + línea-arte en navy'}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14, flex: 1 }}>
        {['residuos','energia','agua','transporte'].map(k => (
          <div key={k} className="sk-card" style={{
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            gap: 10, padding: 14
          }}>
            <SvcIcon kind={k} size={88} />
            <div style={{ textAlign:'center', lineHeight: 1.15 }}>
              <div className="sk-body" style={{ fontWeight: 700 }}>{SVC_META[k].short}</div>
              <div className="sk-mono" style={{ marginTop: 2 }}>{k}</div>
            </div>
          </div>
        ))}
      </div>

      <BrandStripe />
    </div>
  );
}

// ─────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────
function App() {
  const { values: t, setTweak } = useTweaks(TWEAK_DEFAULTS);
  window.__tweaks = t;

  return (
    <>
      <DesignCanvas>

        <DCSection id="brief" title="Portal de Reclamos EnCoSeP" subtitle="App móvil · alineada al sistema visual del sitio institucional">
          <DCArtboard id="brief-card" label="0 · Brief" width={PHONE_W + 60} height={PHONE_H}>
            <BriefCard />
          </DCArtboard>
          <DCArtboard id="icons-color" label="Íconos · color" width={PHONE_W} height={PHONE_H}>
            <IconSet mono={false} />
          </DCArtboard>
          <DCArtboard id="icons-mono" label="Íconos · monocromo" width={PHONE_W} height={PHONE_H}>
            <IconSet mono={true} />
          </DCArtboard>
        </DCSection>

        <DCSection id="login" title="① Login con DNI" subtitle="Obligatorio · validación contra RENAPER">
          <DCArtboard id="login-a" label="A · DNI + trámite" width={PHONE_W} height={PHONE_H}>
            <Phone><LoginA /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection id="home" title="② Home / Landing" subtitle="4 enfoques sobre la primera impresión">
          <DCArtboard id="home-a" label="A · Grilla directa" width={PHONE_W} height={PHONE_H}>
            <Phone><HomeA /></Phone>
          </DCArtboard>
          <DCArtboard id="home-b" label="B · Hero + CTA" width={PHONE_W} height={PHONE_H}>
            <Phone><HomeB /></Phone>
          </DCArtboard>
          <DCArtboard id="home-c" label="C · Conversacional" width={PHONE_W} height={PHONE_H}>
            <Phone><HomeC /></Phone>
          </DCArtboard>
          <DCArtboard id="home-d" label="D · Estado del barrio" width={PHONE_W} height={PHONE_H}>
            <Phone><HomeD /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection id="servicio" title="③ Selección de servicio" subtitle="Grilla, lista, tipográfico, o sobre mapa">
          <DCArtboard id="serv-a" label="A · Grilla 2×2" width={PHONE_W} height={PHONE_H}>
            <Phone><ServSelA /></Phone>
          </DCArtboard>
          <DCArtboard id="serv-b" label="B · Lista con descripción" width={PHONE_W} height={PHONE_H}>
            <Phone><ServSelB /></Phone>
          </DCArtboard>
          <DCArtboard id="serv-c" label="C · Tipográfico JUMBO" width={PHONE_W} height={PHONE_H}>
            <Phone><ServSelC /></Phone>
          </DCArtboard>
          <DCArtboard id="serv-d" label="D · Sobre el mapa" width={PHONE_W} height={PHONE_H}>
            <Phone><ServSelD /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection id="ubicacion" title="④ ¿Dónde está el problema?" subtitle="Mapa, dirección manual, o GPS">
          <DCArtboard id="loc-a" label="A · Mapa + pin" width={PHONE_W} height={PHONE_H}>
            <Phone><LocA /></Phone>
          </DCArtboard>
          <DCArtboard id="loc-b" label="B · Dirección escrita" width={PHONE_W} height={PHONE_H}>
            <Phone><LocB /></Phone>
          </DCArtboard>
          <DCArtboard id="loc-c" label="C · GPS automático" width={PHONE_W} height={PHONE_H}>
            <Phone><LocC /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection id="form" title="⑤ Formulario paso a paso" subtitle="Wizard, multimodal, single-page, o chat">
          <DCArtboard id="form-a" label="A · Wizard opciones" width={PHONE_W} height={PHONE_H}>
            <Phone><FormA /></Phone>
          </DCArtboard>
          <DCArtboard id="form-b" label="B · Foto + audio" width={PHONE_W} height={PHONE_H}>
            <Phone><FormB /></Phone>
          </DCArtboard>
          <DCArtboard id="form-c" label="C · Una sola pantalla" width={PHONE_W} height={PHONE_H}>
            <Phone><FormC /></Phone>
          </DCArtboard>
          <DCArtboard id="form-d" label="D · Conversacional" width={PHONE_W} height={PHONE_H}>
            <Phone><FormD /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection id="confirma" title="⑥ Confirmación + seguimiento" subtitle="Cierre del flujo y monitoreo del estado">
          <DCArtboard id="conf-a" label="A · Código grande" width={PHONE_W} height={PHONE_H}>
            <Phone><ConfirmA /></Phone>
          </DCArtboard>
          <DCArtboard id="conf-b" label="B · Comunitario / share" width={PHONE_W} height={PHONE_H}>
            <Phone><ConfirmB /></Phone>
          </DCArtboard>
          <DCArtboard id="track-a" label="C · Seguimiento" width={PHONE_W} height={PHONE_H}>
            <Phone><TrackA /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection id="transparencia" title="⑦ Transparencia · Mapa público + Estadísticas" subtitle="Lo que ve toda la ciudad">
          <DCArtboard id="map-pub" label="A · Mapa público" width={PHONE_W} height={PHONE_H}>
            <Phone><PublicMap /></Phone>
          </DCArtboard>
          <DCArtboard id="stats" label="B · Estadísticas" width={PHONE_W} height={PHONE_H}>
            <Phone><StatsScreen /></Phone>
          </DCArtboard>
        </DCSection>

      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Estilo">
          <TweakRadio
            label="Color"
            value={t.color}
            options={[
              { value:'accent', label:'Acentos' },
              { value:'mono',   label:'B & N' },
            ]}
            onChange={(v) => setTweak('color', v)}
          />
          <TweakRadio
            label="Densidad"
            value={t.density}
            options={[
              { value:'comfortable', label:'Cómoda' },
              { value:'compact',     label:'Compacta' },
            ]}
            onChange={(v) => setTweak('density', v)}
          />
          <TweakToggle
            label="Mostrar anotaciones"
            value={t.notes}
            onChange={(v) => setTweak('notes', v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
