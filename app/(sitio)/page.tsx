import Link from "next/link";
import { BotoneraServicios } from "@/components/servicios/BotoneraServicios";
import { AnillosOrbital } from "@/components/ui/AnillosOrbital";

export const metadata = {
  title: "EnCoSeP · Ente de Control de Servicios Públicos · Comodoro Rivadavia",
  description:
    "Control y fiscalización de los servicios públicos bajo control municipal: residuos, electricidad, agua y transporte.",
};

// Hero con foto panorámica real de Comodoro Rivadavia más anillos orbitales
// gigantes superpuestos y el nombre EnCoSeP como watermark.
const HERO_CIUDAD =
  "linear-gradient(180deg, rgba(29,53,80,0.65) 0%, rgba(29,53,80,0.45) 35%, rgba(29,53,80,0.75) 100%), url('/imagenes/comodoro-panoramica.png')";

export default function HomeInstitucional() {
  return (
    <>
      {/* HERO INSTITUCIONAL — foto Comodoro + anillos orbitales + watermark EnCoSeP */}
      <section
        className="relative text-white overflow-hidden"
        style={{
          backgroundImage: HERO_CIUDAD,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          minHeight: "640px",
        }}
      >
        {/* Anillos orbitales gigantes envolviendo el hero */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -48%)",
            width: "min(120vh, 1200px)",
            height: "min(120vh, 1200px)",
          }}
        >
          <AnillosOrbital opacity={1} strokeWidth={6} />
        </div>

        {/* Watermark "EnCoSeP" gigante centrado */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-6">
          <div
            className="font-extrabold tracking-tight leading-none text-white drop-shadow-2xl"
            style={{
              fontSize: "clamp(80px, 14vw, 220px)",
              letterSpacing: "-0.04em",
            }}
          >
            EnCoSeP
          </div>
          <div
            className="font-bold tracking-[0.18em] uppercase text-white/95 mt-2 drop-shadow"
            style={{ fontSize: "clamp(11px, 1.6vw, 22px)" }}
          >
            Ente de Control de Servicios Públicos
          </div>
        </div>

        {/* Bloque inferior izquierdo — título secundario + CTA */}
        <div className="relative max-w-6xl mx-auto px-6 pt-[420px] pb-12 md:pt-[460px] md:pb-16">
          <h1 className="text-3xl md:text-4xl font-extrabold leading-[1.05] text-white drop-shadow-xl max-w-md">
            Control de los
            <br />
            Servicios Públicos
          </h1>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link
              href="/nosotros"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-svc-red text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-svc-red/40"
            >
              Conoce nuestras acciones <span aria-hidden>›</span>
            </Link>
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
