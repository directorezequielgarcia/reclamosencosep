import Link from "next/link";
import Image from "next/image";
import { BotoneraServicios } from "@/components/servicios/BotoneraServicios";
import { prisma } from "@/lib/prisma";
import { ZorritoTour } from "@/components/tour/ZorritoTour";
import { ZorritoNoticias } from "@/components/tour/ZorritoNoticia";
import { POSE_POR_SERVICIO_KIND, POSES } from "@/components/tour/zorrito-poses";
import {
  IconoInstagram,
  IconoFacebook,
  INSTAGRAM_URL,
  FACEBOOK_URL,
} from "@/components/ui/RedesSociales";
import { TIPO_BOLETIN_META } from "@/lib/boletines";
import { youtubeThumbnail } from "@/components/ui/VideoEmbed";
import type { ReclamoEstado } from "@prisma/client";

export const metadata = {
  title: "EnCoSeP · Ente de Control de Servicios Públicos · Comodoro Rivadavia",
  description:
    "Control y fiscalización de los servicios públicos bajo control municipal: residuos, electricidad, agua y transporte.",
};

// Datos vivos del home se re-arman cada 5 minutos (suficiente para un sitio
// institucional, evita golpear la DB en cada visita).
export const revalidate = 300;

// Asistencia por WhatsApp — mismo número y texto que el FAB flotante
// (components/ui/FabAsistenciaWsp.tsx). Si cambia el número, cambiar en ambos.
const WSP_NUMERO = "5492974303051"; // +54 9 2974 30-3051
const WSP_TEXTO =
  "Hola, necesito ayuda para cargar mi reclamo en el portal del ENCOSEP.";
const WSP_HREF = `https://wa.me/${WSP_NUMERO}?text=${encodeURIComponent(
  WSP_TEXTO,
)}`;

function IconoWsp({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden
      className="fill-current"
    >
      <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 01-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 01-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.521-1.318.13-.27.13-.527.13-.802-.001-.66-1.49-.99-1.637-.99zM16.06 4C9.91 4 4.96 8.95 4.96 15.09c0 1.973.515 3.916 1.504 5.617L4.038 28 11.5 25.69c1.633.847 3.465 1.275 5.297 1.275 6.142 0 11.092-4.95 11.092-11.09 0-2.974-1.16-5.77-3.256-7.864A11.08 11.08 0 0016.06 4zm0 20.318a9.18 9.18 0 01-4.566-1.218l-.33-.187-3.5 1.18 1.166-3.36-.215-.359a9.226 9.226 0 01-1.418-4.892c0-5.094 4.144-9.238 9.243-9.238 2.466 0 4.78.962 6.523 2.706a9.187 9.187 0 012.706 6.532c0 5.099-4.145 9.236-9.61 9.236z" />
    </svg>
  );
}

export default async function HomeInstitucional() {
  const ahora = new Date();
  const [
    encuestaAgg,
    totalReclamos,
    reclamosPorEstado,
    totalPrestadoras,
    audienciasProximas,
    ultimosBoletines,
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
    prisma.reclamo.groupBy({ by: ["estado"], _count: { _all: true } }),
    prisma.prestadora.count({ where: { activa: true } }),
    prisma.audienciaPublica.count({ where: { fecha: { gte: ahora } } }),
    prisma.boletin.findMany({
      where: { publicado: true },
      orderBy: { fechaPublicacion: "desc" },
      take: 4,
    }),
  ]);

  const totalRespuestasEncuesta = encuestaAgg._count._all;
  const estadoCount = new Map(
    reclamosPorEstado.map((g) => [g.estado, g._count._all]),
  );
  const pctPorEstado = (estado: ReclamoEstado) =>
    totalReclamos > 0
      ? Math.round(((estadoCount.get(estado) ?? 0) / totalReclamos) * 100)
      : 0;
  const pctResueltos = pctPorEstado("RESUELTO");
  const pctEnRevision = pctPorEstado("EN_REVISION");
  const pctDerivados = pctPorEstado("DERIVADO");
  const pctRechazados = pctPorEstado("RECHAZADO");
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
      {/* ===================== AVISO SOL BUS ===================== */}
      {/* Franja destacada, lo primero que ve el vecino al entrar. Nuevo
          sistema de transporte (Grupo MR S.R.L. / Sol Bus, reemplaza a
          Patagonia desde el 1° de agosto de 2026) — orienta y deriva a la
          página de líneas y recorridos. Retirar cuando deje de ser novedad. */}
      <Link
        id="aviso-solbus"
        href="/areas-fiscalizadas/transporte#lineas"
        className="block bg-[#7e57c2] text-white text-center px-4 py-2.5 text-sm font-semibold hover:bg-[#6e49b2] transition"
      >
        🚌 Nuevo sistema de transporte: Sol Bus ya está en funcionamiento —
        consultá tu línea y recorrido <span aria-hidden>›</span>
      </Link>

      {/* ===================== AVISO CALCULADORA ===================== */}
      <Link
        id="aviso-calculadora"
        href="/tarifas"
        className="block bg-svc-orange text-navy text-center px-4 py-2.5 text-sm font-semibold hover:brightness-95 transition"
      >
        🧮 Calculadora ENCOSEP — Controlá tu factura{" "}
        <span aria-hidden>›</span>
      </Link>

      {/* ===================== HERO ===================== */}
      {/* Foto real de Comodoro (sin espejo), velo navy institucional para
          legibilidad, y el logo nuevo nítido sobre una placa clara: respeta
          al 100% los colores de marca sin fundirlo con la foto. */}
      <section
        className="relative text-white overflow-hidden w-full"
        style={{ height: "min(78vh, 760px)", minHeight: "480px" }}
      >
        {/* h1 oculto para SEO/lectores de pantalla — el logo es la cabecera visual */}
        <h1 className="sr-only">
          EnCoSeP — Control de los Servicios Públicos · Comodoro Rivadavia
        </h1>

        {/* Fondo: panorámica optimizada (next/image → WebP/AVIF responsive) */}
        <Image
          src="/imagenes/comodoro-panoramica.png"
          alt="Vista panorámica de Comodoro Rivadavia al atardecer"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* Velo institucional: leve arriba, fuerte navy abajo para el CTA */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(29,53,80,0.45) 0%, rgba(29,53,80,0.15) 35%, rgba(29,53,80,0.55) 75%, rgba(29,53,80,0.92) 100%)",
          }}
        />

        {/* Bloque centrado: logo + CTA */}
        <div className="relative h-full flex flex-col items-center justify-center px-6 gap-7 text-center">
          {/* Logo nuevo, fondo transparente, directo sobre la foto. Detrás un
              resplandor radial difuso (no una caja) que lo separa del fondo y
              hace legible el wordmark navy sin lavar los colores de marca. */}
          <div className="relative flex items-center justify-center">
            <div
              aria-hidden
              className="absolute -inset-x-16 -inset-y-12 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(255,255,255,0.80) 0%, rgba(255,255,255,0.45) 40%, rgba(255,255,255,0) 70%)",
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/imagenes/logo-encosep-transparente.png"
              alt="EnCoSeP — Ente de Control de Servicios Públicos"
              className="relative w-60 md:w-80 lg:w-96 h-auto"
              style={{ filter: "drop-shadow(0 4px 12px rgba(15,25,45,0.30))" }}
              loading="eager"
            />
          </div>

          <p className="max-w-xl text-sm md:text-base font-medium text-white/95 drop-shadow">
            Control y fiscalización de los servicios públicos de Comodoro
            Rivadavia: residuos, electricidad, agua y transporte.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              id="hero-reclamo"
              href="/reclamos"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-svc-red text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-svc-red/40 hover:scale-105 transition"
            >
              Hacé tu reclamo <span aria-hidden>›</span>
            </Link>
            <a
              href={WSP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-svc-green text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-svc-green/40 hover:scale-105 transition"
            >
              <IconoWsp />
              Asistencia por WhatsApp
            </a>
          </div>

          <Link
            href="/acciones"
            className="text-white/90 font-semibold text-sm underline underline-offset-4 hover:text-white drop-shadow"
          >
            Conocé nuestras acciones ›
          </Link>
        </div>

        {/* Insignias octogonales de las áreas fiscalizadas, flotando a los
            costados de la foto — acceso directo además de la botonera de
            "Entrá al área" más abajo. Visibles también en mobile en vertical
            (más chicas y pegadas al borde, para no superponer al bloque
            central). */}
        {[
          { slug: "agua", archivo: "agua.png", titulo: "Agua y Saneamiento", pos: "left-[2%] sm:left-[3%] md:left-[6%] top-[13%]", delay: "0s" },
          { slug: "energia", archivo: "energia.png", titulo: "Energía Eléctrica", pos: "right-[2%] sm:right-[3%] md:right-[6%] top-[13%]", delay: "1.3s" },
          { slug: "residuos", archivo: "residuos.png", titulo: "Gestión de Residuos", pos: "left-[2%] sm:left-[3%] md:left-[6%] bottom-[15%]", delay: "0.6s" },
          { slug: "transporte", archivo: "transporte.png", titulo: "Transporte Público", pos: "right-[2%] sm:right-[3%] md:right-[6%] bottom-[15%]", delay: "2s" },
        ].map((b) => (
          <Link
            key={b.slug}
            href={`/areas-fiscalizadas/${b.slug}`}
            aria-label={`Ver área: ${b.titulo}`}
            title={b.titulo}
            className={`absolute z-10 animate-flotar hover:scale-110 transition ${b.pos}`}
            style={{ animationDelay: b.delay }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/imagenes/areas/${b.archivo}`}
              alt={b.titulo}
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 object-contain"
              style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.45))" }}
            />
          </Link>
        ))}
      </section>

      {/* ===================== SPOT INSTITUCIONAL (Zorritos) ===================== */}
      {/* Justo debajo del Hero: lo primero que se ve al entrar, después del
          bloque de logo + CTA. Video corto, no compite con los botones de
          reclamo porque va después de ellos, pero antes de cualquier otra
          sección. */}
      <section className="bg-black py-10 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl overflow-hidden border border-line shadow-xl bg-black">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              className="w-full h-auto block"
              controls
              preload="none"
              poster="/imagenes/hero-encosep-zorritos.png"
              playsInline
            >
              <source src="/videos/hace-tu-reclamo.mp4" type="video/mp4" />
              Tu navegador no puede reproducir este video.
            </video>
          </div>
        </div>
      </section>

      {/* ===================== ÁREAS FISCALIZADAS ===================== */}
      <section id="areas-fiscalizadas-home" className="bg-paper py-12 px-6 border-b border-line">
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

      {/* ===================== ¿QUIÉN SOS HOY? ===================== */}
      {/* Acceso único por rol: cada perfil entra a donde le corresponde.
          El camino del vecino incluye, adentro, sus dos formas de reclamar
          (con usuario o asistido por WhatsApp), para no repetir esa sección. */}
      <section id="quien-sos-hoy" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="text-xs font-bold tracking-widest uppercase text-muted">
            Accesos directos
          </div>
          <h2 className="text-3xl font-extrabold text-navy mt-2">
            ¿Quién sos hoy?
          </h2>
          <p className="text-sm text-muted mt-2 max-w-2xl mx-auto">
            Elegí tu perfil. A vecinos y prestadoras los llevamos directo a su
            portal; los organismos ingresan con su usuario.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-5 items-start">
          {/* VECINO — incluye las dos formas de reclamar */}
          <div className="rounded-2xl border-2 border-svc-red/30 bg-paper p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  Vecino · Usuario
                </div>
                <h3 className="text-2xl font-extrabold text-navy leading-tight">
                  Portal de Reclamos
                </h3>
              </div>
              <span className="text-3xl leading-none" aria-hidden>
                🏠
              </span>
            </div>
            <p className="text-sm text-navy leading-relaxed">
              Reclamos de residuos, electricidad, agua o transporte. Elegí cómo
              querés hacerlo:
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {/* Con usuario */}
              <div className="rounded-xl border border-line bg-paper-2 p-4 flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-svc-red">
                  Más rápido
                </span>
                <div className="text-sm font-extrabold text-navy">
                  Con tu usuario
                </div>
                <p className="text-xs text-muted leading-snug flex-1">
                  Cargás vos el reclamo y seguís el avance en tiempo real con un
                  código de seguimiento.
                </p>
                <Link
                  href="/reclamos"
                  className="inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-lg bg-svc-red text-white font-bold text-sm hover:scale-105 transition"
                >
                  Crear usuario y reclamar →
                </Link>
              </div>
              {/* Por WhatsApp */}
              <div className="rounded-xl border border-line bg-paper-2 p-4 flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-svc-green">
                  Sin registrarte
                </span>
                <div className="text-sm font-extrabold text-navy">
                  Asistido por WhatsApp
                </div>
                <p className="text-xs text-muted leading-snug flex-1">
                  Nos pasás los datos del problema y el equipo del Ente carga el
                  reclamo por vos.
                </p>
                <a
                  href={WSP_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-svc-green text-white font-bold text-sm hover:scale-105 transition"
                >
                  <IconoWsp size={16} />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* PRESTADORA */}
          <div className="rounded-2xl border border-line bg-paper p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  Prestadora
                </div>
                <h3 className="text-2xl font-extrabold text-navy leading-tight">
                  Portal de Prestadoras
                </h3>
              </div>
              <span className="text-3xl leading-none" aria-hidden>
                🏢
              </span>
            </div>
            <p className="text-sm text-navy leading-relaxed flex-1">
              Acceso para CLEAR URBANA, SCPL, SOL BUS y DIADEMA: reclamos
              asignados, descargo en expedientes, normativa vigente y
              vencimientos.
            </p>
            <Link
              href="/ingresar?perfil=prestadora"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-navy-2 text-white font-bold shadow-lg shadow-navy/30 hover:scale-105 transition"
            >
              Ingresar al Portal de Prestadoras →
            </Link>
          </div>
        </div>

        {/* Organismos → ingreso con usuario */}
        <div className="mt-8">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted text-center mb-3">
            Organismos · ingreso con usuario
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { emoji: "🛡️", titulo: "Team EnCoSeP", detalle: "Equipo del Ente", perfil: "team" },
              { emoji: "⚖️", titulo: "Autoridad de Aplicación", detalle: "Aplica las sanciones", perfil: "autoridad" },
              { emoji: "🏛️", titulo: "PEM", detalle: "Ejecutivo Municipal", perfil: "pem" },
              { emoji: "🗳️", titulo: "Concejo Deliberante", detalle: "Presidencia y concejales", perfil: "concejo" },
            ].map((a) => (
              <Link
                key={a.titulo}
                href={`/ingresar?perfil=${a.perfil}`}
                className="flex flex-col items-center text-center gap-1 rounded-2xl border border-line bg-paper p-4 hover:shadow-md hover:border-navy-2/40 transition"
              >
                <span className="text-2xl leading-none" aria-hidden>
                  {a.emoji}
                </span>
                <span className="text-sm font-extrabold text-navy leading-tight">
                  {a.titulo}
                </span>
                <span className="text-[11px] text-muted leading-snug">
                  {a.detalle}
                </span>
                <span className="text-[11px] font-bold text-navy-2 mt-1">
                  Acceder →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== NOVEDADES ===================== */}
      {/* Vidriera fija de las últimas publicaciones del Ente (tabla Boletin,
          cargadas desde /admin/boletines). Si no hay ninguna publicada la
          sección no se renderiza — evita mostrar una vidriera vacía. */}
      {ultimosBoletines.length > 0 && (
        <section id="novedades-home" className="bg-paper py-14 px-6 border-b border-line">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/imagenes/zorrito/zorrito-parado.png"
                  alt=""
                  className="w-12 h-12 rounded-full object-cover object-top border-2 border-[#7e57c2]/40 bg-white shrink-0"
                />
                <div>
                  <div className="text-xs font-bold tracking-[0.18em] uppercase text-muted">
                    Novedades
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-navy">
                    Lo último del Ente
                  </h2>
                </div>
              </div>
              <Link
                href="/boletines"
                className="text-sm font-bold text-navy-2 underline underline-offset-4 hover:text-navy"
              >
                Ver todas las novedades ›
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ultimosBoletines.map((b) => {
                const m = TIPO_BOLETIN_META[b.tipo];
                return (
                  <Link
                    key={b.id}
                    href="/boletines"
                    className="rounded-2xl border border-line bg-paper-2 overflow-hidden flex flex-col gap-2 hover:shadow-lg hover:border-line-strong transition"
                  >
                    {(() => {
                      const imagen = b.fotoUrl || (b.videoUrl && youtubeThumbnail(b.videoUrl));
                      if (!imagen) return null;
                      return (
                        <div className="relative w-full h-36">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imagen} alt="" className="w-full h-full object-cover" />
                          {!b.fotoUrl && b.videoUrl && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <span className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-navy text-sm shadow">
                                ▶
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <div className="flex items-center gap-2 text-[11px] px-5 pt-5">
                      <span
                        className="uppercase tracking-wider font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: m.color }}
                      >
                        {m.icon} {m.label}
                      </span>
                      <span className="text-muted">
                        {b.fechaPublicacion.toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className="px-5 pb-5 flex flex-col gap-2">
                      <h3 className="text-base font-extrabold text-navy leading-snug">
                        {b.titulo}
                      </h3>
                      {b.resumen && (
                        <p className="text-sm text-muted leading-snug line-clamp-3">
                          {b.resumen}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===================== ENCUESTA ===================== */}
      <section className="bg-paper-2 py-12 px-6 border-b border-line">
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
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy-2 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-navy/30"
            >
              Calificar ahora <span aria-hidden>›</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== INDICADORES ===================== */}
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
            <Kpi label="En revisión" valor={`${pctEnRevision}%`} />
            <Kpi label="Derivados a prestadora" valor={`${pctDerivados}%`} />
            <Kpi label="Reclamos resueltos" valor={`${pctResueltos}%`} />
            <Kpi label="Reclamos rechazados" valor={`${pctRechazados}%`} />
            <Kpi label="Prestadoras controladas" valor={totalPrestadoras} />
            <Kpi label="Audiencias programadas" valor={audienciasProximas} />
          </div>
          <p className="text-[11px] text-muted text-center mt-3 max-w-md mx-auto leading-relaxed">
            El resto de los reclamos está recién recibido o en proceso de
            resolución con la prestadora. Ver el detalle completo por estado
            en el tablero de indicadores.
          </p>

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

      {/* ===================== PRINCIPIOS DEL CONTROL ===================== */}
      <section className="bg-paper-2 py-16 border-b border-line">
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

      {/* ===================== SEGUINOS EN REDES ===================== */}
      <section
        id="redes-sociales-home"
        className="bg-navy py-12 px-6 overflow-hidden"
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={POSES.parado}
            alt=""
            aria-hidden
            className="w-32 h-32 sm:w-40 sm:h-40 shrink-0 drop-shadow-xl"
          />
          <div className="text-center sm:text-left">
            <div className="text-xs font-bold tracking-[0.18em] uppercase text-white/60">
              El Zorrito te invita
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
              ¡Seguinos en las redes!
            </h2>
            <p className="text-sm text-white/80 mt-2 max-w-sm">
              Novedades, avisos y todo lo que hacemos por los servicios
              públicos de Comodoro Rivadavia.
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-5 mt-5">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de ENCOSEP"
                title="Instagram de ENCOSEP"
                className="animate-bounce [animation-duration:2s] flex items-center justify-center w-16 h-16 rounded-2xl text-white shadow-lg hover:scale-110 transition"
                style={{
                  background:
                    "radial-gradient(circle at 30% 110%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
                }}
              >
                <IconoInstagram size={32} />
              </a>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook de ENCOSEP"
                title="Facebook de ENCOSEP"
                className="animate-bounce [animation-duration:2s] [animation-delay:.3s] flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1877F2] text-white shadow-lg hover:scale-110 transition"
              >
                <IconoFacebook size={32} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <ZorritoTour
        storageKey="zorrito-tour-home-v1"
        pasos={[
          {
            pose: "parado",
            texto:
              "¡Hola! Soy el Zorrito de ENCOSEP 🦊. Te ayudo a moverte por el sitio.",
          },
          {
            targetId: "aviso-solbus",
            pose: "colectivo",
            texto:
              "¿Viste el aviso de arriba? Ahí te cuento sobre el nuevo sistema de transporte Sol Bus.",
          },
          {
            targetId: "hero-reclamo",
            pose: "parado",
            texto:
              "Si tenés un problema con un servicio público, tocá acá para hacer tu reclamo.",
          },
          {
            targetId: "areas-fiscalizadas-home",
            pose: "colectivo",
            texto:
              "Acá entrás a cada área que controlamos: Residuos, Electricidad, Agua o Transporte.",
          },
          {
            targetId: "quien-sos-hoy",
            pose: "parado",
            texto:
              "Elegí tu perfil: vecino, prestadora, o si sos parte del Ente, entrá con tu usuario.",
          },
          {
            pose: "agachado",
            texto:
              "¡Listo! Cuando quieras volver a verme, tocá mi carita en el botón de abajo.",
          },
        ]}
      />

      {/* ===================== NOTICIAS TEMPORALES DEL ZORRITO ===================== */}
      {/* El primer aviso se arma solo con el último boletín publicado (tabla
          Boletin, cargado desde /admin/boletines) — así toda novedad nueva
          dispara al Zorrito apenas se entra, sin tocar este archivo. El id
          incluye el id del boletín: si se publica uno nuevo, se vuelve a
          mostrar aunque el vecino ya haya cerrado el anterior.
          Los avisos siguientes son puntuales y SÍ hay que borrarlos a mano
          cuando dejen de ser noticia. */}
      <ZorritoNoticias
        avisos={[
          ...(ultimosBoletines[0]
            ? [
                {
                  id: `boletin-${ultimosBoletines[0].id}`,
                  pose: ultimosBoletines[0].servicio
                    ? POSE_POR_SERVICIO_KIND[ultimosBoletines[0].servicio]
                    : ("colectivo" as const),
                  etiqueta: "Novedad del Ente",
                  titulo: `📣 ${ultimosBoletines[0].titulo}`,
                  texto:
                    ultimosBoletines[0].resumen ??
                    "Mirá la última novedad publicada por el Ente.",
                  cta: { texto: "Leer la novedad completa", href: "/boletines" },
                },
              ]
            : []),
          {
            id: "invitacion-reclamos-generales-2026-08-05",
            pose: "agachado",
            etiqueta: "Tu voz cuenta",
            titulo: "🦊 Seguí contándonos",
            texto:
              "Seguí registrando tus preferencias y reclamos: el servicio tiene que ajustarse a la generalidad de los usuarios y a todas las realidades. Te invitamos a reclamar también sobre residuos, luz, agua y cloacas en tu barrio.",
            cta: {
              texto: "Hacé tu reclamo",
              href: "/reclamos",
            },
          },
        ]}
      />
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
