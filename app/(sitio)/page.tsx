import Link from "next/link";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { SVC_ORDER, SVC_META } from "@/lib/servicios";

export const metadata = {
  title: "EnCoSeP · Ente de Control de Servicios Públicos · Comodoro Rivadavia",
  description:
    "Control y fiscalización de los servicios públicos bajo control municipal: residuos, electricidad, agua y transporte.",
};

const HERO_CIUDAD =
  "linear-gradient(135deg, rgba(29,53,80,0.78) 0%, rgba(43,74,107,0.65) 60%, rgba(75,168,194,0.55) 100%), radial-gradient(ellipse at 20% 80%, #c4393c 0%, transparent 40%), radial-gradient(ellipse at 80% 20%, #f0bc40 0%, transparent 40%), linear-gradient(180deg, #1d3550 0%, #2b4a6b 50%, #c4393c 100%)";

export default function HomeInstitucional() {
  return (
    <>
      {/* HERO */}
      <section
        className="relative text-white"
        style={{ backgroundImage: HERO_CIUDAD, backgroundBlendMode: "multiply" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-[1.4fr_1fr] gap-10 items-center">
          <div>
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-80">
              Ente de Control de Servicios Públicos
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.05] mt-2">
              Control y Fiscalización
              <br />
              de Servicios Públicos
            </h1>
            <p className="mt-4 text-base md:text-lg opacity-90 leading-relaxed max-w-xl">
              Velamos por la continuidad, regularidad y calidad de los servicios
              públicos en Comodoro Rivadavia. Somos el organismo de control
              independiente entre los vecinos, las prestadoras y el Municipio.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link
                href="/reclamos"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-svc-red text-white font-bold text-base shadow-lg shadow-svc-red/30"
              >
                Hacer un reclamo
              </Link>
              <Link
                href="/nosotros"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl border-2 border-white/60 text-white font-semibold backdrop-blur-sm"
              >
                Conocé nuestras acciones
              </Link>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end gap-3">
            <div className="text-[10px] font-bold tracking-widest uppercase opacity-70">
              4 servicios bajo control
            </div>
            <div className="grid grid-cols-2 gap-4">
              {SVC_ORDER.map((k) => (
                <div
                  key={k}
                  className="bg-white/95 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-2xl"
                >
                  <SvcIcon kind={k} size={64} />
                  <div className="text-[11px] font-bold uppercase tracking-wider text-navy text-center leading-tight">
                    {SVC_META[k].short}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SERVICIOS EN MOBILE */}
      <section className="md:hidden bg-paper-2 py-8 px-6">
        <div className="text-center text-[10px] font-bold tracking-widest uppercase text-muted">
          4 servicios bajo control
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 max-w-md mx-auto">
          {SVC_ORDER.map((k) => (
            <div
              key={k}
              className="bg-paper rounded-2xl border border-line p-3 flex flex-col items-center gap-2"
            >
              <SvcIcon kind={k} size={60} />
              <div className="text-xs font-bold uppercase tracking-wider text-navy text-center leading-tight">
                {SVC_META[k].short}
              </div>
            </div>
          ))}
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
