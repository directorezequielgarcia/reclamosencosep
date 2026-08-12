import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeGestionarReclamos, whereReclamosByRol } from "@/lib/admin";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { SVC_META, SVC_ORDER, svcFromKind } from "@/lib/servicios";
import { marcarLeido } from "./actions";
import type { Prisma, ServicioKind } from "@prisma/client";

export const metadata = { title: "Mesa de trabajo · Panel ENCOSEP" };

type SP = { svc?: string };

type TarjetaData = {
  id: string;
  codigo: string;
  titulo: string;
  createdAt: Date;
  servicio: { kind: ServicioKind };
  ciudadano: { nombre: string; apellido: string };
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
          reclamo pasa de columna solo, según su estado real — no hay que
          moverlo a mano. Combinalo con el filtro por servicio de abajo.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <ChipServicio
          href="/admin/mesa-de-trabajo"
          activo={!sp.svc}
          label="Todos los servicios"
        />
        {SVC_ORDER.map((k) => (
          <ChipServicio
            key={k}
            href={`/admin/mesa-de-trabajo?svc=${k}`}
            activo={sp.svc === k}
            label={SVC_META[k].short}
          />
        ))}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {columnas.map((col) => (
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
                    href={`/admin/bandeja?${col.bandejaParams}${sp.svc ? `&svc=${sp.svc}` : ""}`}
                    className="underline"
                  >
                    ver todos en la Bandeja
                  </Link>
                  )
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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
      </Link>
      {mostrarMarcarLeido && (
        <form action={marcarLeido}>
          <input type="hidden" name="reclamoId" value={reclamo.id} />
          <SubmitButton
            className="w-full text-[11px] font-semibold px-2 py-1 rounded-md border border-line-strong text-navy hover:bg-paper-2"
            pendingText="Marcando…"
          >
            ✓ Marcar como leído
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
