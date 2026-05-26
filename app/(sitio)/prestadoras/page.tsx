import Link from "next/link";
import { SeccionHeader } from "@/components/ui/SeccionHeader";

export const metadata = { title: "Portal de Prestadoras · ENCOSEP" };

const PRESTADORAS = [
  { nombre: "CLEAR URBANA S.A.", servicio: "Higiene Urbana" },
  { nombre: "SCPL", servicio: "Energía eléctrica · Alumbrado · Agua y cloacas" },
  { nombre: "PATAGONIA Argentina S.R.L.", servicio: "Transporte Urbano" },
  { nombre: "TRANSPORTE DIADEMA S.A.", servicio: "Transporte Urbano" },
];

export default function PortalPrestadorasLanding() {
  return (
    <>
      <SeccionHeader
        kicker="Acceso institucional"
        titulo="Portal de Prestadoras"
        descripcion="Espacio digital para las empresas que prestan servicios públicos bajo control del Ente. Gestión de reclamos asignados, descargos en expedientes, normativa vigente y vencimientos de documentación."
      />
      <main className="max-w-5xl mx-auto px-6 py-10">

      <div className="grid md:grid-cols-[1fr_360px] gap-6 items-start">
        <section>
          <h2 className="text-xl font-extrabold text-navy">¿Qué podés hacer?</h2>
          <ul className="mt-3 space-y-3 text-sm text-navy">
            <Bullet titulo="Gestionar reclamos asignados">
              Ver la bandeja de reclamos derivados a tu empresa, cambiar su
              estado (en proceso, resuelto, etc.), agregar comentarios y
              notificar al vecino.
            </Bullet>
            <Bullet titulo="Presentar descargos en expedientes">
              Cuando el Ente eleva un reclamo a expediente administrativo, tu
              empresa puede labrar un descargo formal en el cuerpo del
              expediente.
            </Bullet>
            <Bullet titulo="Consultar normativa vigente" muted>
              Próximamente: vista propia de los reglamentos, pliegos y
              contratos que regulan tu actividad.
            </Bullet>
            <Bullet titulo="Ver vencimientos de presentaciones" muted>
              Próximamente: calendario de presentaciones obligatorias
              (informes mensuales, balances anuales, certificaciones).
            </Bullet>
          </ul>
        </section>

        <aside className="rounded-2xl border-2 border-navy-2 bg-navy-2/5 p-5 sticky top-20">
          <div className="text-xs font-bold tracking-widest uppercase text-navy-2">
            Ingreso
          </div>
          <h3 className="text-xl font-extrabold text-navy mt-1">
            Acceso operador
          </h3>
          <p className="text-xs text-navy mt-2 leading-relaxed">
            Ingresá con el <strong>CUIT</strong> de la prestadora y la clave
            asignada por el Ente.
          </p>
          <Link
            href="/ingresar?callbackUrl=/admin"
            className="block mt-4 text-center px-5 py-3 rounded-xl bg-navy-2 text-white font-bold"
          >
            Ingresar al Portal →
          </Link>
          <p className="text-[11px] text-muted mt-3 leading-relaxed">
            ¿Olvidaste la clave? Comunicate con el Ente:{" "}
            <a href="/contacto" className="text-navy-2 underline">
              datos de contacto
            </a>
            .
          </p>
        </aside>
      </div>

      <section className="mt-12">
        <h2 className="text-base font-extrabold text-navy">
          Prestadoras habilitadas
        </h2>
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          {PRESTADORAS.map((p) => (
            <div
              key={p.nombre}
              className="rounded-xl border border-line bg-paper p-4"
            >
              <div className="text-sm font-bold text-navy">{p.nombre}</div>
              <div className="text-xs text-muted mt-0.5">{p.servicio}</div>
            </div>
          ))}
        </div>
      </section>
      </main>
    </>
  );
}

function Bullet({
  titulo,
  children,
  muted,
}: {
  titulo: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <li
      className={`rounded-xl border p-3 ${muted ? "border-dashed border-line-strong bg-paper-2" : "border-line bg-paper"}`}
    >
      <div
        className={`text-sm font-bold ${muted ? "text-muted" : "text-navy"}`}
      >
        {titulo} {muted && <span className="text-[10px]">(próximamente)</span>}
      </div>
      <p className="text-xs text-muted leading-relaxed mt-1">{children}</p>
    </li>
  );
}
