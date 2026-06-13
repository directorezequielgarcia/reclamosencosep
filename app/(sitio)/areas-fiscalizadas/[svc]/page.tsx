import Link from "next/link";
import { notFound } from "next/navigation";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { MigajasSitio, VolverInicio } from "@/components/ui/MigajasSitio";

type AreaConfig = {
  titulo: string;
  archivo: string;
  prestadora: string;
  prestadoraDetalle?: string;
  descripcionCorta: string;
  queFiscaliza: string[];
  queSePuedeReclamar: string[];
  normativa: Array<{ norma: string; titulo: string }>;
  acento: "blue" | "yellow" | "green" | "purple";
};

const AREAS: Record<string, AreaConfig> = {
  agua: {
    titulo: "Agua y Saneamiento",
    archivo: "agua.png",
    prestadora: "SCPL — Sociedad Cooperativa Popular Limitada",
    prestadoraDetalle: "Provee agua potable y red cloacal a Comodoro Rivadavia.",
    descripcionCorta:
      "Servicio de provisión de agua potable y desagües cloacales para los hogares y comercios de Comodoro Rivadavia.",
    queFiscaliza: [
      "Continuidad del servicio sin cortes injustificados",
      "Calidad físico-química y bacteriológica del agua",
      "Presión adecuada en la red de distribución",
      "Tiempos de respuesta ante averías",
      "Estado de la red cloacal y desagües",
      "Facturación clara y conforme a la ordenanza",
    ],
    queSePuedeReclamar: [
      "Falta de agua en mi domicilio",
      "Pérdida o caño roto en la vía pública",
      "Baja presión persistente",
      "Cloaca tapada o desborde",
      "Mala calidad del agua (color, olor, sabor)",
      "Errores de facturación",
    ],
    normativa: [
      {
        norma: "Ordenanza 14.996/19",
        titulo: "Reglamento del Usuario del servicio de agua potable y desagües cloacales",
      },
    ],
    acento: "blue",
  },
  energia: {
    titulo: "Energía Eléctrica y Alumbrado Público",
    archivo: "energia.png",
    prestadora: "SCPL — Sociedad Cooperativa Popular Limitada",
    prestadoraDetalle:
      "Distribuidora de energía eléctrica y responsable del alumbrado público.",
    descripcionCorta:
      "Distribución de energía eléctrica domiciliaria, comercial e industrial, y mantenimiento del alumbrado público.",
    queFiscaliza: [
      "Continuidad del suministro eléctrico",
      "Calidad del producto técnico (tensión, frecuencia)",
      "Tiempos de respuesta ante cortes",
      "Mantenimiento de luminarias públicas",
      "Seguridad de la red (postes, cables, transformadores)",
      "Facturación conforme al cuadro tarifario",
    ],
    queSePuedeReclamar: [
      "Corte de luz en mi cuadra",
      "Luminaria apagada, titilante o caída",
      "Cable caído o riesgo eléctrico",
      "Reiteración de cortes en el sector",
      "Baja tensión persistente",
      "Errores de facturación o cuadro tarifario",
    ],
    normativa: [
      {
        norma: "Ordenanza 14.995/19",
        titulo: "Reglamento del Usuario de servicios públicos de distribución de energía eléctrica y alumbrado público",
      },
    ],
    acento: "yellow",
  },
  residuos: {
    titulo: "Gestión de Residuos",
    archivo: "residuos.png",
    prestadora: "CLEAR URBANA S.A.",
    prestadoraDetalle:
      "Empresa concesionaria del servicio de higiene urbana de la ciudad.",
    descripcionCorta:
      "Recolección domiciliaria de residuos, barrido de calles, mantenimiento de contenedores y operación de planta de tratamiento.",
    queFiscaliza: [
      "Cumplimiento del cronograma de recolección por zona",
      "Estado, cantidad y ubicación de contenedores",
      "Barrido y limpieza de calles, plazas y espacios públicos",
      "Retiro de residuos voluminosos y restos verdes",
      "Operación de la planta de tratamiento de residuos",
      "Cumplimiento del pliego licitatorio vigente",
    ],
    queSePuedeReclamar: [
      "No pasó el camión recolector",
      "Contenedor roto, desbordado o desplazado",
      "Basurales en la vía pública",
      "Residuos voluminosos sin retirar",
      "Suciedad en plazas o espacios públicos",
      "Olores o presencia de plagas",
    ],
    normativa: [
      {
        norma: "Ordenanza 11.638/14",
        titulo: "Residuos Sólidos Urbanos — texto ordenado",
      },
      {
        norma: "Ordenanza 11.728",
        titulo: "Pliego licitatorio de Higiene Urbana (10 años)",
      },
      {
        norma: "Lic. Pública 26/2025-SHU",
        titulo: "Nueva licitación del Servicio de Higiene Urbana — en curso",
      },
    ],
    acento: "green",
  },
  transporte: {
    titulo: "Transporte Público Interurbano",
    archivo: "transporte.png",
    prestadora: "PATAGONIA Argentina S.R.L. · TRANSPORTE DIADEMA S.A.",
    prestadoraDetalle:
      "Empresas concesionarias del servicio de transporte urbano e interurbano de pasajeros (contratos prorrogados).",
    descripcionCorta:
      "Servicio de colectivos urbanos e interurbanos que conectan los barrios de Comodoro Rivadavia, Rada Tilly y zonas aledañas.",
    queFiscaliza: [
      "Cumplimiento de frecuencias y recorridos del pliego",
      "Estado mecánico y de mantenimiento de las unidades",
      "Limpieza interior y exterior de los colectivos",
      "Cumplimiento del cuadro tarifario y boleto integrado",
      "Estado de paradas y refugios",
      "Trato del personal hacia los usuarios",
    ],
    queSePuedeReclamar: [
      "El colectivo no pasó",
      "Frecuencia irregular",
      "Mal estado de la unidad",
      "Mal trato del chofer o personal",
      "Cartel o parada dañada",
      "Cobro fuera del cuadro tarifario",
    ],
    normativa: [
      {
        norma: "Pliego licitatorio 2025",
        titulo: "Concesión del servicio de Transporte Urbano — proceso en curso",
      },
    ],
    acento: "purple",
  },
};

const ACENTO_CLASES: Record<AreaConfig["acento"], { border: string; bg: string }> = {
  blue: { border: "border-svc-blue/60", bg: "bg-svc-blue/10" },
  yellow: { border: "border-svc-yellow/70", bg: "bg-svc-yellow/15" },
  green: { border: "border-svc-green/60", bg: "bg-svc-green/10" },
  purple: { border: "border-[#7e57c2]/60", bg: "bg-[#7e57c2]/10" },
};

export function generateStaticParams() {
  return Object.keys(AREAS).map((svc) => ({ svc }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ svc: string }>;
}) {
  const { svc } = await params;
  const area = AREAS[svc];
  if (!area) return { title: "Área no encontrada · ENCOSEP" };
  return { title: `${area.titulo} · Áreas fiscalizadas · ENCOSEP` };
}

export default async function AreaFiscalizadaPage({
  params,
}: {
  params: Promise<{ svc: string }>;
}) {
  const { svc } = await params;
  const area = AREAS[svc];
  if (!area) notFound();

  const acento = ACENTO_CLASES[area.acento];

  return (
    <>
      <SeccionHeader
        kicker="Área fiscalizada"
        titulo={area.titulo}
        descripcion={area.descripcionCorta}
      />

      <main className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-8">
        <MigajasSitio items={[{ label: "Áreas fiscalizadas" }]} />
        {/* CABECERA CON ICONO + PRESTADORA + CTA */}
        <section
          className={`rounded-2xl border-2 ${acento.border} ${acento.bg} p-6 flex flex-col md:flex-row items-center gap-6`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/imagenes/areas/${area.archivo}`}
            alt={area.titulo}
            className="w-32 h-32 object-contain shrink-0"
          />
          <div className="flex-1 text-center md:text-left">
            <div className="text-[11px] font-bold tracking-widest uppercase text-muted">
              Prestadora controlada
            </div>
            <div className="text-lg font-extrabold text-navy mt-1">
              {area.prestadora}
            </div>
            {area.prestadoraDetalle && (
              <p className="text-sm text-navy mt-1 leading-relaxed">
                {area.prestadoraDetalle}
              </p>
            )}
          </div>
          <Link
            href={`/ingresar?callbackUrl=/reclamo/nuevo?svc=${svc}`}
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-svc-red text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-svc-red/30 whitespace-nowrap"
          >
            Hacer un reclamo →
          </Link>
        </section>

        {/* QUE FISCALIZA EL ENTE */}
        <section>
          <div className="text-xs font-bold tracking-widest uppercase text-muted">
            ¿Qué fiscaliza el Ente?
          </div>
          <h2 className="text-2xl font-extrabold text-navy mt-1">
            Estos son los aspectos bajo control
          </h2>
          <ul className="grid sm:grid-cols-2 gap-2 mt-4">
            {area.queFiscaliza.map((q, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-xl border border-line bg-paper p-3"
              >
                <span className="text-svc-green text-lg leading-none mt-0.5">
                  ✓
                </span>
                <span className="text-sm text-navy">{q}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* QUE SE PUEDE RECLAMAR */}
        <section>
          <div className="text-xs font-bold tracking-widest uppercase text-muted">
            ¿Qué puede reclamar el vecino?
          </div>
          <h2 className="text-2xl font-extrabold text-navy mt-1">
            Ejemplos de reclamos típicos
          </h2>
          <ul className="grid sm:grid-cols-2 gap-2 mt-4">
            {area.queSePuedeReclamar.map((q, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-xl border border-line bg-paper p-3"
              >
                <span className="text-svc-red text-lg leading-none mt-0.5">
                  •
                </span>
                <span className="text-sm text-navy">{q}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 text-center">
            <Link
              href={`/ingresar?callbackUrl=/reclamo/nuevo?svc=${svc}`}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-svc-red text-white font-bold text-base shadow-lg shadow-svc-red/30"
            >
              + Hacer un reclamo de {area.titulo}
            </Link>
          </div>
        </section>

        {/* NORMATIVA */}
        <section>
          <div className="text-xs font-bold tracking-widest uppercase text-muted">
            Marco regulatorio
          </div>
          <h2 className="text-2xl font-extrabold text-navy mt-1">
            Normativa aplicable
          </h2>
          <ul className="mt-4 space-y-2">
            {area.normativa.map((n) => (
              <li
                key={n.norma}
                className="rounded-xl border border-line bg-paper p-4"
              >
                <div className="font-mono font-bold text-navy-2 text-sm">
                  {n.norma}
                </div>
                <div className="text-sm text-navy mt-1">{n.titulo}</div>
              </li>
            ))}
          </ul>
          <Link
            href="/control-prestadoras"
            className="inline-block mt-4 text-xs text-navy-2 underline underline-offset-4 font-semibold"
          >
            Ver todas las normas →
          </Link>
        </section>

        <VolverInicio />
      </main>
    </>
  );
}
