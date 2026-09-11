import Link from "next/link";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { SVC_META, SVC_ORDER } from "@/lib/servicios";
import { getIndicadoresStats } from "@/lib/indicadores-stats";
import { IndicadoresContenido } from "@/components/indicadores/IndicadoresContenido";
import { MigajasSitio, VolverInicio } from "@/components/ui/MigajasSitio";

export const metadata = { title: "Indicadores · ENCOSEP" };
export const revalidate = 60; // se rearma cada minuto en prod (datos casi en vivo)

const fechaISO = (d: Date) => d.toISOString().slice(0, 10);

type SP = {
  desde?: string;
  hasta?: string;
  svc?: string;
};

export default async function IndicadoresPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const anoActual = new Date().getFullYear();
  const stats = await getIndicadoresStats(sp);
  const { desde, hasta, svcLabel } = stats;

  const hayFiltros = Boolean(sp.desde || sp.hasta || sp.svc);
  const qs = new URLSearchParams({
    desde: sp.desde ?? fechaISO(desde),
    hasta: sp.hasta ?? fechaISO(hasta),
    ...(sp.svc ? { svc: sp.svc } : {}),
  }).toString();

  const tituloPeriodo =
    (fechaISO(desde) === fechaISO(new Date(anoActual, 0, 1)) && !sp.hasta
      ? `Reclamos año ${anoActual}`
      : `Reclamos del ${desde.toLocaleDateString("es-AR")} al ${hasta.toLocaleDateString("es-AR")}`) +
    (svcLabel ? ` · ${svcLabel}` : "");

  return (
    <>
      <SeccionHeader
        kicker="Datos en tiempo real"
        titulo="Indicadores públicos"
        descripcion="Información agregada y anonimizada sobre la gestión del Ente: reclamos, resolución por prestadora y satisfacción del usuario. Actualizado cada minuto."
      />

      <main className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8">
        <MigajasSitio items={[{ label: "Indicadores" }]} />

        {/* FILTROS — por rango de fechas y servicio, para armar capturas de informes */}
        <form
          method="GET"
          className="flex flex-wrap gap-2 items-end p-3 rounded-xl border border-line bg-paper"
        >
          <Field label="Desde">
            <input
              type="date"
              name="desde"
              defaultValue={sp.desde ?? fechaISO(desde)}
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy focus:outline-none focus:border-navy-2"
            />
          </Field>
          <Field label="Hasta">
            <input
              type="date"
              name="hasta"
              defaultValue={sp.hasta ?? fechaISO(hasta)}
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy focus:outline-none focus:border-navy-2"
            />
          </Field>
          <Field label="Servicio">
            <select
              name="svc"
              defaultValue={sp.svc ?? ""}
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy focus:outline-none focus:border-navy-2"
            >
              <option value="">Todos</option>
              {SVC_ORDER.map((k) => (
                <option key={k} value={k}>
                  {SVC_META[k].short}
                </option>
              ))}
            </select>
          </Field>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-navy-2 text-white font-semibold text-sm"
          >
            Filtrar
          </button>
          {hayFiltros && (
            <Link
              href="/indicadores"
              className="px-4 py-2 rounded-lg border border-line-strong text-sm text-navy"
            >
              Limpiar filtros
            </Link>
          )}
          <div className="flex gap-2 ml-auto">
            <Link
              href={`/api/indicadores/exportar?${qs}`}
              className="px-4 py-2 rounded-lg border border-line-strong text-sm text-navy font-semibold"
            >
              ⬇ Descargar Word
            </Link>
            <Link
              href={`/indicadores/imprimir?${qs}`}
              className="px-4 py-2 rounded-lg border border-line-strong text-sm text-navy font-semibold"
            >
              🖨️ Descargar PDF
            </Link>
          </div>
        </form>

        <IndicadoresContenido stats={stats} tituloPeriodo={tituloPeriodo} variante="publico" />

        <VolverInicio />
      </main>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </span>
      {children}
    </label>
  );
}
