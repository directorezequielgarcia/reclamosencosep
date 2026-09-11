import Link from "next/link";
import { getEncuestaFilas, type EncuestaFila } from "@/lib/indicadores-stats";

export const metadata = { title: "Encuesta de satisfacción · Panel de consulta ENCOSEP" };
export const revalidate = 60;

const fechaISO = (d: Date) => d.toISOString().slice(0, 10);
const fechaLarga = (d: Date) => d.toLocaleDateString("es-AR");

const RESPONSABILIDAD_LABEL: Record<string, string> = {
  COMPARTIDA: "Compartida",
  MCR: "Municipio",
  PRESTADORA: "Prestadora",
};

function promedio(filas: EncuestaFila[], campo: keyof EncuestaFila): number | null {
  const valores = filas
    .map((f) => f[campo])
    .filter((v): v is number => typeof v === "number");
  if (valores.length === 0) return null;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

type SP = { desde?: string; hasta?: string };

export default async function ConsultaEncuestaPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const { desde, hasta, filas } = await getEncuestaFilas(sp);
  const hayFiltros = Boolean(sp.desde || sp.hasta);
  const qs = new URLSearchParams({
    desde: sp.desde ?? fechaISO(desde),
    hasta: sp.hasta ?? fechaISO(hasta),
  }).toString();

  const promedios = [
    { label: "Agua y Saneamiento", v: promedio(filas, "puntajeAgua") },
    { label: "Energía", v: promedio(filas, "puntajeEnergia") },
    { label: "Residuos", v: promedio(filas, "puntajeResiduos") },
    { label: "Transporte", v: promedio(filas, "puntajeTransporte") },
  ];

  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold text-navy">Encuesta de satisfacción</h1>
        <p className="text-sm text-muted mt-1">
          Resultados de la encuesta pública de satisfacción del usuario. Solo consulta y descarga — acá no se vota.
        </p>
      </div>

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
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-navy-2 text-white font-semibold text-sm"
        >
          Filtrar
        </button>
        {hayFiltros && (
          <Link
            href="/consulta/encuesta"
            className="px-4 py-2 rounded-lg border border-line-strong text-sm text-navy"
          >
            Limpiar filtros
          </Link>
        )}
        <div className="ml-auto">
          <Link
            href={`/api/consulta/encuesta/exportar-excel?${qs}`}
            className="px-4 py-2 rounded-lg border border-line-strong text-sm text-navy font-semibold"
          >
            ⬇ Excel
          </Link>
        </div>
      </form>

      <section className="rounded-2xl border border-line bg-paper p-6">
        <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-1">
          Promedios del período
        </h2>
        <p className="text-xs text-muted mb-4">
          {filas.length} respuesta{filas.length === 1 ? "" : "s"} entre el{" "}
          {fechaLarga(desde)} y el {fechaLarga(hasta)} (escala 1 al 5).
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {promedios.map((p) => (
            <div
              key={p.label}
              className="flex items-center justify-between rounded-lg border border-line bg-paper-2 px-3 py-2"
            >
              <span className="text-sm text-navy">{p.label}</span>
              <span className="text-lg font-extrabold text-navy">
                {p.v ? p.v.toFixed(1) : "—"}
                {p.v ? <span className="text-sm text-muted"> / 5</span> : null}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-paper p-6 overflow-x-auto">
        <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-3">
          Respuestas individuales
        </h2>
        {filas.length === 0 ? (
          <div className="text-sm text-muted">
            No hay respuestas en el período seleccionado.
          </div>
        ) : (
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-line">
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">Barrio</th>
                <th className="py-2 pr-3 text-right">Agua</th>
                <th className="py-2 pr-3 text-right">Energía</th>
                <th className="py-2 pr-3 text-right">Residuos</th>
                <th className="py-2 pr-3 text-right">Transporte</th>
                <th className="py-2 pr-3">Responsabilidad</th>
                <th className="py-2">Comentario</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id} className="border-b border-line-strong/40 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap">{fechaLarga(f.createdAt)}</td>
                  <td className="py-2 pr-3">{f.barrio ?? "—"}</td>
                  <td className="py-2 pr-3 text-right font-mono">{f.puntajeAgua ?? "—"}</td>
                  <td className="py-2 pr-3 text-right font-mono">{f.puntajeEnergia ?? "—"}</td>
                  <td className="py-2 pr-3 text-right font-mono">{f.puntajeResiduos ?? "—"}</td>
                  <td className="py-2 pr-3 text-right font-mono">{f.puntajeTransporte ?? "—"}</td>
                  <td className="py-2 pr-3">
                    {f.responsabilidad ? RESPONSABILIDAD_LABEL[f.responsabilidad] ?? f.responsabilidad : "—"}
                  </td>
                  <td className="py-2 text-muted max-w-[320px]">{f.comentario ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
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
