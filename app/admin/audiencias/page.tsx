import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ESTADO_AUDIENCIA_META, MODALIDAD_META } from "@/lib/audiencias";
import { puedeGestionarAudienciasMedios, TONE_CLASS } from "@/lib/admin";
import { crearAudiencia } from "./actions";
import type { ModalidadAudiencia } from "@prisma/client";

export const metadata = { title: "Audiencias · Panel ENCOSEP" };

export default async function AudienciasAdminPage() {
  const session = await auth();
  if (!session || !puedeGestionarAudienciasMedios(session.user.rol)) {
    redirect("/admin");
  }

  const todas = await prisma.audienciaPublica.findMany({
    orderBy: { fecha: "desc" },
    include: { _count: { select: { inscripciones: true } } },
  });

  // Separamos en dos bloques: las que ya se realizaron y las pendientes
  // (programadas, abiertas a inscripción, cerradas a inscripción, canceladas).
  const realizadas = todas.filter((a) => a.estado === "REALIZADA");
  const proximas = todas.filter((a) => a.estado !== "REALIZADA");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold text-navy">Audiencias Públicas</h1>
        <p className="text-sm text-muted mt-1">
          Convocatorias del Ente con inscripción ciudadana en línea, material
          post-audiencia (video, transcripción taquigráfica) y dictamen del
          ENCOSEP.
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-base font-extrabold text-navy mb-3">Nueva audiencia</h2>
        <form action={crearAudiencia} className="grid sm:grid-cols-2 gap-3">
          <Field label="Título *" full>
            <input
              name="titulo"
              type="text"
              required
              placeholder='Ej: "Readecuación tarifaria — Servicio de agua potable"'
              className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
            />
          </Field>
          <Field label="Descripción *" full>
            <textarea
              name="descripcion"
              required
              rows={3}
              className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y"
            />
          </Field>
          <Field label="Fecha y hora de la audiencia *">
            <input
              name="fecha"
              type="datetime-local"
              required
              className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
            />
          </Field>
          <Field label="Cierre de inscripción">
            <input
              name="inscripcionCierra"
              type="datetime-local"
              className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
            />
          </Field>
          <Field label="Modalidad *">
            <select
              name="modalidad"
              required
              defaultValue=""
              className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
            >
              <option value="" disabled>
                Seleccionar…
              </option>
              {(Object.keys(MODALIDAD_META) as ModalidadAudiencia[]).map((m) => (
                <option key={m} value={m}>
                  {MODALIDAD_META[m].icon} {MODALIDAD_META[m].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Capacidad (opcional)">
            <input
              name="capacidad"
              type="number"
              min={1}
              className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
            />
          </Field>
          <Field label="Lugar (si es presencial)">
            <input
              name="lugar"
              type="text"
              placeholder="ej: Sala del Concejo Deliberante"
              className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
            />
          </Field>
          <Field label="Enlace virtual (Zoom/Meet)">
            <input
              name="enlaceVirtual"
              type="url"
              placeholder="https://…"
              className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
            />
          </Field>
          <Field label='N° expediente (ej: "Readecuación tarifaria - cuadro tarifario")'>
            <input
              name="expedienteNumero"
              type="text"
              placeholder="EXP-2026-NNN"
              className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
            />
          </Field>
          <Field label="Título del expediente">
            <input
              name="expedienteTitulo"
              type="text"
              placeholder='Ej: "Cuadro tarifario SCPL agua 2026"'
              className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
            />
          </Field>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-svc-red text-white font-bold text-sm"
            >
              Crear audiencia y abrir inscripción
            </button>
          </div>
        </form>
      </section>

      <ListaAudiencias
        titulo="Próximas y en curso"
        vacioMsg="No hay audiencias próximas o con inscripción abierta."
        audiencias={proximas}
      />

      <ListaAudiencias
        titulo="Audiencias realizadas"
        vacioMsg="Todavía no se realizaron audiencias."
        audiencias={realizadas}
        muestraMaterial
      />
    </div>
  );
}

function ListaAudiencias({
  titulo,
  vacioMsg,
  audiencias,
  muestraMaterial,
}: {
  titulo: string;
  vacioMsg: string;
  audiencias: Awaited<
    ReturnType<typeof prisma.audienciaPublica.findMany>
  > extends Array<infer T>
    ? (T & { _count: { inscripciones: number } })[]
    : never;
  muestraMaterial?: boolean;
}) {
  return (
    <section>
      <h2 className="text-base font-extrabold text-navy mb-3">
        {titulo} · {audiencias.length}
      </h2>
      {audiencias.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong bg-paper-2 p-8 text-center text-muted text-sm">
          {vacioMsg}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {audiencias.map((a) => {
            const m = ESTADO_AUDIENCIA_META[a.estado];
            const tieneVideo = !!a.videoUrl;
            const tieneTranscripcion =
              !!a.transcripcionTaquigraficaUrl ||
              (a.transcripcionTaquigraficaTexto?.trim().length ?? 0) > 0;
            const tieneDictamen =
              !!a.dictamenUrl || (a.dictamenTexto?.trim().length ?? 0) > 0;
            return (
              <li key={a.id}>
                <Link
                  href={`/admin/audiencias/${a.id}`}
                  className="block rounded-xl border border-line bg-paper p-4 hover:bg-paper-2"
                >
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span
                      className={`inline-flex items-center uppercase tracking-wider font-bold rounded-full border px-2 py-0.5 ${TONE_CLASS[m.tone]}`}
                    >
                      {m.label}
                    </span>
                    <span className="text-muted">·</span>
                    <span className="text-muted">
                      {MODALIDAD_META[a.modalidad].label}
                    </span>
                    <span className="text-muted">·</span>
                    <span className="text-muted">
                      {a.fecha.toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {a.inscripcionCierra && !muestraMaterial && (
                      <>
                        <span className="text-muted">·</span>
                        <span className="text-muted">
                          inscripción cierra{" "}
                          {a.inscripcionCierra.toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </>
                    )}
                    <span className="ml-auto font-bold text-navy">
                      {a._count.inscripciones} inscripto
                      {a._count.inscripciones === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="text-base font-bold text-navy mt-1">
                    {a.titulo}
                  </div>
                  {a.expedienteNumero && (
                    <div className="text-xs text-muted mt-1">
                      Expediente: <strong className="text-navy">{a.expedienteNumero}</strong>
                      {a.expedienteTitulo && (
                        <span className="text-muted"> · {a.expedienteTitulo}</span>
                      )}
                    </div>
                  )}
                  {muestraMaterial && (
                    <div className="flex gap-2 mt-2 flex-wrap text-[10px] uppercase tracking-wider">
                      <Pill on={tieneVideo} label="Video" />
                      <Pill on={tieneTranscripcion} label="Transcripción" />
                      <Pill on={tieneDictamen} label="Dictamen ENCOSEP" />
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Pill({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border px-2 py-0.5 ${
        on
          ? "bg-svc-green/15 text-svc-green border-svc-green/40"
          : "bg-paper-3 text-muted border-line-strong"
      }`}
    >
      {on ? "✓ " : "○ "}
      {label}
    </span>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </span>
      {children}
    </label>
  );
}
