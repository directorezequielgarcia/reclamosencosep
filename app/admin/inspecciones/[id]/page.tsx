import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeGestionarInspecciones, TONE_CLASS } from "@/lib/admin";
import {
  ESTADO_INSPECCION_META,
  TIPO_INSPECCION_META,
} from "@/lib/inspecciones";
import {
  actualizarInspeccion,
  cambiarEstadoInspeccion,
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
  if (!session || !puedeGestionarInspecciones(session.user.rol)) {
    redirect("/admin");
  }

  const { id } = await params;
  const insp = await prisma.inspeccion.findUnique({
    where: { id },
    include: {
      servicio: true,
      prestadora: true,
      inspector: true,
      expediente: true,
      fotos: { orderBy: { orden: "asc" } },
    },
  });
  if (!insp) notFound();

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

  const editable = insp.estado !== "ARCHIVADA";

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
                className={`px-3 py-2 rounded-lg text-sm font-bold ${
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
          {editable ? (
            <form
              action={actualizarInspeccion}
              className="rounded-2xl border border-line bg-paper p-5 flex flex-col gap-4"
            >
              <input type="hidden" name="inspeccionId" value={insp.id} />
              <h2 className="text-[11px] font-bold text-muted uppercase tracking-wider">
                Edición
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

              <Field label="Observaciones">
                <textarea
                  name="observaciones"
                  defaultValue={insp.observaciones}
                  rows={10}
                  required
                  minLength={10}
                  maxLength={20000}
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

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Latitud">
                  <input
                    type="text"
                    name="lat"
                    defaultValue={insp.lat?.toString() ?? ""}
                    inputMode="decimal"
                    className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy font-mono"
                  />
                </Field>
                <Field label="Longitud">
                  <input
                    type="text"
                    name="lng"
                    defaultValue={insp.lng?.toString() ?? ""}
                    inputMode="decimal"
                    className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy font-mono"
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

          {editable && (
            <CapturaCampo
              inspeccionId={insp.id}
              audioInicialUrl={insp.audioUrl}
              latInicial={insp.lat}
              lngInicial={insp.lng}
            />
          )}

          {insp.fotos.length > 0 && (
            <Card titulo={`Fotos (${insp.fotos.length})`}>
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

          {insp.audioUrl && (
            <Card titulo="Audio dictado en campo">
              <audio controls src={insp.audioUrl} className="w-full">
                Tu navegador no soporta audio HTML5.
              </audio>
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
                  "Solo vos la ves. Publicala para que cuente en informes."}
                {insp.estado === "PUBLICADA" &&
                  "Visible para todo el equipo. Alimenta informes."}
                {insp.estado === "ARCHIVADA" &&
                  "Solo consulta histórica. No editable."}
              </span>
            </div>
          </Card>

          <Card titulo="Vínculos">
            <ul className="text-sm text-navy space-y-1">
              {insp.expediente ? (
                <li>
                  Expediente:{" "}
                  <Link
                    href={`/admin/expediente/${insp.expediente.id}`}
                    className="text-navy-2 underline"
                  >
                    {insp.expediente.numero}
                  </Link>
                </li>
              ) : (
                <li className="text-muted">Sin expediente vinculado.</li>
              )}
            </ul>
          </Card>

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
