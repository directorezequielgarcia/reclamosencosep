import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ESTADO_META,
  ROLES_EDIT,
  TRANSICIONES,
  whereReclamosByRol,
} from "@/lib/admin";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { Galeria } from "@/components/ui/Galeria";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { MiniMapa } from "@/components/mapa/MiniMapa";
import { svcFromKind } from "@/lib/servicios";
import { EXPEDIENTE_ESTADO_META } from "@/lib/expedientes";
import {
  agregarComentario,
  cambiarEstado,
  elevarAExpediente,
  reasignarPrestadora,
} from "./actions";

export const metadata = { title: "Reclamo · Panel ENCOSEP" };

export default async function ReclamoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const baseWhere = whereReclamosByRol(
    session!.user.rol,
    session!.user.prestadoraId,
  );

  const reclamo = await prisma.reclamo.findFirst({
    where: { id, ...baseWhere },
    include: {
      servicio: true,
      prestadora: true,
      ciudadano: true,
      adjuntos: true,
      expediente: true,
      eventos: {
        orderBy: { createdAt: "asc" },
        include: { autor: true },
      },
    },
  });
  if (!reclamo) notFound();

  const svc = svcFromKind(reclamo.servicio.kind);
  const transiciones = TRANSICIONES[reclamo.estado];
  const puedeEditar = ROLES_EDIT.includes(session!.user.rol);
  const puedeReasignar =
    session!.user.rol === "GESTOR_ENTE" ||
    session!.user.rol === "SUPER_ADMIN";
  const puedeElevar =
    (session!.user.rol === "GESTOR_ENTE" ||
      session!.user.rol === "SUPER_ADMIN") &&
    !reclamo.expedienteId &&
    reclamo.prestadoraId !== null;

  const prestadoras = puedeReasignar
    ? await prisma.prestadora.findMany({
        where: {
          activa: true,
          servicios: { some: { id: reclamo.servicioId } },
        },
        orderBy: { razonSocial: "asc" },
      })
    : [];

  const fotos = reclamo.adjuntos.filter((a) => a.tipo === "FOTO");
  const fechaLarga = reclamo.createdAt.toLocaleString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumbs
        items={[
          { label: "Panel", href: "/admin" },
          { label: "Bandeja", href: "/admin/bandeja" },
          { label: `Reclamo #${reclamo.codigo}` },
        ]}
      />

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <SvcIcon kind={svc} size={64} />
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-navy font-mono">
                #{reclamo.codigo}
              </h1>
              <EstadoBadge estado={reclamo.estado} />
              {reclamo.expediente && (
                <Link
                  href={`/admin/expediente/${reclamo.expediente.id}`}
                  className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-svc-orange text-svc-orange hover:bg-svc-orange/10"
                >
                  {reclamo.expediente.numero}
                </Link>
              )}
            </div>
            <div className="text-base text-navy font-semibold mt-1">
              {reclamo.titulo}
            </div>
            <div className="text-xs text-muted mt-0.5">
              {reclamo.servicio.nombre} · {fechaLarga}
            </div>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="flex flex-col gap-5">
          <Card titulo="Descripción">
            <p className="text-navy text-sm leading-relaxed whitespace-pre-wrap">
              {reclamo.descripcion}
            </p>
          </Card>

          {fotos.length > 0 && (
            <Card titulo={`Fotos · ${fotos.length}`}>
              <Galeria
                fotos={fotos.map((f) => ({
                  id: f.id,
                  url: f.url,
                  descripcion: null,
                }))}
                titulo={`Reclamo ${reclamo.codigo}`}
              />
            </Card>
          )}

          <Card titulo="Ubicación">
            <div className="text-sm text-navy">
              {reclamo.direccion}
              {reclamo.barrio && (
                <span className="text-muted"> · {reclamo.barrio}</span>
              )}
            </div>
            {reclamo.lat !== null && reclamo.lng !== null && (
              <>
                <div className="text-xs text-muted mt-1 font-mono">
                  {reclamo.lat.toFixed(5)}, {reclamo.lng.toFixed(5)}
                </div>
                <div className="mt-3">
                  <MiniMapa lat={reclamo.lat} lng={reclamo.lng} alto={220} />
                </div>
              </>
            )}
          </Card>

          <Card titulo="Vecino que reclamó">
            <div className="text-sm text-navy">
              {reclamo.ciudadano.nombre} {reclamo.ciudadano.apellido}
            </div>
            <div className="text-xs text-muted mt-0.5">
              DNI {reclamo.ciudadano.dni}
              {reclamo.ciudadano.email && ` · ${reclamo.ciudadano.email}`}
              {reclamo.ciudadano.telefono && ` · ${reclamo.ciudadano.telefono}`}
            </div>
          </Card>

          <Card
            titulo={`Historial · ${reclamo.eventos.length} evento${reclamo.eventos.length === 1 ? "" : "s"}`}
          >
            <ol className="flex flex-col gap-3">
              {reclamo.eventos.map((ev) => (
                <li key={ev.id} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-navy-2 mt-2 shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs text-muted">
                      <span className="font-semibold text-navy">
                        {ev.autor
                          ? `${ev.autor.nombre} ${ev.autor.apellido}`
                          : "Sistema"}
                      </span>
                      {" · "}
                      {ev.createdAt.toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-sm text-navy mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>
                        {tipoEventoLabel(ev.tipo)}
                        {ev.estadoNuevo
                          ? ` → ${ESTADO_META[ev.estadoNuevo].label}`
                          : ""}
                      </span>
                      {ev.tipo === "COMENTARIO" && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            ev.visibleVecino
                              ? "bg-svc-green/15 text-svc-green"
                              : "bg-paper-3 text-muted"
                          }`}
                        >
                          {ev.visibleVecino ? "Visible al vecino" : "Interno"}
                        </span>
                      )}
                    </div>
                    {ev.mensaje && (
                      <div className="text-sm text-navy bg-paper-2 rounded-lg p-2 mt-1.5 whitespace-pre-wrap">
                        {ev.mensaje}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            {puedeEditar && (
              <form
                action={agregarComentario}
                className="mt-4 pt-4 border-t border-line flex flex-col gap-2"
              >
                <input type="hidden" name="reclamoId" value={reclamo.id} />
                <textarea
                  name="mensaje"
                  required
                  rows={2}
                  placeholder="Nota interna o respuesta al vecino…"
                  className="w-full px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm focus:outline-none focus:border-navy-2 resize-none"
                />
                <label className="flex items-start gap-2 text-xs text-navy">
                  <input
                    type="checkbox"
                    name="visibleVecino"
                    className="mt-0.5 w-4 h-4 shrink-0"
                  />
                  <span>
                    <strong>Visible para el vecino</strong> — lo verá en su
                    reclamo. Si no lo tildás, queda como <strong>nota interna</strong>.
                  </span>
                </label>
                <div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-navy-2 text-white text-sm font-semibold"
                  >
                    Agregar comentario
                  </button>
                </div>
              </form>
            )}
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <Card titulo="Prestadora">
            <div className="text-sm text-navy font-semibold">
              {reclamo.prestadora?.razonSocial ?? "Sin asignar"}
            </div>
            {reclamo.prestadora?.cuit && (
              <div className="text-xs text-muted mt-0.5">
                CUIT {reclamo.prestadora.cuit}
              </div>
            )}

            {puedeReasignar && prestadoras.length > 1 && (
              <form
                action={reasignarPrestadora}
                className="mt-3 flex flex-col gap-2"
              >
                <input type="hidden" name="reclamoId" value={reclamo.id} />
                <label className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                  Reasignar
                </label>
                <select
                  name="prestadoraId"
                  defaultValue={reclamo.prestadoraId ?? ""}
                  className="px-2 py-1.5 rounded-lg border border-line-strong text-sm bg-paper"
                >
                  {prestadoras.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.razonSocial}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg border border-line-strong text-xs font-semibold text-navy hover:bg-paper-2"
                >
                  Confirmar reasignación
                </button>
              </form>
            )}
          </Card>

          {reclamo.expediente && (
            <Card titulo="Expediente">
              <Link
                href={`/admin/expediente/${reclamo.expediente.id}`}
                className="block"
              >
                <div className="text-base font-bold text-svc-orange font-mono">
                  {reclamo.expediente.numero}
                </div>
                <div className="text-xs text-navy mt-0.5">
                  {reclamo.expediente.caratula}
                </div>
                <div className="text-[11px] mt-1 font-semibold">
                  {EXPEDIENTE_ESTADO_META[reclamo.expediente.estado].label}
                </div>
              </Link>
            </Card>
          )}

          {puedeElevar && (
            <Card titulo="Elevar a expediente">
              <form action={elevarAExpediente} className="flex flex-col gap-2">
                <input type="hidden" name="reclamoId" value={reclamo.id} />
                <p className="text-xs text-muted leading-relaxed">
                  Abrí un expediente administrativo contra{" "}
                  <strong className="text-navy">
                    {reclamo.prestadora?.razonSocial}
                  </strong>{" "}
                  con este reclamo como antecedente.
                </p>
                <label className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                  Asunto
                </label>
                <input
                  name="asunto"
                  required
                  defaultValue={`Reclamo por ${reclamo.servicio.nombreCorto.toLowerCase()} — ${reclamo.titulo}`}
                  className="px-2 py-1.5 rounded-lg border border-line-strong text-sm bg-paper"
                />
                <label className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                  Carátula{" "}
                  <span className="text-muted font-normal">(opcional)</span>
                </label>
                <input
                  name="caratula"
                  placeholder={`ENCOSEP c/ ${reclamo.prestadora?.razonSocial} s/ ${reclamo.servicio.nombreCorto}`}
                  className="px-2 py-1.5 rounded-lg border border-line-strong text-sm bg-paper"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-svc-orange text-white text-sm font-bold mt-1"
                >
                  📁 Abrir expediente
                </button>
              </form>
            </Card>
          )}

          <Card titulo="SLA">
            <div className="text-sm text-navy">
              Plazo: <span className="font-semibold">{reclamo.slaHoras}h</span>
            </div>
            {reclamo.slaDeadline && (
              <div className="text-xs text-muted mt-0.5">
                Vence:{" "}
                {reclamo.slaDeadline.toLocaleString("es-AR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
            {reclamo.cerradoEn && (
              <div className="text-xs text-svc-green font-semibold mt-1">
                Cerrado el{" "}
                {reclamo.cerradoEn.toLocaleString("es-AR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            )}
          </Card>

          {puedeEditar && transiciones.length > 0 && (
            <Card titulo="Cambiar estado">
              <form action={cambiarEstado} className="flex flex-col gap-2">
                <input type="hidden" name="reclamoId" value={reclamo.id} />
                <select
                  name="estado"
                  required
                  defaultValue=""
                  className="px-2 py-1.5 rounded-lg border border-line-strong text-sm bg-paper"
                >
                  <option value="" disabled>
                    Seleccionar nuevo estado…
                  </option>
                  {transiciones.map((e) => (
                    <option key={e} value={e}>
                      {ESTADO_META[e].label}
                    </option>
                  ))}
                </select>
                <textarea
                  name="mensaje"
                  rows={2}
                  placeholder="Motivo o nota (opcional)…"
                  className="px-2 py-1.5 rounded-lg border border-line-strong text-sm bg-paper resize-none"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-svc-red text-white text-sm font-semibold"
                >
                  Aplicar cambio
                </button>
              </form>
            </Card>
          )}

          {puedeEditar && transiciones.length === 0 && (
            <Card titulo="Cambiar estado">
              <div className="text-xs text-muted">
                Este reclamo está cerrado. No hay transiciones disponibles.
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function tipoEventoLabel(tipo: string): string {
  switch (tipo) {
    case "CREACION":
      return "Reclamo registrado";
    case "CAMBIO_ESTADO":
      return "Cambio de estado";
    case "ASIGNACION":
      return "Asignación";
    case "COMENTARIO":
      return "Comentario";
    case "ADJUNTO":
      return "Adjunto agregado";
    case "NOTIFICACION":
      return "Notificación";
    default:
      return tipo;
  }
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
