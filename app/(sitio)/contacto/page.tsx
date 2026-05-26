export const metadata = { title: "Contacto · ENCOSEP" };

export default function Contacto() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-xs font-bold tracking-widest uppercase text-muted">
        Información institucional
      </div>
      <h1 className="text-4xl font-extrabold text-navy mt-2 leading-tight">
        Contacto
      </h1>
      <p className="text-base text-navy mt-3 leading-relaxed">
        El Ente de Control de Servicios Públicos atiende al público en horario
        administrativo de lunes a viernes. Para los reclamos sobre servicios
        públicos, la vía oficial es el{" "}
        <a className="text-navy-2 underline" href="/reclamos">
          Portal de Reclamos
        </a>
        .
      </p>

      <div className="mt-8 grid md:grid-cols-2 gap-5">
        <Bloque titulo="📍 Dirección">
          Pasaje Valdivia 435
          <br />
          Comodoro Rivadavia · Chubut · Argentina
        </Bloque>
        <Bloque titulo="📞 Teléfono">0800 333 1175</Bloque>
        <Bloque titulo="✉ Email">info@encosepcomodoro.gob.ar</Bloque>
        <Bloque titulo="🕐 Horario de atención">
          Lunes a viernes
          <br />
          08:00 a 14:00 hs
        </Bloque>
      </div>

      <section className="mt-10 rounded-2xl border border-line bg-paper-2 p-6">
        <h2 className="text-base font-extrabold text-navy">
          ¿Qué llega más rápido?
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-navy">
          <li>
            <strong>Reclamo formal sobre un servicio</strong> →{" "}
            <a className="text-navy-2 underline" href="/reclamos">
              Portal de Reclamos
            </a>{" "}
            (queda registrado y con número de seguimiento)
          </li>
          <li>
            <strong>Consulta general o institucional</strong> → email
          </li>
          <li>
            <strong>Urgencia operativa</strong> (corte programado, emergencia)
            → directamente a la prestadora
          </li>
        </ul>
      </section>
    </main>
  );
}

function Bloque({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <div className="text-xs font-bold tracking-widest uppercase text-muted mb-2">
        {titulo}
      </div>
      <div className="text-sm text-navy leading-relaxed">{children}</div>
    </div>
  );
}
