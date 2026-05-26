import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ESTADO_DOC_META,
  TIPO_DOC_META,
  periodoLabel,
} from "@/lib/documentos";
import { TONE_CLASS } from "@/lib/admin";
import type { EstadoDocumento, Prisma, TipoDocumento } from "@prisma/client";

export const metadata = { title: "Documentación · Panel ENCOSEP" };

type SP = { estado?: string; tipo?: string; prestadora?: string };

export default async function DocumentacionPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const session = await auth();

  // Filtro base por rol: operador prestadora solo ve los suyos
  const where: Prisma.DocumentoWhereInput = {};
  if (session!.user.rol === "OPERADOR_PRESTADORA") {
    where.prestadoraId = session!.user.prestadoraId ?? "__none__";
  }
  if (sp.estado && sp.estado in ESTADO_DOC_META) {
    where.estado = sp.estado as EstadoDocumento;
  }
  if (sp.tipo && sp.tipo in TIPO_DOC_META) {
    where.tipo = sp.tipo as TipoDocumento;
  }
  if (sp.prestadora) {
    where.prestadoraId = sp.prestadora;
  }

  const [docs, prestadoras, totales] = await Promise.all([
    prisma.documento.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { prestadora: true, subidoPor: true },
    }),
    prisma.prestadora.findMany({ where: { activa: true }, orderBy: { razonSocial: "asc" } }),
    prisma.documento.groupBy({
      by: ["estado"],
      where,
      _count: { _all: true },
    }),
  ]);

  const pendientes = totales.find((t) => t.estado === "PENDIENTE")?._count._all ?? 0;
  const observados = totales.find((t) => t.estado === "OBSERVADO")?._count._all ?? 0;
  const aprobados = totales.find((t) => t.estado === "APROBADO")?._count._all ?? 0;

  const puedeSubir =
    session!.user.rol === "OPERADOR_PRESTADORA" ||
    session!.user.rol === "GESTOR_ENTE" ||
    session!.user.rol === "SUPER_ADMIN";

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Documentación</h1>
          <p className="text-sm text-muted mt-1">
            {session!.user.rol === "OPERADOR_PRESTADORA"
              ? "Documentación que tu empresa presentó al Ente."
              : "Documentación presentada por las prestadoras controladas."}
          </p>
        </div>
        {puedeSubir && (
          <Link
            href="/admin/documentacion/subir"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-svc-red text-white text-sm font-bold"
          >
            + Subir documento
          </Link>
        )}
      </header>

      <section className="grid grid-cols-3 gap-3">
        <Kpi label="Pendientes" value={pendientes} tone="warning" />
        <Kpi label="Observados" value={observados} tone="warning" />
        <Kpi label="Aprobados" value={aprobados} tone="success" />
      </section>

      <form
        method="GET"
        className="flex flex-wrap gap-2 items-end p-3 rounded-xl border border-line bg-paper"
      >
        <Field label="Estado">
          <select
            name="estado"
            defaultValue={sp.estado ?? ""}
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
          >
            <option value="">Todos</option>
            {(Object.keys(ESTADO_DOC_META) as EstadoDocumento[]).map((e) => (
              <option key={e} value={e}>
                {ESTADO_DOC_META[e].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tipo">
          <select
            name="tipo"
            defaultValue={sp.tipo ?? ""}
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
          >
            <option value="">Todos</option>
            {(Object.keys(TIPO_DOC_META) as TipoDocumento[]).map((t) => (
              <option key={t} value={t}>
                {TIPO_DOC_META[t].label}
              </option>
            ))}
          </select>
        </Field>
        {session!.user.rol !== "OPERADOR_PRESTADORA" && (
          <Field label="Prestadora">
            <select
              name="prestadora"
              defaultValue={sp.prestadora ?? ""}
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
            >
              <option value="">Todas</option>
              {prestadoras.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.razonSocial}
                </option>
              ))}
            </select>
          </Field>
        )}
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-navy-2 text-white font-semibold text-sm"
        >
          Aplicar
        </button>
        {(sp.estado || sp.tipo || sp.prestadora) && (
          <Link
            href="/admin/documentacion"
            className="px-4 py-2 rounded-lg border border-line-strong text-sm text-navy"
          >
            Limpiar
          </Link>
        )}
      </form>

      <div className="rounded-2xl border border-line bg-paper overflow-hidden">
        {docs.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm">
            {puedeSubir
              ? "Todavía no hay documentos cargados. Usá el botón + Subir documento."
              : "No hay documentos para mostrar con esos filtros."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted bg-paper-2">
              <tr>
                <th className="text-left font-semibold py-3 px-4">Título</th>
                <th className="text-left font-semibold py-3 px-2">Tipo</th>
                <th className="text-left font-semibold py-3 px-2">Período</th>
                <th className="text-left font-semibold py-3 px-2">Prestadora</th>
                <th className="text-left font-semibold py-3 px-2">Estado</th>
                <th className="text-left font-semibold py-3 px-4">Subido</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => {
                const t = TIPO_DOC_META[d.tipo];
                const e = ESTADO_DOC_META[d.estado];
                const fecha = d.createdAt.toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "short",
                  year: "2-digit",
                });
                return (
                  <tr
                    key={d.id}
                    className="border-t border-line hover:bg-paper-2"
                  >
                    <td className="py-2.5 px-4">
                      <Link
                        href={`/admin/documentacion/${d.id}`}
                        className="font-semibold text-navy hover:underline"
                      >
                        {d.titulo}
                      </Link>
                    </td>
                    <td className="py-2.5 px-2 text-navy">
                      <span className="mr-1">{t.icon}</span>
                      {t.label}
                    </td>
                    <td className="py-2.5 px-2 text-muted">
                      {periodoLabel(d.tipo, d.periodo)}
                    </td>
                    <td className="py-2.5 px-2 text-navy max-w-[200px] truncate">
                      {d.prestadora.razonSocial}
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`inline-flex items-center uppercase tracking-wider font-bold rounded-full border text-[10px] px-2 py-0.5 ${TONE_CLASS[e.tone]}`}
                      >
                        {e.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-muted whitespace-nowrap">
                      {fecha}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </span>
      {children}
    </label>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "warning" | "success";
}) {
  const cls = tone === "warning" ? "border-svc-yellow/60" : "border-svc-green/50";
  return (
    <div className={`rounded-2xl border-2 ${cls} bg-paper p-4`}>
      <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </div>
      <div className="text-3xl font-extrabold text-navy leading-none mt-1">
        {value}
      </div>
    </div>
  );
}
