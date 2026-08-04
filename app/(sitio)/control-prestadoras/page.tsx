import Link from "next/link";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { MigajasSitio, VolverInicio } from "@/components/ui/MigajasSitio";

export const metadata = { title: "Control a Prestadoras · ENCOSEP" };

const NORMATIVA_ENCOSEP = [
  {
    norma: "Ordenanza 6050/96 (t.o. 6050-5/23)",
    titulo: "Marco Regulatorio de la Concesión de Servicios Públicos",
    detalle:
      "Norma marco de la concesión y prestación de los servicios públicos (energía, alumbrado, agua y cloacas). Define las categorías de usuarios y los regímenes especiales (jubilados, electrodependientes, tarifa social, electrointensivos), el procedimiento tarifario y las audiencias públicas. Texto ordenado por la Ord. 6050-5/23 (vigente); permanecen vigentes los anexos de las modificatorias 6050-3/21 y 6050-4/22 en lo que no se le opongan.",
  },
  {
    norma: "Ordenanza 13.189/17",
    titulo: "Creación del ENCOSEP",
    detalle:
      "Crea el Ente de Control de los Servicios Públicos. Define su personería, autonomía funcional, competencia y los principios bajo los cuales debe prestarse cualquier servicio público en la ciudad.",
  },
];

const NORMATIVA_POR_SERVICIO: Record<
  string,
  Array<{ norma: string; titulo: string; detalle?: string }>
> = {
  Electricidad: [
    {
      norma: "Ordenanza 14.995/19",
      titulo:
        "Reglamento del Usuario de servicios públicos de distribución de energía eléctrica y alumbrado público",
      detalle:
        "Norma las conductas de la prestadora (SCPL), los derechos y obligaciones del usuario, y las relaciones con la autoridad concedente y el ENCOSEP.",
    },
  ],
  "Agua y cloacas": [
    {
      norma: "Ordenanza 14.996/19",
      titulo:
        "Reglamento del Usuario del servicio de agua potable y desagües cloacales",
      detalle:
        "Regula el uso del servicio prestado por SCPL, las obligaciones del usuario y las sanciones por incumplimiento.",
    },
  ],
  "Higiene urbana (Residuos)": [
    {
      norma: "Ordenanza 11.638/14",
      titulo: "Residuos Sólidos Urbanos — texto ordenado",
      detalle:
        "Marco general del régimen de residuos sólidos urbanos del municipio.",
    },
    {
      norma: "Ordenanza 11.728",
      titulo:
        "Aprobación del pliego licitatorio de Higiene Urbana (10 años)",
      detalle:
        "Base contractual del convenio de concesión con CLEAR URBANA S.A.",
    },
    {
      norma: "Licitación Pública 26/2025-SHU",
      titulo:
        "Licitación del Servicio de Higiene Urbana — proceso en curso",
      detalle:
        "Oferentes: Clear-Urbana S.A. y Ashira S.A. Concesión por 10 años.",
    },
  ],
  Transporte: [
    {
      norma: "Pliego licitatorio 2025",
      titulo:
        "Concesión del servicio de Transporte Urbano de Pasajeros — proceso en curso",
      detalle:
        "El Concejo Deliberante aprobó el nuevo pliego. Desde el 1° de agosto de 2026, SOL BUS (Grupo MR S.R.L.) presta el servicio en reemplazo de Patagonia Argentina S.R.L. Prestadoras actuales con contrato prorrogado: SOL BUS (Grupo MR S.R.L.) y TRANSPORTE DIADEMA S.A.",
    },
  ],
};

export default function ControlPrestadoras() {
  return (
    <>
      <SeccionHeader
        kicker="Marco regulatorio"
        titulo="Control a Prestadoras"
        descripcion="Normativa vigente, pliegos licitatorios y contratos de concesión de las empresas que prestan servicios públicos en Comodoro Rivadavia bajo control del Ente."
      />
      <main className="max-w-5xl mx-auto px-6 py-10">

      <MigajasSitio
        items={[
          { label: "Atención al Usuario", href: "/atencion-usuarios" },
          { label: "Normativa" },
        ]}
      />

      <section className="rounded-2xl border border-navy-2/40 bg-navy-2/5 p-6">
        <div className="text-xs font-bold tracking-widest uppercase text-navy-2">
          ¿Sos una prestadora controlada?
        </div>
        <h2 className="text-xl font-extrabold text-navy mt-2">
          Accedé al Portal de Prestadoras
        </h2>
        <p className="text-sm text-navy mt-2">
          Gestioná los reclamos asignados a tu empresa, presentá descargos en
          expedientes administrativos y consultá los vencimientos de
          documentación.
        </p>
        <Link
          href="/prestadoras"
          className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-navy-2 text-white font-bold text-sm mt-4"
        >
          Ir al Portal de Prestadoras →
        </Link>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-navy">
          Normativa del ENCOSEP
        </h2>
        <ul className="mt-4 space-y-3">
          {NORMATIVA_ENCOSEP.map((n) => (
            <NormaItem key={n.norma} {...n} />
          ))}
        </ul>
      </section>

      {Object.entries(NORMATIVA_POR_SERVICIO).map(([servicio, normas]) => (
        <section key={servicio} className="mt-10">
          <h2 className="text-2xl font-extrabold text-navy">{servicio}</h2>
          <ul className="mt-4 space-y-3">
            {normas.map((n) => (
              <NormaItem key={n.norma} {...n} />
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-12 rounded-2xl border border-line bg-paper-2 p-6">
        <h2 className="text-base font-extrabold text-navy">
          ¿Buscás una norma específica?
        </h2>
        <p className="text-sm text-muted mt-2 leading-relaxed">
          El listado de arriba contiene la normativa más relevante de cada
          servicio. Para acceder al texto completo y a otras normas, podés
          consultar el{" "}
          <a
            href="https://www.digestocomodoro.gob.ar/"
            target="_blank"
            rel="noreferrer"
            className="underline text-navy-2 font-semibold"
          >
            Digesto Municipal de Comodoro Rivadavia
          </a>{" "}
          (sector "Ente de Control de Servicios Públicos").
        </p>
      </section>

      <VolverInicio
        volverA={{
          label: "Volver a Atención al Usuario",
          href: "/atencion-usuarios",
        }}
      />
      </main>
    </>
  );
}

function NormaItem({
  norma,
  titulo,
  detalle,
}: {
  norma: string;
  titulo: string;
  detalle?: string;
}) {
  return (
    <li className="rounded-xl border border-line bg-paper p-4">
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="font-mono font-bold text-navy-2 text-sm whitespace-nowrap">
          {norma}
        </span>
        <span className="text-sm font-semibold text-navy leading-snug">
          {titulo}
        </span>
      </div>
      {detalle && (
        <p className="text-xs text-muted leading-relaxed mt-2">{detalle}</p>
      )}
    </li>
  );
}
