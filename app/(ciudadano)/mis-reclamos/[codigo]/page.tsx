import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { MiniMapa } from "@/components/mapa/MiniMapa";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { Galeria } from "@/components/ui/Galeria";
import { svcFromKind } from "@/lib/servicios";
import { ESTADO_META } from "@/lib/admin";
import {
  habilitarRecursoDirecto,
  solicitarCopiaExpediente,
  calificarReclamo,
} from "./actions";

export const metadata = { title: "Mi reclamo · ENCOSEP" };

// Eventos visibles para el vecino: el historial completo excepto comentarios internos
// del Ente. Mantengo CREACION, CAMBIO_ESTADO, ASIGNACION, NOTIFICACION.
const TIPOS_VISIBLES = ["CREACION", "CAMBIO_ESTADO", "ASIGNACION", "NOTIFICACION"];

export default async function DetalleMiReclamoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const session = await auth();

  const reclamo = await prisma.reclamo.findUnique({
    where: { codigo },
    include: {
      servicio: true,
      prestadora: true,
      adjuntos: true,
      expediente: true,
      eventos: {
        orderBy: { createdAt: "asc" },
        include: { autor: true },
      },
    },
  });

  if (!reclamo || reclamo.ciudadanoId !== session!.user.id) notFound();

  const svc = svcFromKind(reclamo.servicio.kind);
  const fotos = reclamo.adjuntos.filter((a) => a.tipo === "FOTO");
  const eventosVisibles = reclamo.eventos.filter((e) =>
    TIPOS_VISIBLES.includes(e.tipo),
  );

  const fechaLarga = reclamo.createdAt.toLocaleString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="flex flex-1 flex-col gap-4 py-4">
      <Link
        href="/mis-reclamos"
        className="text-xs text-muted hover:text-navy"
      >
        ← Mis reclamos
      </Link>

      <header className="flex items-start gap-3">
        <SvcIcon kind={svc} size={56} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-extrabold text-navy font-mono">
              #{reclamo.codigo}
            </h1>
            <EstadoBadge estado={reclamo.estado} size="sm" />
          </div>
          <div className="text-sm font-semibold text-navy mt-1 leading-snug">
            {reclamo.titulo}
          </div>
          <div className="text-[11px] text-muted mt-0.5">
            {reclamo.servicio.nombre}
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-line bg-paper p-4">
        <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
          Lo que contaste
        </div>
        <p className="text-sm text-navy whitespace-pre-wrap leading-relaxed">
          {reclamo.descripcion}
        </p>
        <div className="text-[11px] text-muted mt-2">
          Cargado el {fechaLarga}
        </div>
      </section>

      {fotos.length > 0 && (
        <section className="rounded-2xl border border-line bg-paper p-4">
          <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
            Fotos · {fotos.length}
          </div>
          <Galeria
            fotos={fotos.map((f) => ({
              id: f.id,
              url: f.url,
              descripcion: null,
            }))}
            titulo={`Reclamo ${reclamo.codigo}`}
          />
        </section>
      )}

      <section className="rounded-2xl border border-line bg-paper p-4">
        <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
          Ubicación
        </div>
        <div className="text-sm text-navy">
          {reclamo.direccion}
          {reclamo.barrio && (
            <span className="text-muted"> · {reclamo.barrio}</span>
          )}
        </div>
        {reclamo.lat !== null && reclamo.lng !== null && (
          <div className="mt-3">
            <MiniMapa lat={reclamo.lat} lng={reclamo.lng} alto={180} />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-paper p-4">
        <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
          Estado del trámite
        </div>
        <div className="text-xs text-muted leading-relaxed mb-3">
          Acá te avisamos cada movimiento que hagan el Ente o la prestadora.
        </div>
        <ol className="flex flex-col gap-3">
          {eventosVisibles.map((ev) => (
            <li key={ev.id} className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-navy-2 mt-2 shrink-0" />
              <div className="flex-1">
                <div className="text-[11px] text-muted">
                  {ev.createdAt.toLocaleString("es-AR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="text-sm text-navy mt-0.5 font-semibold">
                  {eventoLabelVecino(ev.tipo)}
                  {ev.estadoNuevo
                    ? ` → ${ESTADO_META[ev.estadoNuevo].label}`
                    : ""}
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
      </section>

      <section className="rounded-2xl border border-line bg-paper p-4">
        <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
          Prestadora responsable
        </div>
        <div className="text-sm font-semibold text-navy">
          {reclamo.prestadora?.razonSocial ?? "Por asignar"}
        </div>
        {reclamo.slaDeadline && !reclamo.cerradoEn && (
          <div className="text-xs text-muted mt-1">
            Plazo para resolver:{" "}
            {reclamo.slaDeadline.toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </div>
        )}
        {reclamo.cerradoEn && (
          <div className="text-xs text-svc-green font-semibold mt-1">
            Cerrado el{" "}
            {reclamo.cerradoEn.toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </div>
        )}
      </section>

      {reclamo.expediente && (
        <section className="rounded-2xl border border-svc-orange/40 bg-svc-orange/5 p-4">
          <div className="text-[11px] font-bold text-svc-orange uppercase tracking-wider mb-1">
            Expediente administrativo
          </div>
          <div className="text-sm font-mono font-bold text-svc-orange">
            {reclamo.expediente.numero}
          </div>
          <div className="text-xs text-navy mt-0.5">
            {reclamo.expediente.caratula}
          </div>
          <div className="text-[11px] text-muted mt-1">
            El Ente elevó tu reclamo a un expediente administrativo formal
            contra la prestadora.
          </div>
        </section>
      )}

      {/* ACCIONES DEL VECINO — recurso directo / copia expediente */}
      {!reclamo.recursoDirecto && (
        <section className="rounded-2xl border-2 border-svc-orange/40 bg-svc-orange/5 p-4">
          <div className="text-[11px] font-bold text-svc-orange uppercase tracking-wider mb-1">
            ¿Querés reclamar directo a la prestadora?
          </div>
          <p className="text-sm text-navy mt-1 leading-relaxed">
            Podés habilitar el <strong>recurso directo</strong> a la
            prestadora. La empresa tiene 5 días hábiles para responderte por
            escrito sin pasar por el Ente. El Ente sigue siendo notificado.
          </p>
          <form
            action={habilitarRecursoDirecto}
            className="mt-2"
          >
            <input type="hidden" name="codigo" value={reclamo.codigo} />
            <button
              type="submit"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-svc-orange text-white font-bold text-sm"
            >
              Habilitar recurso directo
            </button>
          </form>
        </section>
      )}

      {reclamo.recursoDirecto && (
        <section className="rounded-2xl border border-svc-orange bg-svc-orange/10 p-4 text-sm text-navy">
          <strong>Recurso directo habilitado</strong>{" "}
          {reclamo.recursoDirectoEn && (
            <span className="text-muted">
              el {reclamo.recursoDirectoEn.toLocaleDateString("es-AR")}
            </span>
          )}
          . La prestadora tiene 5 días hábiles para responderte por escrito.
        </section>
      )}

      {(reclamo.estado === "CERRADO_SIN_SOLUCION" ||
        reclamo.estado === "RECHAZADO") &&
        !reclamo.copiaExpedienteSolicitada && (
          <section className="rounded-2xl border-2 border-svc-red/40 bg-svc-red/5 p-4">
            <div className="text-[11px] font-bold text-svc-red uppercase tracking-wider mb-1">
              Vía administrativa agotada
            </div>
            <p className="text-sm text-navy mt-1 leading-relaxed">
              Si querés llevar el caso a la Defensoría del Pueblo o a la vía
              judicial, podés <strong>solicitar copia digital del
              expediente</strong> con todos los antecedentes.
            </p>
            <form action={solicitarCopiaExpediente} className="mt-2">
              <input type="hidden" name="codigo" value={reclamo.codigo} />
              <button
                type="submit"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-svc-red text-white font-bold text-sm"
              >
                Solicitar copia del expediente
              </button>
            </form>
          </section>
        )}

      {reclamo.copiaExpedienteSolicitada && (
        <section className="rounded-2xl border border-svc-red bg-svc-red/10 p-4 text-sm text-navy">
          <strong>Copia del expediente solicitada</strong>{" "}
          {reclamo.copiaExpedienteEn && (
            <span className="text-muted">
              el {reclamo.copiaExpedienteEn.toLocaleDateString("es-AR")}
            </span>
          )}
          . El Ente la preparará y te la enviará por email.
        </section>
      )}

      {/* ENCUESTA DE CIERRE */}
      {["RESUELTO", "CERRADO_SIN_SOLUCION", "RECHAZADO"].includes(
        reclamo.estado,
      ) &&
        !reclamo.encuestaEn && (
          <section className="rounded-2xl border-2 border-svc-green/40 bg-svc-green/5 p-4">
            <div className="text-[11px] font-bold text-svc-green uppercase tracking-wider mb-1">
              ¿Cómo te atendimos?
            </div>
            <p className="text-sm text-navy mb-3">
              Calificá del 1 al 5 la atención del Ente y de la prestadora.
              Tu opinión cuenta para mejorar.
            </p>
            <form action={calificarReclamo} className="flex flex-col gap-3">
              <input type="hidden" name="codigo" value={reclamo.codigo} />
              <PuntajeField name="puntajeEnte" label="Ente (ENCOSEP)" />
              <PuntajeField
                name="puntajePrestadora"
                label={`Prestadora${reclamo.prestadora ? ` (${reclamo.prestadora.razonSocial})` : ""}`}
              />
              <textarea
                name="comentarioEncuesta"
                rows={2}
                placeholder="Comentario opcional…"
                className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-svc-green text-white font-bold text-sm"
              >
                Enviar mi calificación
              </button>
            </form>
          </section>
        )}

      {reclamo.encuestaEn && (
        <section className="rounded-2xl border border-svc-green bg-svc-green/10 p-4 text-sm text-navy">
          <strong>¡Gracias por tu calificación!</strong> Ente:{" "}
          {reclamo.puntajeEnte}/5 · Prestadora: {reclamo.puntajePrestadora}/5
        </section>
      )}
    </main>
  );
}

function PuntajeField({ name, label }: { name: string; label: string }) {
  return (
    <fieldset>
      <legend className="text-xs font-bold text-navy">{label}</legend>
      <div className="flex gap-1.5 mt-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="flex-1 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={n}
              required
              className="peer sr-only"
            />
            <div className="text-center py-2 rounded-lg border-2 border-line-strong bg-paper-2 text-navy font-bold peer-checked:bg-svc-green peer-checked:text-white peer-checked:border-svc-green transition">
              {n}
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function eventoLabelVecino(tipo: string): string {
  switch (tipo) {
    case "CREACION":
      return "Reclamo registrado";
    case "CAMBIO_ESTADO":
      return "Cambio de estado";
    case "ASIGNACION":
      return "Derivado a la prestadora";
    case "NOTIFICACION":
      return "Aviso del Ente";
    default:
      return tipo;
  }
}
