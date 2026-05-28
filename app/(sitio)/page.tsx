import Link from "next/link";
import { BotoneraServicios } from "@/components/servicios/BotoneraServicios";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "EnCoSeP · Ente de Control de Servicios Públicos · Comodoro Rivadavia",
  description:
    "Control y fiscalización de los servicios públicos bajo control municipal: residuos, electricidad, agua y transporte.",
};

// Datos vivos del home se re-arman cada 5 minutos (suficiente para un sitio
// institucional, evita golpear la DB en cada visita).
export const revalidate = 300;

// Hero institucional: panorámica espejada (original + reflejo horizontal)
// para que las laderas queden en los bordes y la ciudad/mar se encuentren
// en el centro, donde se asienta el logo. El logo es el .jpg original sin
// modificar; usamos mix-blend-mode: multiply para que el fondo blanco se
// integre visualmente con la foto sin tocar el archivo del logo.

export default async function HomeInstitucional() {
  const ahora = new Date();
  const [
    encuestaAgg,
    totalReclamos,
    reclamosResueltos,
    totalPrestadoras,
    audienciasProximas,
  ] = await Promise.all([
    prisma.encuestaServicios.aggregate({
      _count: { _all: true },
      _avg: {
        puntajeAgua: true,
        puntajeEnergia: true,
        puntajeResiduos: true,
        puntajeTransporte: true,
      },
    }),
    prisma.reclamo.count(),
    prisma.reclamo.count({ where: { estado: "RESUELTO" } }),
    prisma.prestadora.count({ where: { activa: true } }),
    prisma.audienciaPublica.count({ where: { fecha: { gte: ahora } } }),
  ]);

  const totalRespuestasEncuesta = encuestaAgg._count._all;
  const pctResueltos =
    totalReclamos > 0
      ? Math.round((reclamosResueltos / totalReclamos) * 100)
      : 0;
  const promedioServicio = (n: number | null) =>
    n === null ? null : Math.round(n * 10) / 10;
  const puntajes = {
    agua: promedioServicio(encuestaAgg._avg.puntajeAgua),
    energia: promedioServicio(encuestaAgg._avg.puntajeEnergia),
    residuos: promedioServicio(encuestaAgg._avg.puntajeResiduos),
    transporte: promedioServicio(encuestaAgg._avg.puntajeTransporte),
  };

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

      {/* CALIFICÁ LOS SERVICIOS — teaser de la encuesta */}
      <section className="bg-paper py-12 px-6 border-b border-line">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <div className="text-xs font-bold tracking-[0.18em] uppercase text-muted">
              Tu opinión cuenta
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-navy mt-2">
              Calificá los servicios públicos
            </h2>
            <p className="text-sm text-muted mt-2 max-w-2xl mx-auto">
              Una encuesta anónima de 30 segundos. Tu puntaje alimenta los
              indicadores públicos del Ente y los informes mensuales al
              Directorio.
            </p>
            {totalRespuestasEncuesta > 0 && (
              <p className="text-xs text-muted mt-3">
                Ya respondieron{" "}
                <strong className="text-navy">{totalRespuestasEncuesta}</strong>{" "}
                {totalRespuestasEncuesta === 1 ? "vecino" : "vecinos"}.
              </p>
            )}
          </div>

          {/* Mini-tablero de promedios actuales (server-rendered) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 max-w-3xl mx-auto">
            <PuntajeBadge label="Agua" valor={puntajes.agua} acento="bg-svc-blue" />
            <PuntajeBadge
              label="Electricidad"
              valor={puntajes.energia}
              acento="bg-svc-yellow"
            />
            <PuntajeBadge
              label="Residuos"
              valor={puntajes.residuos}
              acento="bg-svc-green"
            />
            <PuntajeBadge
              label="Transporte"
              valor={puntajes.transporte}
              acento="bg-svc-red"
            />
          </div>

          <div className="text-center">
            <Link
              href="/encuesta"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-svc-red text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-svc-red/40"
            >
              Calificar ahora <span aria-hidden>›</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ÁREAS FISCALIZADAS — botonera interactiva */}
      <section className="bg-paper-2 py-12 px-6 border-b border-line">
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

      {/* TABLERO DE INDICADORES — KPIs públicos en vivo */}
      <section className="bg-paper py-14 px-6 border-b border-line">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-xs font-bold tracking-[0.18em] uppercase text-muted">
              Datos públicos
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-navy mt-2">
              El Ente en números
            </h2>
            <p className="text-sm text-muted mt-2 max-w-2xl mx-auto">
              Información en vivo sobre la gestión del ENCOSEP.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            <Kpi label="Reclamos registrados" valor={totalReclamos} />
            <Kpi label="Reclamos resueltos" valor={`${pctResueltos}%`} />
            <Kpi label="Prestadoras controladas" valor={totalPrestadoras} />
            <Kpi
              label="Audiencias programadas"
              valor={audienciasProximas}
            />
          </div>

          <div className="text-center mt-7">
            <Link
              href="/indicadores"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-2 text-white font-bold text-sm"
            >
              Ver tablero completo + mapa de calor <span aria-hidden>›</span>
            </Link>
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

function PuntajeBadge({
  label,
  valor,
  acento,
}: {
  label: string;
  valor: number | null;
  acento: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-3 flex items-center gap-3">
      <div className={`w-3 h-10 rounded-full ${acento}`} aria-hidden />
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
          {label}
        </span>
        {valor !== null ? (
          <span className="text-xl font-extrabold text-navy leading-none">
            {valor}
            <span className="text-xs text-muted font-normal ml-1">/5</span>
          </span>
        ) : (
          <span className="text-xs text-muted italic">sin datos aún</span>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, valor }: { label: string; valor: number | string }) {
  return (
    <div className="rounded-2xl border-2 border-line bg-paper-2 p-4 text-center">
      <div className="text-3xl md:text-4xl font-extrabold text-navy leading-none">
        {valor}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-muted font-semibold mt-2">
        {label}
      </div>
    </div>
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
