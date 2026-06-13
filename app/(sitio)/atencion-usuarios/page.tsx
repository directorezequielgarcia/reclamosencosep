import Link from "next/link";
import { SeccionHeader } from "@/components/ui/SeccionHeader";

export const metadata = { title: "Atención al Usuario · ENCOSEP" };

export default function AtencionUsuarios() {
  return (
    <>
      <SeccionHeader
        kicker="Servicios al vecino"
        titulo="Atención al Usuario"
        descripcion="Si tenés un problema con la prestación de un servicio público bajo control del Ente, podés hacer un reclamo, una consulta o una denuncia formal. Te respondemos en plazos establecidos por la normativa."
      />
      <main className="max-w-5xl mx-auto px-6 py-10">

      <div className="grid md:grid-cols-2 gap-5">
        <Tarjeta
          destacado
          titulo="📋 Hacer un reclamo"
          subtitulo="El más usado · 24/7"
          descripcion="Registrá un reclamo sobre residuos, electricidad, agua o transporte. Adjuntá foto y ubicación. Vas a recibir un número de seguimiento y vas a ver en tiempo real cómo va el trámite."
          cta="Iniciar reclamo"
          href="/reclamos"
        />

        <Tarjeta
          titulo="🧮 Controlá tu factura"
          subtitulo="Calculadora ENCOSEP"
          descripcion="Subí el PDF o una foto de tu factura de la SCPL y la comparamos concepto por concepto con el cuadro tarifario vigente. Si no la tenés, podés calcular tu factura estimada a mano."
          cta="Controlar o calcular"
          href="/tarifas"
        />

        <Tarjeta
          titulo="🏛️ Participá en audiencias"
          subtitulo="Participación ciudadana"
          descripcion="Enterate de las audiencias públicas (por ejemplo, por pedidos de aumento de tarifas), consultá la documentación y anotate para participar."
          cta="Ver audiencias"
          href="/audiencias"
        />

        <Tarjeta
          titulo="📚 Consultá la normativa"
          subtitulo="Marco normativo"
          descripcion="Mirá la normativa que aplica el Ente: ordenanzas de creación, reglamentos del usuario y marco regulatorio. Desde ahí también podés entrar al Digesto Municipal completo."
          cta="Ver normativa completa"
          href="/control-prestadoras"
        />

        <Tarjeta
          titulo="⭐ Encuesta de satisfacción"
          subtitulo="Tu opinión"
          descripcion="Calificá del 1 al 5 cómo está cada servicio público. Si cerraste un reclamo, también podés calificar la atención del Ente y de la prestadora."
          cta="Responder encuesta"
          href="/encuesta"
        />

        <Tarjeta
          titulo="📊 Indicadores públicos"
          subtitulo="Datos en tiempo real"
          descripcion="Panel con métricas anonimizadas: reclamos por servicio, tiempo medio de resolución, cumplimiento por prestadora y satisfacción del usuario."
          cta="Ver indicadores"
          href="/indicadores"
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
    </>
  );
}

function Tarjeta({
  destacado,
  titulo,
  subtitulo,
  descripcion,
  cta,
  href,
  externo,
  deshabilitado,
}: {
  destacado?: boolean;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  cta: string;
  href: string;
  externo?: boolean;
  deshabilitado?: boolean;
}) {
  const ctaCls = deshabilitado
    ? "bg-paper-3 text-muted cursor-not-allowed"
    : destacado
      ? "bg-svc-red text-white shadow-md shadow-svc-red/30"
      : "bg-navy-2 text-white";
  const ctaClassName = `inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-sm ${ctaCls}`;
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
        <span className={ctaClassName}>{cta}</span>
      ) : externo ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={ctaClassName}
        >
          {cta}
        </a>
      ) : (
        <Link href={href} className={ctaClassName}>
          {cta}
        </Link>
      )}
    </div>
  );
}
