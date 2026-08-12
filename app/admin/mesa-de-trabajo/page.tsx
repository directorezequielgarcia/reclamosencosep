import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ESTADO_META,
  puedeGestionarReclamos,
  TRANSICIONES,
  whereReclamosByRol,
} from "@/lib/admin";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { SVC_META, SVC_ORDER, svcFromKind } from "@/lib/servicios";
import { cambiarEstado } from "../reclamo/[id]/actions";
import { marcarLeido } from "./actions";
import type { Prisma, ReclamoEstado, ServicioKind } from "@prisma/client";

export const metadata = { title: "Mesa de trabajo · Panel ENCOSEP" };

type SP = { svc?: string; q?: string };

type TarjetaData = {
  id: string;
  codigo: string;
  titulo: string;
  createdAt: Date;
  estado: ReclamoEstado;
  servicio: { kind: ServicioKind };
  ciudadano: { nombre: string; apellido: string };
  prestadora: { razonSocial: string } | null;
};

const COLUMNAS: {
  key: string;
  titulo: string;
  icono: string;
  where: (base: Prisma.ReclamoWhereInput) => Prisma.ReclamoWhereInput;
  orderBy: Prisma.ReclamoOrderByWithRelationInput;
  bandejaParams: string;
}[] = [
  {
    key: "recibidos",
    titulo: "Recibidos",
    icono: "📥",
    where: (base) => ({ ...base, estado: "RECIBIDO" }),
    orderBy: { createdAt: "asc" },
    bandejaParams: "estado=RECIBIDO",
  },
  {
    key: "pendientes",
    titulo: "Pendientes de lectura",
    icono: "🔔",
    where: (base) => ({ ...base, eventos: { some: { leidoEnte: false } } }),
    orderBy: { updatedAt: "asc" },
    bandejaParams: "pendiente=1",
  },
  {
    key: "revision",
    titulo: "En revisión",
    icono: "📋",
    where: (base) => ({ ...base, estado: "EN_REVISION" }),
    orderBy: { createdAt: "asc" },
    bandejaParams: "estado=EN_REVISION",
  },
  {
    key: "derivados",
    titulo: "Derivados",
    icono: "🔄",
    where: (base) => ({ ...base, estado: "DERIVADO" }),
    orderBy: { createdAt: "asc" },
    bandejaParams: "estado=DERIVADO",
  },
  {
    key: "proceso",
    titulo: "En proceso",
    icono: "⚙️",
    where: (base) => ({ ...base, estado: "EN_PROCESO" }),
    orderBy: { createdAt: "asc" },
    bandejaParams: "estado=EN_PROCESO",
  },
  {
    key: "resueltos",
    titulo: "Resueltos",
    icono: "✅",
    where: (base) => ({ ...base, estado: "RESUELTO" }),
    orderBy: { cerradoEn: "desc" },
    bandejaParams: "estado=RESUELTO",
  },
];

export default async function MesaDeTrabajoPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const session = await auth();
  if (!session || !puedeGestionarReclamos(session.user.rol)) {
    redirect("/admin");
  }

  const sp = await searchParams;
  const baseWhere: Prisma.ReclamoWhereInput = whereReclamosByRol(
    session.user.rol,
    session.user.prestadoraId,
  );
  if (sp.svc && sp.svc in SVC_META) {
    baseWhere.servicio = {
      kind: SVC_META[sp.svc as keyof typeof SVC_META].kind,
    };
  }
  const q = sp.q?.trim();
  if (q) {
    baseWhere.OR = [
      { codigo: { contains: q, mode: "insensitive" } },
      { titulo: { contains: q, mode: "insensitive" } },
      { ciudadano: { nombre: { contains: q, mode: "insensitive" } } },
      { ciudadano: { apellido: { contains: q, mode: "insensitive" } } },
    ];
  }

  const columnas = await Promise.all(
    COLUMNAS.map(async (col) => {
      const where = col.where(baseWhere);
      const [reclamos, total] = await Promise.all([
        prisma.reclamo.findMany({
          where,
          orderBy: col.orderBy,
          take: 30,
          include: {
            servicio: { select: { kind: true } },
            ciudadano: { select: { nombre: true, apellido: true } },
            prestadora: { select: { razonSocial: true } },
          },
        }),
        prisma.reclamo.count({ where }),
      ]);
      return { ...col, reclamos, total };
    }),
  );

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold text-navy">Mesa de trabajo</h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Los reclamos agrupados por lo que hace falta hacer con cada uno. Un
          reclamo pasa de columna solo, según su estado real — o movelo vos
          mismo con &quot;Mover a…&quot; en la tarjeta. Combinalo con el
          filtro por servicio y el buscador de abajo.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          <ChipServicio
            href={buildHref(undefined, q)}
            activo={!sp.svc}
            label="Todos los servicios"
          />
          {SVC_ORDER.map((k) => (
            <ChipServicio
              key={k}
              href={buildHref(k, q)}
              activo={sp.svc === k}
              label={SVC_META[k].short}
            />
          ))}
        </div>
        <form
          action="/admin/mesa-de-trabajo"
          className="flex items-center gap-2 ml-auto"
        >
          {sp.svc && <input type="hidden" name="svc" value={sp.svc} />}
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar código, título o vecino…"
            className="px-3 py-1.5 rounded-full text-xs border border-line-strong bg-paper focus:outline-none focus:border-navy-2 w-[220px]"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-navy text-white"
          >
            Buscar
          </button>
          {q && (
            <Link
              href={buildHref(sp.svc, undefined)}
              className="text-xs text-muted underline"
            >
              limpiar
            </Link>
          )}
        </form>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {columnas.map((col) => {
          const carpetas = agruparPorPrestadora(col.reclamos);
          const usarCarpetas = carpetas.size > 1;
          return (
            <div
              key={col.key}
              className="flex flex-col shrink-0 w-[300px] rounded-2xl border border-line bg-paper-2"
            >
              <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                <div className="text-sm font-bold text-navy">
                  {col.icono} {col.titulo}
                </div>
                <span className="text-xs font-bold text-muted bg-paper rounded-full px-2 py-0.5">
                  {col.total}
                </span>
              </div>
              <div className="flex flex-col gap-2 p-3 max-h-[70vh] overflow-y-auto">
                {col.reclamos.length === 0 ? (
                  <p className="text-xs text-muted italic px-1">
                    Sin reclamos acá.
                  </p>
                ) : usarCarpetas ? (
                  Array.from(carpetas.entries()).map(([nombre, reclamos]) => (
                    <details
                      key={nombre}
                      className="rounded-xl border border-line bg-paper"
                    >
                      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-bold text-navy flex items-center justify-between">
                        <span className="truncate">📁 {nombre}</span>
                        <span className="text-muted font-semibold ml-2 shrink-0">
                          {reclamos.length}
                        </span>
                      </summary>
                      <div className="flex flex-col gap-2 p-2 pt-0">
                        {reclamos.map((r) => (
                          <TarjetaReclamo
                            key={r.id}
                            reclamo={r}
                            mostrarMarcarLeido={col.key === "pendientes"}
                          />
                        ))}
                      </div>
                    </details>
                  ))
                ) : (
                  col.reclamos.map((r) => (
                    <TarjetaReclamo
                      key={r.id}
                      reclamo={r}
                      mostrarMarcarLeido={col.key === "pendientes"}
                    />
                  ))
                )}
                {col.total > col.reclamos.length && (
                  <p className="text-[11px] text-muted text-center pt-1">
                    y {col.total - col.reclamos.length} más… (
                    <Link
                      href={`/admin/bandeja?${col.bandejaParams}${sp.svc ? `&svc=${sp.svc}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                      className="underline"
                    >
                      ver todos en la Bandeja
                    </Link>
                    )
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildHref(svc: string | undefined, q: string | undefined) {
  const params = new URLSearchParams();
  if (svc) params.set("svc", svc);
  if (q) params.set("q", q);
  const qs = params.toString();
  return `/admin/mesa-de-trabajo${qs ? `?${qs}` : ""}`;
}

function agruparPorPrestadora(reclamos: TarjetaData[]) {
  const grupos = new Map<string, TarjetaData[]>();
  for (const r of reclamos) {
    const nombre = r.prestadora?.razonSocial ?? "Sin prestadora asignada";
    if (!grupos.has(nombre)) grupos.set(nombre, []);
    grupos.get(nombre)!.push(r);
  }
  return grupos;
}

function ChipServicio({
  href,
  activo,
  label,
}: {
  href: string;
  activo: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
        activo
          ? "bg-navy text-white border-navy"
          : "bg-paper text-navy border-line-strong hover:bg-paper-2"
      }`}
    >
      {label}
    </Link>
  );
}

function TarjetaReclamo({
  reclamo,
  mostrarMarcarLeido,
}: {
  reclamo: TarjetaData;
  mostrarMarcarLeido: boolean;
}) {
  const svc = svcFromKind(reclamo.servicio.kind);
  const fecha = reclamo.createdAt.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });
  const destinos = TRANSICIONES[reclamo.estado];
  return (
    <div className="rounded-xl border border-line bg-paper p-3 flex flex-col gap-1.5">
      <Link
        href={`/admin/reclamo/${reclamo.id}`}
        className="flex items-start gap-2"
      >
        <SvcIcon kind={svc} size={22} />
        <div className="flex-1 min-w-0">
          <div className="font-mono font-bold text-navy text-xs">
            #{reclamo.codigo}
          </div>
          <div className="text-xs text-navy truncate">{reclamo.titulo}</div>
          <div className="text-[10px] text-muted mt-0.5">
            {reclamo.ciudadano.nombre} {reclamo.ciudadano.apellido} · {fecha}
          </div>
        </div>
        <span className="text-[9px] uppercase tracking-wide font-bold text-muted bg-paper-3 rounded-full px-1.5 py-0.5 shrink-0">
          {ESTADO_META[reclamo.estado].label}
        </span>
      </Link>
      <div className="flex items-center gap-1.5">
        {mostrarMarcarLeido && (
          <form action={marcarLeido} className="flex-1">
            <input type="hidden" name="reclamoId" value={reclamo.id} />
            <SubmitButton
              className="w-full text-[11px] font-semibold px-2 py-1 rounded-md border border-line-strong text-navy hover:bg-paper-2"
              pendingText="Marcando…"
            >
              ✓ Marcar como leído
            </SubmitButton>
          </form>
        )}
        {destinos.length > 0 && (
          <details className="relative flex-1">
            <summary className="cursor-pointer list-none text-[11px] font-semibold px-2 py-1 rounded-md border border-line-strong text-navy hover:bg-paper-2 text-center">
              Mover a…
            </summary>
            <div className="absolute z-10 top-full right-0 mt-1 w-[180px] rounded-lg border border-line-strong bg-paper shadow-lg flex flex-col p-1 gap-0.5">
              {destinos.map((estado) => (
                <form key={estado} action={cambiarEstado}>
                  <input type="hidden" name="reclamoId" value={reclamo.id} />
                  <input type="hidden" name="estado" value={estado} />
                  <SubmitButton
                    className="w-full text-left text-[11px] px-2 py-1.5 rounded-md hover:bg-paper-2 text-navy"
                    pendingText="Moviendo…"
                  >
                    {ESTADO_META[estado].label}
                  </SubmitButton>
                </form>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
