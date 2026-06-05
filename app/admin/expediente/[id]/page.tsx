import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EXPEDIENTE_ESTADO_META, TIPO_ACTO_META } from "@/lib/expedientes";
import { TONE_CLASS } from "@/lib/admin";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { svcFromKind } from "@/lib/servicios";
import {
  agregarActo,
  cambiarEstadoExpediente,
  notificarActo,
} from "./actions";

// Actos que se comunican a la prestadora (no se notifican notas internas,
// la caratulación ni el descargo de la propia prestadora).
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

export const metadata = { title: "Expediente · Panel ENCOSEP" };

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
            Iniciador: {exp.iniciador.nombre} {exp.iniciador.apellido} ·{" "}
            {exp.createdAt.toLocaleString("es-AR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="flex flex-col gap-5">
          <Card titulo={`Cuerpo del expediente · ${exp.actos.length} acto${exp.actos.length === 1 ? "" : "s"}`}>
            <ol className="flex flex-col gap-4">
              {exp.actos.map((a, i) => {
                const ti = TIPO_ACTO_META[a.tipo];
                return (
                  <li
                    key={a.id}
                    className="border-l-2 border-svc-orange pl-4 relative"
                  >
                    <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-svc-orange" />
                    <div className="text-xs text-muted flex items-center gap-2">
                      <span className="font-semibold text-navy">
                        Acto #{i + 1}
                      </span>
                      <span>·</span>
                      <span>
                        {a.createdAt.toLocaleString("es-AR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span>·</span>
                      <span>
                        {a.autor.nombre} {a.autor.apellido}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg">{ti.icon}</span>
                      <span className="text-[11px] uppercase tracking-wider font-bold text-svc-orange">
                        {ti.label}
                      </span>
                    </div>
                    <div className="text-base font-bold text-navy mt-1">
                      {a.titulo}
                    </div>
                    <div className="text-sm text-navy mt-1 whitespace-pre-wrap leading-relaxed">
                      {a.cuerpo}
                    </div>
                    {ACTOS_NOTIFICABLES.includes(a.tipo) &&
                      (a.notificadoEn ? (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-svc-green">
                          <span>✓</span>
                          <span>
                            Notificado a {a.notificadoA} ·{" "}
                            {a.notificadoEn.toLocaleString("es-AR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ) : esEnte ? (
                        <form action={notificarActo} className="mt-2">
                          <input type="hidden" name="actoId" value={a.id} />
                          <button
                            type="submit"
                            className="text-xs px-3 py-1.5 rounded-lg border border-svc-blue text-svc-blue font-semibold hover:bg-svc-blue/10"
                          >
                            📨 Notificar a la prestadora
                          </button>
                        </form>
                      ) : (
                        <div className="mt-2 text-[11px] text-muted italic">
                          Sin notificar
                        </div>
                      ))}
                    {a.adjuntos.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {a.adjuntos.map((adj) => {
                          const icono =
                            adj.tipo === "FOTO"
                              ? "🖼️"
                              : adj.tipo === "VIDEO"
                                ? "🎬"
                                : adj.tipo === "AUDIO"
                                  ? "🔊"
                                  : "📎";
                          return (
                            <a
                              key={adj.id}
                              href={adj.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-line bg-paper-2 text-xs text-navy hover:bg-paper-3"
                            >
                              <span>{icono}</span>
                              <span className="max-w-[160px] truncate">
                                {adj.nombre ?? "Archivo"}
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </Card>

          {(esEnte || esOperadorEstaPrestadora) &&
            exp.estado !== "ARCHIVADO" && (
              <Card titulo="Labrar nuevo acto">
                <form
                  action={agregarActo}
                  encType="multipart/form-data"
                  className="flex flex-col gap-2"
                >
                  <input type="hidden" name="expedienteId" value={exp.id} />
                  <div className="grid grid-cols-1 gap-2">
                    <label className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                      Tipo de acto
                    </label>
                    <select
                      name="tipo"
                      required
                      defaultValue=""
                      className="px-2 py-2 rounded-lg border border-line-strong text-sm bg-paper"
                    >
                      <option value="" disabled>
                        Seleccionar…
                      </option>
                      {esEnte && (
                        <>
                          <option value="ACTA_RECEPCION">
                            📋 Acta de recepción
                          </option>
                          <option value="NOTIFICACION">
                            📨 Notificación
                          </option>
                          <option value="INTIMACION">⚖️ Intimación</option>
                          <option value="CONSTATACION">
                            🔎 Acta de constatación
                          </option>
                          <option value="AMPLIACION">➕ Ampliación</option>
                          <option value="DISPOSICION">
                            🖋️ Disposición (proveído)
                          </option>
                          <option value="RESOLUCION">📜 Resolución</option>
                          <option value="NOTA">📝 Nota interna</option>
                          <option value="CIERRE">🔒 Cierre</option>
                        </>
                      )}
                      {esOperadorEstaPrestadora && (
                        <option value="DESCARGO_PRESTADORA">
                          🛡️ Descargo de la prestadora
                        </option>
                      )}
                    </select>
                  </div>
                  <label className="text-[10px] uppercase tracking-wider text-muted font-semibold mt-2">
                    Título
                  </label>
                  <input
                    name="titulo"
                    required
                    placeholder="ej: Intímase a la prestadora a regularizar el servicio…"
                    className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
                  />
                  <label className="text-[10px] uppercase tracking-wider text-muted font-semibold mt-2">
                    Cuerpo del acto
                  </label>
                  <textarea
                    name="cuerpo"
                    required
                    rows={6}
                    placeholder="Visto el reclamo #… y considerando que… SE RESUELVE: …"
                    className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y"
                  />
                  <label className="text-[10px] uppercase tracking-wider text-muted font-semibold mt-2">
                    Documental (opcional)
                  </label>
                  <input
                    type="file"
                    name="archivos"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
                    className="text-xs text-navy file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-navy-2 file:text-white file:text-xs file:font-semibold"
                  />
                  <p className="text-[10px] text-muted">
                    Fotos, videos, audios o documentos (PDF/Word/Excel).
                  </p>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-lg bg-svc-orange text-white font-bold text-sm mt-2"
                  >
                    Labrar acto y agregar al expediente
                  </button>
                </form>
              </Card>
            )}
        </div>

        <aside className="flex flex-col gap-4">
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
        </aside>
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
