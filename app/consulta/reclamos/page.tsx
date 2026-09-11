import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ESTADO_META, whereReclamosByRol } from "@/lib/admin";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { svcFromKind, SVC_META, SVC_ORDER } from "@/lib/servicios";
import { parseLineaTransporte } from "@/lib/xlsx-reporte-reclamos";
import { auth } from "@/lib/auth";
import type { Prisma, ReclamoEstado } from "@prisma/client";

export const metadata = { title: "Reclamos ingresados · Panel de consulta ENCOSEP" };

type SP = {
  estado?: string;
  svc?: string;
  q?: string;
  desde?: string;
  hasta?: string;
};

export default async function ConsultaReclamosPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const session = await auth();

  // AUTORIDAD_APLICACION (y Dirección, que también entra a este panel) no
  // tienen prestadoraId propio: whereReclamosByRol devuelve {} → ven todos
  // los reclamos, correcto para un rol de supervisión.
  const where: Prisma.ReclamoWhereInput = {
    ...whereReclamosByRol(session!.user.rol, session!.user.prestadoraId),
  };
  if (sp.estado && sp.estado in ESTADO_META) {
    where.estado = sp.estado as ReclamoEstado;
  }
  if (sp.svc && sp.svc in SVC_META) {
    where.servicio = { kind: SVC_META[sp.svc as keyof typeof SVC_META].kind };
  }
  if (sp.q && sp.q.trim()) {
    const q = sp.q.trim();
    where.OR = [{ codigo: { contains: q } }, { titulo: { contains: q } }];
  }
  if (sp.desde || sp.hasta) {
    where.createdAt = {};
    if (sp.desde) where.createdAt.gte = new Date(`${sp.desde}T00:00:00`);
    if (sp.hasta) where.createdAt.lte = new Date(`${sp.hasta}T23:59:59`);
  }

  const reclamos = await prisma.reclamo.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      codigo: true,
      titulo: true,
      barrio: true,
      estado: true,
      createdAt: true,
      descripcion: true,
      servicio: { select: { kind: true, nombreCorto: true } },
    },
  });

  const hayFiltros = Boolean(sp.estado || sp.svc || sp.q || sp.desde || sp.hasta);

  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold text-navy">Reclamos ingresados</h1>
        <p className="text-sm text-muted mt-1">
          {reclamos.length} {reclamos.length === 1 ? "reclamo" : "reclamos"}{" "}
          {hayFiltros ? "según filtros" : "en total"} — vista resumida, sin
          datos personales del vecino.
        </p>
      </div>

      <form
        method="GET"
        className="flex flex-wrap gap-2 items-end p-3 rounded-xl border border-line bg-paper"
      >
        <Field label="Buscar">
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="N° de ticket o título…"
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy focus:outline-none focus:border-navy-2 min-w-[220px]"
          />
        </Field>
        <Field label="Estado">
          <select
            name="estado"
            defaultValue={sp.estado ?? ""}
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy focus:outline-none focus:border-navy-2"
          >
            <option value="">Todos</option>
            {(Object.keys(ESTADO_META) as ReclamoEstado[]).map((e) => (
              <option key={e} value={e}>
                {ESTADO_META[e].label}
              </option>
            ))}
          </select>
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
        <Field label="Desde">
          <input
            type="date"
            name="desde"
            defaultValue={sp.desde ?? ""}
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy focus:outline-none focus:border-navy-2"
          />
        </Field>
        <Field label="Hasta">
          <input
            type="date"
            name="hasta"
            defaultValue={sp.hasta ?? ""}
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy focus:outline-none focus:border-navy-2"
          />
        </Field>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-navy-2 text-white font-semibold text-sm"
        >
          Aplicar
        </button>
        {hayFiltros && (
          <Link
            href="/consulta/reclamos"
            className="px-4 py-2 rounded-lg border border-line-strong text-sm text-navy"
          >
            Limpiar
          </Link>
        )}
      </form>

      <div className="rounded-2xl border border-line bg-paper overflow-hidden overflow-x-auto">
        {reclamos.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm">
            No hay reclamos que coincidan con los filtros.
          </div>
        ) : (
          <table className="w-full text-sm min-w-[760px]">
            <thead className="text-[11px] uppercase tracking-wider text-muted bg-paper-2">
              <tr>
                <th className="text-left font-semibold py-3 px-4">N° ticket</th>
                <th className="text-left font-semibold py-3 px-2">Servicio</th>
                <th className="text-left font-semibold py-3 px-2">Situación</th>
                <th className="text-left font-semibold py-3 px-2">Línea</th>
                <th className="text-left font-semibold py-3 px-2">Barrio</th>
                <th className="text-left font-semibold py-3 px-2">Estado</th>
                <th className="text-left font-semibold py-3 px-4">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {reclamos.map((r) => {
                const svc = svcFromKind(r.servicio.kind);
                const { linea } = parseLineaTransporte(r.descripcion);
                const fecha = r.createdAt.toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "short",
                  year: "2-digit",
                });
                return (
                  <tr key={r.id} className="border-t border-line">
                    <td className="py-2.5 px-4 font-mono font-bold text-navy">
                      #{r.codigo}
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        <SvcIcon kind={svc} size={26} />
                        <span className="text-navy text-xs">{r.servicio.nombreCorto}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-navy max-w-[260px] truncate">
                      {r.titulo}
                    </td>
                    <td className="py-2.5 px-2 text-navy">
                      {r.servicio.kind === "TRANSPORTE" && linea ? linea : "—"}
                    </td>
                    <td className="py-2.5 px-2 text-muted max-w-[160px] truncate">
                      {r.barrio ?? "—"}
                    </td>
                    <td className="py-2.5 px-2">
                      <EstadoBadge estado={r.estado} size="sm" />
                    </td>
                    <td className="py-2.5 px-4 text-muted whitespace-nowrap">{fecha}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
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
