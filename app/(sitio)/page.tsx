import Link from "next/link";
import { BotoneraServicios } from "@/components/servicios/BotoneraServicios";

export const metadata = {
  title: "EnCoSeP · Ente de Control de Servicios Públicos · Comodoro Rivadavia",
  description:
    "Control y fiscalización de los servicios públicos bajo control municipal: residuos, electricidad, agua y transporte.",
};

// Hero institucional: panorámica espejada (original + reflejo horizontal)
// para que las laderas queden en los bordes y la ciudad/mar se encuentren
// en el centro, donde se asienta el logo. El logo es el .jpg original sin
// modificar; usamos mix-blend-mode: multiply para que el fondo blanco se
// integre visualmente con la foto sin tocar el archivo del logo.

export default function HomeInstitucional() {
  return (
    <>
      {/* HERO INSTITUCIONAL — panorámica espejo + logo centrado */}
      <section
        className="relative text-white overflow-hidden w-full"
        style={{ height: "min(72vh, 720px)", minHeight: "460px" }}
      >
        {/* h1 oculto para SEO/lectores de pantalla — el logo es la cabecera visual */}
        <h1 className="sr-only">
          EnCoSeP — Control de los Servicios Públicos · Comodoro Rivadavia
        </h1>

        {/* Fondo panorámico en espejo: mitad izquierda original + mitad derecha flipped */}
        <div className="absolute inset-0 flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/imagenes/comodoro-panoramica.png"
            alt="Vista panorámica de Comodoro Rivadavia"
            className="w-1/2 h-full object-cover object-center"
            loading="eager"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/imagenes/comodoro-panoramica.png"
            alt=""
            aria-hidden
            className="w-1/2 h-full object-cover object-center"
            style={{ transform: "scaleX(-1)" }}
            loading="eager"
          />
        </div>

        {/* Vignette: aclara el centro para que los colores del logo respiren
            bajo el mix-blend-multiply, y oscurece la base para legibilidad del CTA. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 45% 55% at center, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0.15) 45%, transparent 70%), linear-gradient(180deg, transparent 55%, rgba(29,53,80,0.85) 100%)",
          }}
        />

        {/* Bloque centrado: logo + CTA */}
        <div className="relative h-full flex flex-col items-center justify-center px-6 gap-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/imagenes/logo-encosep.jpg"
            alt=""
            aria-hidden
            className="w-64 md:w-80 lg:w-[26rem] h-auto drop-shadow-2xl"
            style={{
              mixBlendMode: "multiply",
              filter: "saturate(1.9) brightness(1.18) contrast(1.08)",
            }}
            loading="eager"
          />
          <Link
            href="/nosotros"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-svc-red text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-svc-red/40"
          >
            Conoce nuestras acciones <span aria-hidden>›</span>
          </Link>
        </div>
      </section>

      {/* RENOVACIÓN DE IMAGEN INSTITUCIONAL — video destacado */}
      <section className="bg-paper-2 py-14 px-6 border-b border-line">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-xs font-bold tracking-[0.18em] uppercase text-muted">
              Institucional
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-navy mt-2">
              Renovación de imagen institucional
            </h2>
            <p className="text-sm text-muted mt-2 max-w-2xl mx-auto">
              Una nueva identidad para el Ente de Control de Servicios Públicos
              de Comodoro Rivadavia.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-line shadow-xl bg-black">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              className="w-full h-auto block"
              controls
              preload="metadata"
              playsInline
            >
              <source
                src="/videos/hace-tu-reclamo.mp4"
                type="video/mp4"
              />
              Tu navegador no puede reproducir este video.
            </video>
          </div>
        </div>
      </section>

      {/* ÁREAS FISCALIZADAS — botonera interactiva */}
      <section className="bg-paper py-12 px-6 border-b border-line">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-xs font-bold tracking-[0.18em] uppercase text-muted">
              Áreas bajo control del Ente
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-navy mt-2">
              Entrá al área y conocé qué fiscalizamos
            </h2>
            <p className="text-sm text-muted mt-2 max-w-xl mx-auto">
              Cada área tiene su normativa, su prestadora controlada y la lista
              de situaciones que podés reclamar.
            </p>
          </div>
          <BotoneraServicios />
        </div>
      </section>

      {/* DOS PUERTAS DE ACCESO */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="text-xs font-bold tracking-widest uppercase text-muted">
            Accesos directos
          </div>
          <h2 className="text-3xl font-extrabold text-navy mt-2">
            ¿Quién sos hoy?
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <PuertaAcceso
            badge="Vecinos"
            titulo="Portal de Reclamos"
            descripcion="Registrá un reclamo sobre residuos, electricidad, agua o transporte. Hacé seguimiento del trámite en tiempo real y subí fotos del problema."
            cta="Ingresar al Portal de Reclamos"
            href="/reclamos"
            color="red"
          />
          <PuertaAcceso
            badge="Prestadoras"
            titulo="Portal de Prestadoras"
            descripcion="Acceso institucional para CLEAR URBANA, SCPL, PATAGONIA y DIADEMA. Gestión de reclamos asignados, descargo en expedientes, normativa vigente y vencimientos."
            cta="Ingresar al Portal de Prestadoras"
            href="/prestadoras"
            color="navy"
          />
        </div>
      </section>

      {/* PRINCIPIOS DEL CONTROL */}
      <section className="bg-paper-2 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="text-xs font-bold tracking-widest uppercase text-muted">
              Marco del control
            </div>
            <h2 className="text-3xl font-extrabold text-navy mt-2">
              Los principios que defendemos
            </h2>
            <p className="text-sm text-muted mt-2 max-w-2xl mx-auto">
              Conforme la Ordenanza 13189/17 de creación del ENCOSEP, todos los
              servicios bajo nuestro control deben respetar estos principios.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              "CONTINUIDAD",
              "REGULARIDAD",
              "GENERALIDAD",
              "HABITUALIDAD",
              "UNIFORMIDAD",
              "IGUALDAD",
              "ACCESIBILIDAD",
              "MANTENIMIENTO",
            ].map((p) => (
              <div
                key={p}
                className="bg-paper rounded-xl border border-line py-4 px-3 text-center"
              >
                <div className="text-sm font-extrabold text-navy">{p}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACCESOS RAPIDOS */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-5">
          <Tarjeta
            titulo="Atención al Usuario"
            descripcion="Reclamos, consultas, denuncias y trámites del vecino."
            href="/atencion-usuarios"
          />
          <Tarjeta
            titulo="Control a Prestadoras"
            descripcion="Normativa, contratos, pliegos, vencimientos y documentación de las empresas controladas."
            href="/control-prestadoras"
          />
          <Tarjeta
            titulo="Nosotros"
            descripcion="Directorio, marco normativo, misión institucional y contacto."
            href="/nosotros"
          />
        </div>
      </section>
    </>
  );
}

function PuertaAcceso({
  badge,
  titulo,
  descripcion,
  cta,
  href,
  color,
}: {
  badge: string;
  titulo: string;
  descripcion: string;
  cta: string;
  href: string;
  color: "red" | "navy";
}) {
  const btnCls =
    color === "red"
      ? "bg-svc-red text-white shadow-svc-red/30"
      : "bg-navy-2 text-white shadow-navy/30";
  return (
    <div className="rounded-2xl border border-line bg-paper p-6 flex flex-col gap-4 hover:shadow-lg transition">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
        {badge}
      </div>
      <h3 className="text-2xl font-extrabold text-navy">{titulo}</h3>
      <p className="text-sm text-navy leading-relaxed flex-1">{descripcion}</p>
      <Link
        href={href}
        className={`inline-flex items-center justify-center px-5 py-3 rounded-xl font-bold shadow-lg ${btnCls}`}
      >
        {cta} →
      </Link>
    </div>
  );
}

function Tarjeta({
  titulo,
  descripcion,
  href,
}: {
  titulo: string;
  descripcion: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-line bg-paper p-5 hover:bg-paper-2 transition"
    >
      <h3 className="text-lg font-extrabold text-navy">{titulo}</h3>
      <p className="text-sm text-muted mt-1 leading-relaxed">{descripcion}</p>
      <div className="text-xs text-navy-2 font-semibold mt-3 underline underline-offset-4">
        Ver más →
      </div>
    </Link>
  );
}
