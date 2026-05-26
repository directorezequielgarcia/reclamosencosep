import Link from "next/link";

export const metadata = { title: "Atención al Usuario · ENCOSEP" };

export default function AtencionUsuarios() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <div className="text-xs font-bold tracking-widest uppercase text-muted">
        Servicios al vecino
      </div>
      <h1 className="text-4xl font-extrabold text-navy mt-2 leading-tight">
        Atención al Usuario
      </h1>
      <p className="text-base text-navy mt-3 leading-relaxed max-w-3xl">
        Si tenés un problema con la prestación de un servicio público bajo
        control del Ente, podés hacer un reclamo, una consulta o una denuncia
        formal. Te respondemos en plazos establecidos por la normativa.
      </p>

      <div className="grid md:grid-cols-2 gap-5 mt-10">
        <Tarjeta
          destacado
          titulo="📋 Hacer un reclamo"
          subtitulo="El más usado · 24/7"
          descripcion="Registrá un reclamo sobre residuos, electricidad, agua o transporte. Adjuntá foto y ubicación. Vas a recibir un número de seguimiento y vas a ver en tiempo real cómo va el trámite."
          cta="Iniciar reclamo"
          href="/reclamos"
        />

        <Tarjeta
          titulo="⭐ Encuesta de satisfacción"
          subtitulo="Próximamente"
          descripcion="Cuando se cierre un reclamo, vas a poder calificar la atención del Ente y de la prestadora. Esa información alimenta el Informe Mensual y las decisiones del Directorio."
          cta="Próximamente"
          href="#"
          deshabilitado
        />

        <Tarjeta
          titulo="📊 Indicadores públicos"
          subtitulo="Próximamente"
          descripcion="Panel público con métricas anonimizadas: cantidad de reclamos por servicio, tiempo medio de resolución, porcentaje de cumplimiento por prestadora."
          cta="Próximamente"
          href="#"
          deshabilitado
        />

        <Tarjeta
          titulo="📞 Contacto directo"
          subtitulo="Mesa de entradas"
          descripcion="Si tu situación no encaja en un reclamo formal, podés contactar al Ente por teléfono, mail o personalmente. Atendemos en horario administrativo."
          cta="Ver datos de contacto"
          href="/contacto"
        />
      </div>

      <section className="mt-12 rounded-2xl border border-line bg-paper-2 p-6">
        <h2 className="text-lg font-extrabold text-navy">
          Tus derechos como usuario
        </h2>
        <p className="text-sm text-muted mt-1">
          Estos derechos están consagrados en los reglamentos del usuario
          (Ordenanzas 14995/19 y 14996/19).
        </p>
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mt-4 text-sm text-navy list-disc list-inside">
          <li>Continuidad y regularidad del servicio</li>
          <li>Facturación clara y comprensible</li>
          <li>Información sobre cortes programados</li>
          <li>Reclamar y obtener respuesta en plazo</li>
          <li>Trato digno y no discriminatorio</li>
          <li>Recibir el servicio bajo condiciones de seguridad</li>
        </ul>
      </section>
    </main>
  );
}

function Tarjeta({
  destacado,
  titulo,
  subtitulo,
  descripcion,
  cta,
  href,
  deshabilitado,
}: {
  destacado?: boolean;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  cta: string;
  href: string;
  deshabilitado?: boolean;
}) {
  const ctaCls = deshabilitado
    ? "bg-paper-3 text-muted cursor-not-allowed"
    : destacado
      ? "bg-svc-red text-white shadow-md shadow-svc-red/30"
      : "bg-navy-2 text-white";
  return (
    <div
      className={`rounded-2xl border bg-paper p-5 flex flex-col gap-3 ${destacado ? "border-svc-red/60" : "border-line"}`}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
        {subtitulo}
      </div>
      <h3 className="text-xl font-extrabold text-navy">{titulo}</h3>
      <p className="text-sm text-navy leading-relaxed flex-1">{descripcion}</p>
      {deshabilitado ? (
        <span
          className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-sm ${ctaCls}`}
        >
          {cta}
        </span>
      ) : (
        <Link
          href={href}
          className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-sm ${ctaCls}`}
        >
          {cta}
        </Link>
      )}
    </div>
  );
}
