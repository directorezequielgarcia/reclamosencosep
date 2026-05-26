import Link from "next/link";

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
    titulo: "Transporte Público Interurbano",
    archivo: "transporte.png",
    prestadora: "PATAGONIA · DIADEMA",
  },
];

export function BotoneraServicios() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {SERVICIOS.map((s) => (
        <Link
          key={s.slug}
          href={`/areas-fiscalizadas/${s.slug}`}
          className="group flex flex-col items-center text-center p-4 rounded-2xl bg-paper border border-line hover:border-navy-2 hover:shadow-xl hover:-translate-y-1 transition"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/imagenes/areas/${s.archivo}`}
            alt={s.titulo}
            className="block w-24 h-24 object-contain"
            loading="eager"
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
    </div>
  );
}
