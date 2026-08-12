import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROL_LABEL, whereReclamosByRol } from "@/lib/admin";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { svcFromKind } from "@/lib/servicios";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const metadata = { title: "Vecino · Panel ENCOSEP" };

export default async function FichaUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: { prestadora: true },
  });
  if (!usuario) notFound();

  const whereReclamos = whereReclamosByRol(
    session!.user.rol,
    session!.user.prestadoraId,
  );

  const reclamos = await prisma.reclamo.findMany({
    where: { ciudadanoId: usuario.id, ...whereReclamos },
    orderBy: { createdAt: "desc" },
    include: { servicio: true },
  });

  const fechaAlta = usuario.createdAt.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumbs
        items={[
          { label: "Panel", href: "/admin" },
          { label: "Usuarios", href: "/admin/usuarios" },
          { label: `${usuario.nombre} ${usuario.apellido}` },
        ]}
      />

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">
            {usuario.nombre} {usuario.apellido}
          </h1>
          <div className="text-xs text-muted mt-1">
            {ROL_LABEL[usuario.rol]}
            {usuario.prestadora && ` · ${usuario.prestadora.razonSocial}`}
            {" · registrado el "}
            {fechaAlta}
          </div>
        </div>
        {usuario.activo ? (
          <span className="text-[10px] uppercase tracking-wider font-bold text-svc-green px-2 py-1 rounded-full bg-svc-green/10">
            Activo
          </span>
        ) : (
          <span className="text-[10px] uppercase tracking-wider font-bold text-svc-red px-2 py-1 rounded-full bg-svc-red/10">
            Bloqueado
          </span>
        )}
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <DatoCard label="DNI" valor={usuario.dni} />
        <DatoCard label="Email" valor={usuario.email ?? "—"} />
        <DatoCard label="Teléfono" valor={usuario.telefono ?? "—"} />
        <DatoCard label="Reclamos" valor={String(reclamos.length)} />
      </div>

      <section className="rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3">
          Reclamos · {reclamos.length}
        </h2>
        {reclamos.length === 0 ? (
          <p className="text-sm text-muted italic">
            Todavía no presentó ningún reclamo.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {reclamos.map((r) => {
              const svc = svcFromKind(r.servicio.kind);
              const fecha = r.createdAt.toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              return (
                <li key={r.id}>
                  <Link
                    href={`/admin/reclamo/${r.id}`}
                    className="flex items-center gap-3 py-2.5 hover:bg-paper-2 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <SvcIcon kind={svc} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-bold text-navy text-sm">
                        #{r.codigo}
                      </div>
                      <div className="text-xs text-muted truncate">
                        {r.titulo}
                      </div>
                    </div>
                    <EstadoBadge estado={r.estado} size="sm" />
                    <span className="text-[11px] text-muted whitespace-nowrap">
                      {fecha}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function DatoCard({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-xl border border-line bg-paper p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </div>
      <div className="text-sm font-semibold text-navy mt-0.5 truncate">
        {valor}
      </div>
    </div>
  );
}
