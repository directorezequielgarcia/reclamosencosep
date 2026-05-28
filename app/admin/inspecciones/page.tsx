import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeGestionarInspecciones, TONE_CLASS } from "@/lib/admin";
import {
  ESTADO_INSPECCION_META,
  TIPO_INSPECCION_META,
} from "@/lib/inspecciones";
import type { EstadoInspeccion, Prisma, TipoInspeccion } from "@prisma/client";

export const metadata = { title: "Inspecciones · Panel ENCOSEP" };

type SP = {
  estado?: string;
  servicio?: string;
  tipo?: string;
};

export default async function InspeccionesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const session = await auth();
  if (!session || !puedeGestionarInspecciones(session.user.rol)) {
    redirect("/admin");
  }

  const sp = await searchParams;
  const where: Prisma.InspeccionWhereInput = {};
  if (sp.estado && sp.estado in ESTADO_INSPECCION_META) {
    where.estado = sp.estado as EstadoInspeccion;
  }
  if (sp.tipo && sp.tipo in TIPO_INSPECCION_META) {
    where.tipo = sp.tipo as TipoInspeccion;
  }
  if (sp.servicio) {
    where.servicioId = sp.servicio;
  }

  const [inspecciones, servicios, totales] = await Promise.all([
    prisma.inspeccion.findMany({
      where,
      orderBy: { fecha: "desc" },
      take: 100,
      include: {
        servicio: true,
        prestadora: true,
        inspector: true,
        _count: { select: { fotos: true } },
      },
    }),
    prisma.servicio.findMany({ orderBy: { nombreCorto: "asc" } }),
    prisma.inspeccion.groupBy({
      by: ["estado"],
      _count: { _all: true },
    }),
  ]);

  const borradores =
    totales.find((t) => t.estado === "BORRADOR")?._count._all ?? 0;
  const publicadas =
    totales.find((t) => t.estado === "PUBLICADA")?._count._all ?? 0;
  const archivadas =
    totales.find((t) => t.estado === "ARCHIVADA")?._count._all ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">
            Inspecciones de campo
          </h1>
          <p className="text-sm text-muted mt-1">
            Relevamientos realizados por el equipo del Ente sobre los servicios
            públicos bajo control.
          </p>
        </div>
        <Link
          href="/admin/inspecciones/nueva"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-svc-red text-white text-sm font-bold"
        >
          + Nueva inspección
        </Link>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <Kpi label="Borradores" value={borradores} tone="warning" />
        <Kpi label="Publicadas" value={publicadas} tone="success" />
        <Kpi label="Archivadas" value={archivadas} tone="neutral" />
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
            {(Object.keys(ESTADO_INSPECCION_META) as EstadoInspeccion[]).map(
              (e) => (
                <option key={e} value={e}>
                  {ESTADO_INSPECCION_META[e].label}
                </option>
              ),
            )}
          </select>
        </Field>
        <Field label="Tipo">
          <select
            name="tipo"
            defaultValue={sp.tipo ?? ""}
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
          >
            <option value="">Todos</option>
            {(Object.keys(TIPO_INSPECCION_META) as TipoInspeccion[]).map((t) => (
              <option key={t} value={t}>
                {TIPO_INSPECCION_META[t].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Servicio">
          <select
            name="servicio"
            defaultValue={sp.servicio ?? ""}
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
          >
            <option value="">Todos</option>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombreCorto}
              </option>
            ))}
          </select>
        </Field>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-navy-2 text-white font-semibold text-sm"
        >
          Aplicar
        </button>
        {(sp.estado || sp.tipo || sp.servicio) && (
          <Link
            href="/admin/inspecciones"
            className="px-4 py-2 rounded-lg border border-line-strong text-sm text-navy"
          >
            Limpiar
          </Link>
        )}
      </form>

      <div className="rounded-2xl border border-line bg-paper overflow-hidden">
        {inspecciones.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm">
            Todavía no hay inspecciones cargadas. Usá el botón{" "}
            <strong>+ Nueva inspección</strong> para registrar la primera.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted bg-paper-2">
              <tr>
                <th className="text-left font-semibold py-3 px-4">Código</th>
                <th className="text-left font-semibold py-3 px-2">Fecha</th>
                <th className="text-left font-semibold py-3 px-2">Servicio</th>
                <th className="text-left font-semibold py-3 px-2">Tipo</th>
                <th className="text-left font-semibold py-3 px-2">Inspector</th>
                <th className="text-left font-semibold py-3 px-2">Ubicación</th>
                <th className="text-left font-semibold py-3 px-2">Fotos</th>
                <th className="text-left font-semibold py-3 px-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {inspecciones.map((i) => {
                const e = ESTADO_INSPECCION_META[i.estado];
                const t = TIPO_INSPECCION_META[i.tipo];
                const fecha = i.fecha.toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "short",
                  year: "2-digit",
                });
                return (
                  <tr
                    key={i.id}
                    className="border-t border-line hover:bg-paper-2"
                  >
                    <td className="py-2.5 px-4 font-mono font-bold text-navy">
                      <Link
                        href={`/admin/inspecciones/${i.id}`}
                        className="hover:underline"
                      >
                        {i.codigo}
                      </Link>
                      <div className="text-[11px] font-sans font-normal text-muted truncate max-w-[220px]">
                        {i.titulo}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-navy whitespace-nowrap">
                      {fecha}
                    </td>
                    <td className="py-2.5 px-2 text-navy">
                      {i.servicio.nombreCorto}
                    </td>
                    <td className="py-2.5 px-2 text-navy text-xs">{t.label}</td>
                    <td className="py-2.5 px-2 text-muted text-xs whitespace-nowrap">
                      {i.inspector.apellido}, {i.inspector.nombre.charAt(0)}.
                    </td>
                    <td className="py-2.5 px-2 text-muted text-xs">
                      {i.barrio ?? i.direccion ?? "—"}
                    </td>
                    <td className="py-2.5 px-2 text-muted text-xs">
                      {i._count.fotos > 0 ? `${i._count.fotos} 📷` : "—"}
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`inline-flex items-center uppercase tracking-wider font-bold rounded-full border text-[10px] px-2 py-0.5 ${TONE_CLASS[e.tone]}`}
                      >
                        {e.label}
                      </span>
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
  tone: "warning" | "success" | "neutral";
}) {
  const cls =
    tone === "warning"
      ? "border-svc-yellow/60"
      : tone === "success"
        ? "border-svc-green/50"
        : "border-line";
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
