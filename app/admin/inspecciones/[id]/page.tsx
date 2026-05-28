import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  puedeGestionarInspecciones,
  puedeVerInspecciones,
  TONE_CLASS,
} from "@/lib/admin";
import {
  ESTADO_INSPECCION_META,
  TIPO_INSPECCION_META,
  whereInspeccionesByRol,
} from "@/lib/inspecciones";
import {
  actualizarInspeccion,
  cambiarEstadoInspeccion,
  crearReclamoOficio,
  vincularExpediente,
} from "../actions";
import { CapturaCampo } from "@/components/inspecciones/CapturaCampo";
import type { EstadoInspeccion } from "@prisma/client";

export const metadata = { title: "Inspección · Panel ENCOSEP" };

export default async function InspeccionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || !puedeVerInspecciones(session.user.rol)) {
    redirect("/admin");
  }

  const { id } = await params;
  const visibilidadWhere = whereInspeccionesByRol(
    session.user.rol,
    session.user.id,
  );
  // findFirst con el WHERE de visibilidad: si el rol no la puede ver, queda
  // null y devuelve 404 (igual que si no existiera).
  const insp = await prisma.inspeccion.findFirst({
    where: { AND: [{ id }, visibilidadWhere] },
    include: {
      servicio: true,
      prestadora: true,
      inspector: true,
      expediente: true,
      fotos: { orderBy: { orden: "asc" } },
      reclamos: { select: { id: true, codigo: true, titulo: true, estado: true } },
      reclamosOriginados: {
        select: { id: true, codigo: true, titulo: true, estado: true },
      },
    },
  });
  if (!insp) notFound();

  // El usuario solo puede EDITAR si tiene rol de gestión y la inspección
  // no está archivada. Los roles "solo lectura" (EXPEDIENTES, AUDITOR) ven
  // los datos pero no pueden tocar.
  const puedeEditar =
    puedeGestionarInspecciones(session.user.rol) && insp.estado !== "ARCHIVADA";

  const estadoMeta = ESTADO_INSPECCION_META[insp.estado];
  const tipoMeta = TIPO_INSPECCION_META[insp.tipo];
  const fecha = insp.fecha.toLocaleString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Acciones disponibles según el estado actual
  const transicionesPosibles: EstadoInspeccion[] =
    insp.estado === "BORRADOR"
      ? ["PUBLICADA"]
      : insp.estado === "PUBLICADA"
        ? ["ARCHIVADA"]
        : [];

  const editable = puedeEditar;

  // Listado de expedientes vinculables: filtramos por la misma prestadora
  // si la inspección la tiene cargada; sino mostramos todos los activos.
  const expedientesVinculables = await prisma.expediente.findMany({
    where: {
      ...(insp.prestadoraId ? { prestadoraId: insp.prestadoraId } : {}),
      estado: { in: ["ABIERTO", "EN_TRAMITE"] },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, numero: true, caratula: true, estado: true },
  });

  const totalReclamosVinculados =
    insp.reclamos.length + insp.reclamosOriginados.length;
  const tieneVinculo = !!insp.expedienteId || totalReclamosVinculados > 0;

  return (
    <div className="flex flex-col gap-5">
      <nav className="text-xs text-muted">
        <Link href="/admin/inspecciones" className="hover:underline">
          ← Inspecciones
        </Link>
      </nav>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold text-navy">
              <span className="font-mono">{insp.codigo}</span>
              <span className="text-muted font-sans font-normal mx-2">·</span>
              {insp.titulo}
            </h1>
            <span
              className={`inline-flex items-center uppercase tracking-wider font-bold rounded-full border text-xs px-2.5 py-1 ${TONE_CLASS[estadoMeta.tone]}`}
            >
              {estadoMeta.label}
            </span>
          </div>
          <div className="text-sm text-muted mt-1">
            {insp.servicio.nombre} · {tipoMeta.label} · {fecha} · Inspector:{" "}
            {insp.inspector.nombre} {insp.inspector.apellido}
            {insp.prestadora && (
              <>
                {" · "}
                Prestadora: {insp.prestadora.razonSocial}
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {transicionesPosibles.map((e) => (
            <form key={e} action={cambiarEstadoInspeccion}>
              <input type="hidden" name="inspeccionId" value={insp.id} />
              <input type="hidden" name="estado" value={e} />
              <button
                type="submit"
                disabled={e === "PUBLICADA" && !tieneVinculo}
                title={
                  e === "PUBLICADA" && !tieneVinculo
                    ? "Para publicar, primero vinculá a un expediente o generá un reclamo de oficio"
                    : undefined
                }
                className={`px-3 py-2 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed ${
                  e === "PUBLICADA"
                    ? "bg-svc-green text-white"
                    : "bg-paper-3 text-navy border border-line-strong"
                }`}
              >
                {e === "PUBLICADA" ? "Publicar" : "Archivar"}
              </button>
            </form>
          ))}
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="flex flex-col gap-5">
          {/* Captura de campo PRIMERO — es lo que se usa en obra */}
          {editable && (
            <CapturaCampo
              inspeccionId={insp.id}
              audioInicialUrl={insp.audioUrl}
              latInicial={insp.lat}
              lngInicial={insp.lng}
            />
          )}

          {/* Fotos ya cargadas */}
          {insp.fotos.length > 0 && (
            <Card titulo={`Fotos cargadas (${insp.fotos.length})`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {insp.fotos.map((f) => (
                  <a
                    key={f.id}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg overflow-hidden border border-line"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.url}
                      alt={f.descripcion ?? "Foto de inspección"}
                      className="w-full h-32 object-cover"
                    />
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Audio ya cargado */}
          {insp.audioUrl && (
            <Card titulo="Audio dictado en campo">
              <audio controls src={insp.audioUrl} className="w-full">
                Tu navegador no soporta audio HTML5.
              </audio>
            </Card>
          )}

          {/* Vinculación: a expediente o crear reclamo de oficio */}
          {editable && (
            <Card titulo="Vinculación administrativa">
              <p className="text-xs text-muted mb-3">
                Las inspecciones no se publican al equipo en general: se asocian
                a un <strong className="text-navy">expediente</strong> o a un{" "}
                <strong className="text-navy">reclamo</strong>. Quienes tienen
                acceso a ese contenedor ven la inspección. Si todavía no hay
                expediente, podés generar un{" "}
                <strong className="text-navy">reclamo de oficio</strong> que
                llega a la bandeja para que el gestor de expedientes decida si
                escala.
              </p>

              <form
                action={vincularExpediente}
                className="flex flex-col gap-2 mb-4"
              >
                <input type="hidden" name="inspeccionId" value={insp.id} />
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">
                    Vincular a expediente existente
                  </span>
                  <select
                    name="expedienteId"
                    defaultValue={insp.expedienteId ?? ""}
                    className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
                  >
                    <option value="">— Sin expediente vinculado —</option>
                    {expedientesVinculables.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.numero} — {e.caratula} ({e.estado})
                      </option>
                    ))}
                  </select>
                </label>
                <div>
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg bg-navy text-white text-xs font-bold"
                  >
                    Guardar vinculación
                  </button>
                </div>
              </form>

              <div className="rounded-xl border border-line-strong bg-paper-2 p-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-xs text-navy">
                  <strong>¿Todavía no hay expediente?</strong> Generá un reclamo
                  de oficio (origen: ENCOSEP) y se carga a la bandeja para que
                  el gestor de expedientes evalúe.
                </div>
                <form action={crearReclamoOficio}>
                  <input type="hidden" name="inspeccionId" value={insp.id} />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg bg-svc-red text-white text-xs font-bold"
                  >
                    + Generar reclamo de oficio
                  </button>
                </form>
              </div>

              {(insp.reclamos.length > 0 ||
                insp.reclamosOriginados.length > 0) && (
                <div className="mt-4">
                  <div className="text-[11px] uppercase tracking-wider text-muted font-semibold mb-2">
                    Reclamos asociados
                  </div>
                  <ul className="text-sm text-navy space-y-1">
                    {insp.reclamosOriginados.map((r) => (
                      <li key={r.id} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-svc-red/15 text-svc-red border border-svc-red/30 rounded-full px-2 py-0.5 uppercase tracking-wider">
                          Oficio
                        </span>
                        <Link
                          href={`/admin/reclamo/${r.id}`}
                          className="font-mono font-bold hover:underline"
                        >
                          {r.codigo}
                        </Link>
                        <span className="text-muted truncate">{r.titulo}</span>
                        <span className="text-[10px] text-muted">
                          ({r.estado})
                        </span>
                      </li>
                    ))}
                    {insp.reclamos
                      .filter(
                        (r) =>
                          !insp.reclamosOriginados.find((o) => o.id === r.id),
                      )
                      .map((r) => (
                        <li key={r.id} className="flex items-center gap-2">
                          <Link
                            href={`/admin/reclamo/${r.id}`}
                            className="font-mono font-bold hover:underline"
                          >
                            {r.codigo}
                          </Link>
                          <span className="text-muted truncate">{r.titulo}</span>
                          <span className="text-[10px] text-muted">
                            ({r.estado})
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {/* Edición textual */}
          {editable ? (
            <form
              action={actualizarInspeccion}
              className="rounded-2xl border border-line bg-paper p-5 flex flex-col gap-4"
            >
              <input type="hidden" name="inspeccionId" value={insp.id} />
              <h2 className="text-[11px] font-bold text-muted uppercase tracking-wider">
                Edición textual
              </h2>

              <Field label="Título">
                <input
                  type="text"
                  name="titulo"
                  defaultValue={insp.titulo}
                  required
                  maxLength={200}
                  className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
                />
              </Field>

              <Field label="Observaciones (opcional)">
                <textarea
                  name="observaciones"
                  defaultValue={insp.observaciones}
                  rows={10}
                  maxLength={20000}
                  placeholder="Texto del relevamiento. Podés dejarlo vacío si la información está cargada como audio o fotos."
                  className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy resize-y"
                />
              </Field>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Dirección">
                  <input
                    type="text"
                    name="direccion"
                    defaultValue={insp.direccion ?? ""}
                    maxLength={200}
                    className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
                  />
                </Field>
                <Field label="Barrio">
                  <input
                    type="text"
                    name="barrio"
                    defaultValue={insp.barrio ?? ""}
                    maxLength={120}
                    className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
                  />
                </Field>
              </div>

              <Field label="Transcripción del audio (próximamente automática)">
                <textarea
                  name="transcripcionAudio"
                  defaultValue={insp.transcripcionAudio ?? ""}
                  rows={6}
                  maxLength={40000}
                  placeholder="Texto de lo dictado en campo. Por ahora se carga a mano."
                  className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy resize-y"
                />
              </Field>

              <div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-navy text-white font-bold text-sm hover:opacity-90"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          ) : (
            <Card titulo="Observaciones">
              <p className="text-sm text-navy whitespace-pre-wrap leading-relaxed">
                {insp.observaciones}
              </p>
            </Card>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <Card titulo="Estado">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center uppercase tracking-wider font-bold rounded-full border text-xs px-2.5 py-1 ${TONE_CLASS[estadoMeta.tone]}`}
              >
                {estadoMeta.label}
              </span>
              <span className="text-xs text-muted">
                {insp.estado === "BORRADOR" &&
                  (tieneVinculo
                    ? "Vínculo cargado. Ya podés publicar."
                    : "Falta vinculacionn con expediente o reclamo para poder publicar.")}
                {insp.estado === "PUBLICADA" &&
                  "Visible para quienes tienen acceso al expediente o reclamo vinculado."}
                {insp.estado === "ARCHIVADA" &&
                  "Solo consulta histórica. No editable."}
              </span>
            </div>
          </Card>

          {insp.expediente && (
            <Card titulo="Expediente vinculado">
              <div className="text-sm text-navy font-bold">
                <Link
                  href={`/admin/expediente/${insp.expediente.id}`}
                  className="hover:underline text-navy-2"
                >
                  {insp.expediente.numero}
                </Link>
              </div>
              <div className="text-xs text-muted mt-1">
                {insp.expediente.caratula}
              </div>
            </Card>
          )}

          {(insp.lat != null || insp.lng != null) && (
            <Card titulo="Coordenadas">
              <div className="text-sm text-navy font-mono">
                {insp.lat?.toFixed(5)}, {insp.lng?.toFixed(5)}
              </div>
              {insp.lat != null && insp.lng != null && (
                <a
                  href={`https://www.google.com/maps?q=${insp.lat},${insp.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-navy-2 underline mt-2 inline-block"
                >
                  Abrir en Google Maps
                </a>
              )}
            </Card>
          )}

          <Card titulo="Carga">
            <div className="text-xs text-muted">
              Creada{" "}
              {insp.createdAt.toLocaleString("es-AR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {insp.updatedAt.getTime() !== insp.createdAt.getTime() && (
                <>
                  <br />
                  Modificada{" "}
                  {insp.updatedAt.toLocaleString("es-AR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </>
              )}
            </div>
          </Card>

          <Card titulo="Acta de inspección">
            <p className="text-xs text-muted mb-3">
              Descarga el .docx formal con encabezado del Ente, datos del
              relevamiento, observaciones, transcripción del audio y línea de
              firma para el inspector.
            </p>
            <a
              href={`/api/inspecciones/${insp.id}/acta`}
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-navy text-white text-sm font-bold hover:opacity-90"
            >
              📄 Descargar acta (.docx)
            </a>
            {insp.actaGeneradaEn && (
              <div className="text-[10px] text-muted mt-2 text-center">
                Última generación:{" "}
                {insp.actaGeneradaEn.toLocaleString("es-AR", {
                  day: "2-digit",
                  month: "short",
                  year: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
          </Card>
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </span>
      {children}
    </label>
  );
}
