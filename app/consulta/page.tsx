import Link from "next/link";

export const metadata = { title: "Panel de consulta · ENCOSEP" };

const ACCESOS = [
  {
    href: "/consulta/indicadores",
    titulo: "Indicadores",
    descripcion:
      "Cifras de gestión, mapa de reclamos, problemas por barrio y tipo de reclamo, cumplimiento por prestadora. Descargable en Word y Excel.",
  },
  {
    href: "/consulta/encuesta",
    titulo: "Encuesta de satisfacción",
    descripcion:
      "Resultados de la encuesta de satisfacción del usuario, filtrable por fecha y descargable en Excel.",
  },
  {
    href: "/consulta/reclamos",
    titulo: "Reclamos ingresados",
    descripcion:
      "Vista resumida de los reclamos cargados: N° de ticket, situación, línea (si es colectivo de Transporte) y barrio — sin datos personales del vecino.",
  },
];

export default function ConsultaPage() {
  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold text-navy">Panel de consulta</h1>
        <p className="text-sm text-muted mt-1">
          Acceso institucional de solo lectura a la información de gestión del ENCOSEP.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACCESOS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="rounded-2xl border border-line bg-paper p-5 hover:border-navy-2 transition flex flex-col gap-2"
          >
            <h2 className="text-base font-extrabold text-navy">{a.titulo}</h2>
            <p className="text-sm text-muted leading-relaxed">{a.descripcion}</p>
            <span className="text-sm text-navy-2 font-semibold mt-2">Entrar →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
