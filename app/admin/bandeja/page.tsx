import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ESTADO_META, whereReclamosByRol } from "@/lib/admin";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { svcFromKind, SVC_META, SVC_ORDER } from "@/lib/servicios";
import type { Prisma, ReclamoEstado, ServicioKind } from "@prisma/client";

export const metadata = { title: "Bandeja · Panel ENCOSEP" };

type SP = {
  estado?: string;
  svc?: string;
  q?: string;
  pendiente?: string;
  desde?: string;
  hasta?: string;
};

export default async function BandejaPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const baseWhere = whereReclamosByRol(
    session!.user.rol,
    session!.user.prestadoraId,
  );

  const where: Prisma.ReclamoWhereInput = { ...baseWhere };
  if (sp.estado && sp.estado in ESTADO_META) {
    where.estado = sp.estado as ReclamoEstado;
  }
  if (sp.svc && sp.svc in SVC_META) {
    where.servicio = { kind: SVC_META[sp.svc as keyof typeof SVC_META].kind };
  }
  if (sp.q && sp.q.trim()) {
    const q = sp.q.trim();
    where.OR = [
      { codigo: { contains: q } },
      { titulo: { contains: q } },
      { direccion: { contains: q } },
      { ciudadano: { dni: { contains: q } } },
      { ciudadano: { apellido: { contains: q } } },
    ];
  }
  const soloPendientes = sp.pendiente === "1";
  if (soloPendientes) {
    where.eventos = { some: { leidoEnte: false } };
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
    include: {
      servicio: true,
      prestadora: true,
      ciudadano: true,
      eventos: {
        where: { leidoEnte: false },
        select: { tipo: true },
      },
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Bandeja</h1>
          <p className="text-sm text-muted mt-1">
            {reclamos.length} {reclamos.length === 1 ? "reclamo" : "reclamos"}{" "}
            {sp.estado || sp.svc || sp.q || sp.desde || sp.hasta
              ? "según filtros"
              : "en total"}
            .
          </p>
        </div>
      </header>

      <form
        method="GET"
        className="flex flex-wrap gap-2 items-end p-3 rounded-xl border border-line bg-paper"
      >
        <Field label="Buscar">
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="código, dirección, DNI, apellido…"
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy focus:outline-none focus:border-navy-2 min-w-[240px]"
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
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-line-strong bg-paper-2 text-sm text-navy cursor-pointer">
          <input
            type="checkbox"
            name="pendiente"
            value="1"
            defaultChecked={soloPendientes}
            className="w-4 h-4"
          />
          🔔 Solo con novedades del vecino
        </label>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-navy-2 text-white font-semibold text-sm"
        >
          Aplicar
        </button>
        {(sp.estado || sp.svc || sp.q || soloPendientes || sp.desde || sp.hasta) && (
          <Link
            href="/admin/bandeja"
            className="px-4 py-2 rounded-lg border border-line-strong text-sm text-navy"
          >
            Limpiar
          </Link>
        )}
      </form>

      <div className="rounded-2xl border border-line bg-paper overflow-hidden">
        {reclamos.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm">
            No hay reclamos que coincidan con los filtros.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted bg-paper-2">
              <tr>
                <th className="text-left font-semibold py-3 px-4">Código</th>
                <th className="text-left font-semibold py-3 px-2">Servicio</th>
                <th className="text-left font-semibold py-3 px-2">Asunto</th>
                <th className="text-left font-semibold py-3 px-2">Dirección</th>
                <th className="text-left font-semibold py-3 px-2">Vecino</th>
                <th className="text-left font-semibold py-3 px-2">Prestadora</th>
                <th className="text-left font-semibold py-3 px-2">Estado</th>
                <th className="text-left font-semibold py-3 px-2">Novedades</th>
                <th className="text-left font-semibold py-3 px-4">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {reclamos.map((r) => {
                const svc = svcFromKind(r.servicio.kind);
                const fecha = r.createdAt.toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "short",
                  year: "2-digit",
                });
                return (
                  <tr
                    key={r.id}
                    className="border-t border-line hover:bg-paper-2 cursor-pointer"
                  >
                    <td className="py-2.5 px-4">
                      <Link
                        href={`/admin/reclamo/${r.id}`}
                        className="font-mono font-bold text-navy hover:underline"
                      >
                        #{r.codigo}
                      </Link>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        <SvcIcon kind={svc} size={26} />
                        <span className="text-navy text-xs">
                          {r.servicio.nombreCorto}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-navy max-w-[200px] truncate">
                      {r.titulo}
                    </td>
                    <td className="py-2.5 px-2 text-muted max-w-[180px] truncate">
                      {r.direccion}
                    </td>
                    <td className="py-2.5 px-2 text-navy max-w-[140px] truncate">
                      {r.ciudadano.nombre} {r.ciudadano.apellido}
                    </td>
                    <td className="py-2.5 px-2 text-muted max-w-[160px] truncate">
                      {r.prestadora?.razonSocial ?? "—"}
                    </td>
                    <td className="py-2.5 px-2">
                      <EstadoBadge estado={r.estado} size="sm" />
                    </td>
                    <td className="py-2.5 px-2">
                      <NovedadesBadge tipos={r.eventos.map((e) => e.tipo)} />
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

// Íconos de las novedades del vecino sin leer por el Ente, agrupados por
// tipo de evento (ver `leidoEnte` en ReclamoEvento).
function NovedadesBadge({ tipos }: { tipos: string[] }) {
  if (tipos.length === 0) return <span className="text-muted text-xs">—</span>;
  const tieneChat = tipos.includes("COMENTARIO");
  const tieneAdjunto = tipos.includes("ADJUNTO");
  const tieneOtro = tipos.some(
    (t) => t !== "COMENTARIO" && t !== "ADJUNTO",
  );
  return (
    <div className="flex items-center gap-1">
      {tieneChat && (
        <span
          title="Chat sin leer del vecino"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-svc-red/15 text-svc-red text-[11px] font-bold"
        >
          💬
        </span>
      )}
      {tieneAdjunto && (
        <span
          title="Documentación agregada sin ver"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-svc-orange/15 text-svc-orange text-[11px] font-bold"
        >
          📎
        </span>
      )}
      {tieneOtro && (
        <span
          title="Otra novedad del vecino (avisó que se solucionó, pidió algo, etc.)"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-svc-blue/15 text-svc-blue text-[11px] font-bold"
        >
          🔔
        </span>
      )}
    </div>
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
