import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeExportarInformes, TONE_CLASS } from "@/lib/admin";
import { crearInformeAnual, crearOAbrirInforme } from "./actions";

export const metadata = { title: "Informes oficiales · Panel ENCOSEP" };

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const ESTADO_META: Record<
  "BORRADOR" | "PUBLICADO" | "ARCHIVADO",
  { label: string; tone: "warning" | "success" | "neutral" }
> = {
  BORRADOR: { label: "Borrador", tone: "warning" },
  PUBLICADO: { label: "Publicado", tone: "success" },
  ARCHIVADO: { label: "Archivado", tone: "neutral" },
};

export default async function InformesPage() {
  const session = await auth();
  if (!session || !puedeExportarInformes(session.user.rol)) {
    redirect("/admin");
  }

  const [informes, informesAnuales] = await Promise.all([
    prisma.informeMensual.findMany({
      orderBy: [{ anio: "desc" }, { mes: "desc" }],
      include: { emitidoPor: true },
      take: 36,
    }),
    prisma.informeAnual.findMany({
      orderBy: { periodoDesde: "desc" },
      include: { emitidoPor: true },
      take: 12,
    }),
  ]);

  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1;
  const aniosOpciones = [anioActual, anioActual - 1, anioActual - 2];

  // Sugerencia de período por defecto para el informe anual:
  // octubre del año previo al 30 de septiembre del año actual.
  const sugDesde = `${anioActual - 1}-10-01`;
  const sugHasta = `${anioActual}-10-01`;
  const sugTitulo = `Informe de Gestión ${anioActual - 1}-${anioActual}`;

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <header>
        <h1 className="text-2xl font-extrabold text-navy">Informes oficiales</h1>
        <p className="text-sm text-muted mt-1">
          Informes que el Directorio eleva al Concejo Deliberante y al Poder
          Ejecutivo Municipal según el{" "}
          <strong className="text-navy">
            art. 5° inc. k de la Ordenanza N° 13.189/17
          </strong>
          .
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-3">
          Generar / abrir informe mensual
        </h2>
        <p className="text-xs text-muted mb-4 leading-relaxed">
          Elegí el mes y el año. Si todavía no existe, el sistema crea un
          borrador con las 7 secciones obligatorias completadas automáticamente
          desde los reclamos, expedientes, inspecciones publicadas, documental
          revisada por Adriana, encuesta de satisfacción e indicadores del mes.
          Después vos lo revisás, editás los textos jurídicos y lo publicás.
        </p>
        <form
          action={crearOAbrirInforme}
          className="flex flex-wrap items-end gap-3"
        >
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
              Mes
            </span>
            <select
              name="mes"
              defaultValue={mesActual}
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
            >
              {MESES.map((nombre, i) => (
                <option key={i + 1} value={i + 1}>
                  {nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
              Año
            </span>
            <select
              name="anio"
              defaultValue={anioActual}
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
            >
              {aniosOpciones.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-svc-red text-white font-bold text-sm"
          >
            Generar / abrir borrador
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-3">
          Histórico
        </h2>
        <div className="rounded-2xl border border-line bg-paper overflow-hidden">
          {informes.length === 0 ? (
            <div className="p-12 text-center text-muted text-sm">
              Todavía no se generó ningún informe mensual. Usá el bloque de
              arriba para crear el primero.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted bg-paper-2">
                <tr>
                  <th className="text-left font-semibold py-3 px-4">Período</th>
                  <th className="text-left font-semibold py-3 px-2">Estado</th>
                  <th className="text-left font-semibold py-3 px-2">
                    Emitido por
                  </th>
                  <th className="text-left font-semibold py-3 px-2">Emitido</th>
                  <th className="text-right font-semibold py-3 px-4">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {informes.map((i) => {
                  const meta = ESTADO_META[i.estado];
                  return (
                    <tr
                      key={i.id}
                      className="border-t border-line hover:bg-paper-2"
                    >
                      <td className="py-2.5 px-4 font-bold text-navy">
                        <Link
                          href={`/admin/informes/mensual/${i.id}`}
                          className="hover:underline"
                        >
                          {MESES[i.mes - 1]} {i.anio}
                        </Link>
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`inline-flex items-center uppercase tracking-wider font-bold rounded-full border text-[10px] px-2 py-0.5 ${TONE_CLASS[meta.tone]}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-navy text-xs">
                        {i.emitidoPor
                          ? `${i.emitidoPor.nombre} ${i.emitidoPor.apellido}`
                          : "—"}
                      </td>
                      <td className="py-2.5 px-2 text-muted text-xs whitespace-nowrap">
                        {i.emitidoEn
                          ? i.emitidoEn.toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "short",
                              year: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <a
                          href={`/api/informes/${i.id}`}
                          className="text-navy-2 underline text-xs mr-3"
                          title="Descargar .docx"
                        >
                          .docx
                        </a>
                        <Link
                          href={`/admin/informes/mensual/${i.id}`}
                          className="text-navy-2 underline text-xs"
                        >
                          Abrir →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="rounded-2xl border-2 border-svc-orange/40 bg-svc-orange/5 p-5">
        <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-2">
          Informe anual de gestión (art. 5° Ord. 13.189/17)
        </h2>
        <p className="text-xs text-muted mb-4 leading-relaxed">
          Se eleva al Concejo Deliberante y al Poder Ejecutivo Municipal al{" "}
          <strong className="text-navy">1° de octubre de cada año</strong>.
          Agrega los informes mensuales publicados del período y suma bloques
          narrativos de balance, logros, desafíos y sugerencias.
        </p>
        <form
          action={crearInformeAnual}
          className="grid sm:grid-cols-2 gap-3 mb-4"
        >
          <label className="sm:col-span-2 flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
              Título del informe
            </span>
            <input
              name="titulo"
              type="text"
              defaultValue={sugTitulo}
              required
              maxLength={200}
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
              Período desde
            </span>
            <input
              name="periodoDesde"
              type="date"
              defaultValue={sugDesde}
              required
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
              Período hasta (no inclusivo)
            </span>
            <input
              name="periodoHasta"
              type="date"
              defaultValue={sugHasta}
              required
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-svc-orange text-white font-bold text-sm"
            >
              Generar borrador del informe anual
            </button>
          </div>
        </form>

        {informesAnuales.length > 0 && (
          <div className="rounded-xl border border-line bg-paper overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted bg-paper-2">
                <tr>
                  <th className="text-left font-semibold py-2 px-3">Título</th>
                  <th className="text-left font-semibold py-2 px-2">Período</th>
                  <th className="text-left font-semibold py-2 px-2">Estado</th>
                  <th className="text-right font-semibold py-2 px-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {informesAnuales.map((a) => {
                  const tone =
                    a.estado === "PUBLICADO"
                      ? "success"
                      : a.estado === "BORRADOR"
                        ? "warning"
                        : "neutral";
                  return (
                    <tr
                      key={a.id}
                      className="border-t border-line hover:bg-paper-2"
                    >
                      <td className="py-2 px-3 font-bold text-navy">
                        <Link
                          href={`/admin/informes/anual/${a.id}`}
                          className="hover:underline"
                        >
                          {a.titulo}
                        </Link>
                      </td>
                      <td className="py-2 px-2 text-xs text-muted">
                        {a.periodoDesde.toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        })}{" "}
                        →{" "}
                        {a.periodoHasta.toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        })}
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`inline-flex items-center uppercase tracking-wider font-bold rounded-full border text-[10px] px-2 py-0.5 ${TONE_CLASS[tone]}`}
                        >
                          {a.estado}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <a
                          href={`/api/informes/anual/${a.id}`}
                          className="text-navy-2 underline text-xs mr-3"
                        >
                          .docx
                        </a>
                        <Link
                          href={`/admin/informes/anual/${a.id}`}
                          className="text-navy-2 underline text-xs"
                        >
                          Abrir →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
