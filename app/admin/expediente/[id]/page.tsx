import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EXPEDIENTE_ESTADO_META } from "@/lib/expedientes";
import { TONE_CLASS } from "@/lib/admin";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { svcFromKind } from "@/lib/servicios";
import { cambiarEstadoExpediente } from "./actions";
import { Workspace, type ActoView } from "./Workspace";

export const metadata = { title: "Expediente · Panel ENCOSEP" };

// Actos que se comunican a las partes (no notas internas, caratulación ni
// el descargo de la propia prestadora).
const ACTOS_NOTIFICABLES = [
  "ACTA_RECEPCION",
  "NOTIFICACION",
  "INTIMACION",
  "CONSTATACION",
  "AMPLIACION",
  "DISPOSICION",
  "RESOLUCION",
  "CIERRE",
];

function fmt(d: Date): string {
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ExpedienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const where: { id: string; prestadoraId?: string } = { id };
  if (session!.user.rol === "OPERADOR_PRESTADORA") {
    where.prestadoraId = session!.user.prestadoraId ?? "__none__";
  }

  const exp = await prisma.expediente.findFirst({
    where,
    include: {
      prestadora: true,
      iniciador: true,
      reclamos: { include: { servicio: true, ciudadano: true } },
      actos: {
        include: { autor: true, adjuntos: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!exp) notFound();

  const esEnte =
    session!.user.rol === "GESTOR_ENTE" ||
    session!.user.rol === "SUPER_ADMIN";
  const esOperadorEstaPrestadora =
    session!.user.rol === "OPERADOR_PRESTADORA" &&
    session!.user.prestadoraId === exp.prestadoraId;

  const m = EXPEDIENTE_ESTADO_META[exp.estado];

  // Mapear actos a un shape serializable (fechas ya formateadas) para el cliente.
  const actos: ActoView[] = exp.actos.map((a) => ({
    id: a.id,
    tipo: a.tipo,
    titulo: a.titulo,
    cuerpo: a.cuerpo,
    fecha: fmt(a.createdAt),
    autor: `${a.autor.nombre} ${a.autor.apellido}`,
    notificadoTexto: a.notificadoEn
      ? `Notificado a ${a.notificadoA} · ${fmt(a.notificadoEn)}`
      : null,
    adjuntos: a.adjuntos.map((adj) => ({
      id: adj.id,
      tipo: adj.tipo,
      url: adj.url,
      nombre: adj.nombre,
    })),
  }));

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumbs
        items={[
          { label: "Panel", href: "/admin" },
          { label: "Expedientes", href: "/admin/expedientes" },
          { label: exp.numero },
        ]}
      />

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold text-svc-orange font-mono">
              {exp.numero}
            </h1>
            <span
              className={`inline-flex items-center gap-1 uppercase tracking-wider font-bold rounded-full border text-xs px-2.5 py-1 ${TONE_CLASS[m.tone]}`}
            >
              {m.label}
            </span>
          </div>
          <div className="text-base text-navy font-semibold mt-1">
            {exp.caratula}
          </div>
          <div className="text-sm text-muted mt-0.5">{exp.asunto}</div>
          <div className="text-xs text-muted mt-1">
            {exp.tipoExpediente} · Iniciador: {exp.iniciador.nombre}{" "}
            {exp.iniciador.apellido} ·{" "}
            {exp.createdAt.toLocaleString("es-AR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
      </header>

      {/* Vista de 3 zonas: crónica · mesa de trabajo · mensajería */}
      <Workspace
        expedienteId={exp.id}
        actos={actos}
        esEnte={esEnte}
        esOperadorEstaPrestadora={esOperadorEstaPrestadora}
        archivado={exp.estado === "ARCHIVADO"}
        notificables={ACTOS_NOTIFICABLES}
      />

      {/* Datos del expediente */}
      <div className="grid md:grid-cols-3 gap-4 items-start">
        <Card titulo="Prestadora controlada">
          <div className="text-sm font-semibold text-navy">
            {exp.prestadora.razonSocial}
          </div>
          {exp.prestadora.cuit && (
            <div className="text-xs text-muted mt-0.5">
              CUIT {exp.prestadora.cuit}
            </div>
          )}
        </Card>

        <Card titulo={`Reclamos asociados · ${exp.reclamos.length}`}>
          <ul className="flex flex-col gap-2">
            {exp.reclamos.map((r) => {
              const svc = svcFromKind(r.servicio.kind);
              return (
                <li key={r.id}>
                  <Link
                    href={`/admin/reclamo/${r.id}`}
                    className="flex items-start gap-2 p-2 rounded-lg border border-line hover:bg-paper-2"
                  >
                    <SvcIcon kind={svc} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-bold text-navy text-xs">
                        #{r.codigo}
                      </div>
                      <div className="text-xs text-navy truncate">
                        {r.titulo}
                      </div>
                      <div className="text-[10px] text-muted truncate mt-0.5">
                        {r.ciudadano.nombre} {r.ciudadano.apellido}
                      </div>
                    </div>
                    <EstadoBadge estado={r.estado} size="sm" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        {esEnte && (
          <Card titulo="Cambiar estado">
            <form
              action={cambiarEstadoExpediente}
              className="flex flex-col gap-2"
            >
              <input type="hidden" name="expedienteId" value={exp.id} />
              <select
                name="estado"
                required
                defaultValue={exp.estado}
                className="px-2 py-1.5 rounded-lg border border-line-strong text-sm bg-paper"
              >
                <option value="ABIERTO">Abierto</option>
                <option value="EN_TRAMITE">En trámite</option>
                <option value="RESUELTO">Resuelto</option>
                <option value="ARCHIVADO">Archivado</option>
              </select>
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-navy-2 text-white text-sm font-semibold"
              >
                Aplicar
              </button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}

function Card({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <h2 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
        {titulo}
      </h2>
      {children}
    </div>
  );
}
