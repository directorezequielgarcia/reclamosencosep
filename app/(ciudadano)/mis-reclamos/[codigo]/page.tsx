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
  solicitarCopiaExpediente,
  calificarReclamo,
  responderReclamo,
  agregarDocumental,
} from "./actions";
import { BorrarReclamo } from "./BorrarReclamo";
import { Solucionado } from "./Solucionado";

export const metadata = { title: "Mi reclamo · ENCOSEP" };

// Eventos visibles para el vecino: el historial completo excepto comentarios internos
// del Ente. Mantengo CREACION, CAMBIO_ESTADO, ASIGNACION, NOTIFICACION.
const TIPOS_VISIBLES = [
  "CREACION",
  "CAMBIO_ESTADO",
  "ASIGNACION",
  "NOTIFICACION",
  "ADJUNTO",
];

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
  // Conversación ida y vuelta: comentarios marcados como visibles para el vecino
  // (respuestas del Ente + los mensajes que el propio vecino fue dejando).
  const conversacion = reclamo.eventos.filter(
    (e) => e.tipo === "COMENTARIO" && e.visibleVecino,
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

      {!["RESUELTO", "CERRADO_SIN_SOLUCION", "RECHAZADO"].includes(
        reclamo.estado,
      ) && (
        <section className="rounded-2xl border-2 border-svc-green/40 bg-svc-green/5 p-4 flex flex-col gap-2">
          <div className="text-[11px] font-bold text-svc-green uppercase tracking-wider">
            ¿Ya se resolvió?
          </div>
          <p className="text-sm text-navy leading-relaxed">
            Si el problema se solucionó, avisanos y cerramos el reclamo.
          </p>
          <Solucionado codigo={reclamo.codigo} />
        </section>
      )}

      {/* SUMAR DOCUMENTACIÓN — ampliar declaratoria, en cualquier estado */}
      <section className="rounded-2xl border border-line bg-paper p-4">
        <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
          Sumar documentación
        </div>
        <div className="text-xs text-muted leading-relaxed mb-3">
          Podés agregar fotos o imágenes (por ejemplo, de una factura) cuando
          quieras. Quedan registradas con la fecha en el historial de abajo.
        </div>
        <form action={agregarDocumental} className="flex flex-col gap-2">
          <input type="hidden" name="codigo" value={reclamo.codigo} />
          <input
            type="file"
            name="archivo"
            accept="image/*"
            multiple
            required
            className="text-sm text-navy file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-navy-2 file:text-white file:font-semibold"
          />
          <button
            type="submit"
            className="self-end inline-flex items-center justify-center px-4 py-2 rounded-lg bg-navy-2 text-white font-bold text-sm"
          >
            Agregar documentación
          </button>
        </form>
      </section>

      {/* CONVERSACIÓN — ida y vuelta con el ENCOSEP */}
      <section className="rounded-2xl border border-line bg-paper p-4">
        <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
          Conversación con el ENCOSEP
        </div>
        <div className="text-xs text-muted leading-relaxed mb-3">
          Acá ves las respuestas del Ente y podés contestar o sumar información
          en cualquier momento.
        </div>

        {conversacion.length > 0 ? (
          <ol className="flex flex-col gap-2 mb-3">
            {conversacion.map((ev) => {
              const esVecino = ev.autorId === reclamo.ciudadanoId;
              return (
                <li
                  key={ev.id}
                  className={`flex flex-col ${esVecino ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                      esVecino
                        ? "bg-navy-2 text-white rounded-br-sm"
                        : "bg-paper-2 text-navy rounded-bl-sm"
                    }`}
                  >
                    <div
                      className={`text-[10px] font-bold mb-0.5 ${esVecino ? "text-white/70" : "text-muted"}`}
                    >
                      {esVecino ? "Vos" : "ENCOSEP"} ·{" "}
                      {ev.createdAt.toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-sm whitespace-pre-wrap leading-snug">
                      {ev.mensaje}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-muted mb-3">
            Todavía no hay mensajes. Si necesitás aclarar algo, escribinos acá
            abajo.
          </p>
        )}

        <form action={responderReclamo} className="flex flex-col gap-2">
          <input type="hidden" name="codigo" value={reclamo.codigo} />
          <textarea
            name="mensaje"
            rows={3}
            required
            placeholder="Escribí tu mensaje al ENCOSEP…"
            className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y"
          />
          <button
            type="submit"
            className="self-end inline-flex items-center justify-center px-4 py-2 rounded-lg bg-navy-2 text-white font-bold text-sm"
          >
            Enviar mensaje
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-line bg-paper p-4">
        <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
          Prestadora responsable
        </div>
        <div className="text-sm font-semibold text-navy">
          {reclamo.prestadora?.razonSocial ?? "Por asignar"}
        </div>
        {!reclamo.cerradoEn && (
          <div className="text-xs text-muted mt-2 leading-relaxed">
            Si ya reclamaste a la prestadora, tené presente que la empresa debe
            responderte dentro del plazo previsto (en general, 15 días). De
            todos modos, el ENCOSEP puede consultar el estado de tu reclamo.
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
          <Link
            href={`/mis-reclamos/${reclamo.codigo}/expediente`}
            className="inline-block mt-3 px-4 py-2 rounded-lg bg-svc-orange text-white font-bold text-sm"
          >
            📄 Ver / descargar el expediente
          </Link>
        </section>
      )}

      {/* ACCIONES DEL VECINO — copia expediente */}
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

      {reclamo.estado === "RECIBIDO" && (
        <section className="rounded-2xl border border-svc-red/30 bg-svc-red/5 p-4">
          <div className="text-[11px] font-bold text-svc-red uppercase tracking-wider mb-1">
            ¿Te equivocaste?
          </div>
          <p className="text-sm text-navy mb-3 leading-relaxed">
            Mientras el Ente todavía no empezó a revisar tu reclamo, podés
            borrarlo.
          </p>
          <BorrarReclamo codigo={reclamo.codigo} />
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
    case "ADJUNTO":
      return "Documentación agregada";
    case "NOTIFICACION":
      return "Aviso del Ente";
    default:
      return tipo;
  }
}
