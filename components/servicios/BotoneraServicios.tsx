import Link from "next/link";
import Image from "next/image";

const SERVICIOS = [
  {
    slug: "agua",
    titulo: "Agua y Saneamiento",
    archivo: "agua.png",
    prestadora: "SCPL",
  },
  {
    slug: "energia",
    titulo: "Energía Eléctrica y Alumbrado Público",
    archivo: "energia.png",
    prestadora: "SCPL",
  },
  {
    slug: "residuos",
    titulo: "Gestión de Residuos",
    archivo: "residuos.png",
    prestadora: "CLEAR URBANA S.A.",
  },
  {
    slug: "transporte",
    titulo: "Transporte Público Urbano y Suburbano",
    archivo: "transporte.png",
    prestadora: "SOL BUS · DIADEMA",
  },
];

export function BotoneraServicios() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
      {SERVICIOS.map((s) => (
        <Link
          key={s.slug}
          href={`/areas-fiscalizadas/${s.slug}`}
          className="group flex flex-col items-center text-center p-4 rounded-2xl bg-paper border border-line hover:border-navy-2 hover:shadow-xl hover:-translate-y-1 transition"
        >
          <Image
            src={`/imagenes/areas/${s.archivo}`}
            alt={s.titulo}
            width={96}
            height={96}
            className="block w-24 h-24 object-contain"
          />
          <div className="mt-3 text-sm font-extrabold text-navy leading-tight">
            {s.titulo}
          </div>
          <div className="text-[10px] text-muted mt-1 uppercase tracking-wider font-semibold">
            {s.prestadora}
          </div>
          <div className="mt-3 text-[11px] font-bold text-navy-2 uppercase tracking-wider opacity-70 group-hover:opacity-100">
            Ver área →
          </div>
        </Link>
      ))}

      {/* GAS no es un área fiscalizada por el Ente (competencia nacional,
          ENReGE), pero se muestra igual acá para que el vecino sepa a dónde
          reclamar: misma tarjeta visual con acento naranja y sin
          "prestadora controlada", para no confundirla con las de arriba. */}
      <Link
        href="/gas"
        className="group flex flex-col items-center text-center p-4 rounded-2xl bg-paper border border-svc-orange/40 hover:border-svc-orange hover:shadow-xl hover:-translate-y-1 transition"
      >
        <IconoHornallaGas />
        <div className="mt-3 text-sm font-extrabold text-navy leading-tight">
          Gas
        </div>
        <div className="text-[10px] text-muted mt-1 uppercase tracking-wider font-semibold">
          No es competencia del Ente
        </div>
        <div className="mt-3 text-[11px] font-bold text-svc-orange uppercase tracking-wider opacity-80 group-hover:opacity-100">
          Ver a dónde reclamar →
        </div>
      </Link>
    </div>
  );
}

// Hornalla de cocina vista de arriba, con llamas encendidas — dibujada a
// mano en SVG porque, a diferencia de las áreas fiscalizadas, no existe (ni
// corresponde crear) una ilustración PNG en /imagenes/areas para un servicio
// que el Ente no controla.
function IconoHornallaGas() {
  const angulos = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg viewBox="0 0 96 96" width={96} height={96} className="block">
      {angulos.map((deg) => (
        <g key={deg} transform={`rotate(${deg} 48 48)`}>
          <path
            d="M48 16 C 44.5 23, 44.5 28, 48 33 C 51.5 28, 51.5 23, 48 16 Z"
            fill="#3d8bfd"
          />
          <path
            d="M48 21 C 46.3 25, 46.3 27.5, 48 30 C 49.7 27.5, 49.7 25, 48 21 Z"
            fill="#bfe0ff"
          />
        </g>
      ))}
      <circle cx="48" cy="48" r="22" fill="#e8edf2" stroke="#33465e" strokeWidth="2.5" />
      <circle cx="48" cy="48" r="6" fill="#33465e" />
    </svg>
  );
}
