"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import type { TipoActo } from "@prisma/client";
import { TIPO_ACTO_META, GUIA_ETAPA } from "@/lib/expedientes";
import {
  agregarActo,
  notificarActo,
  enviarMensajeExpediente,
  eliminarActo,
  editarCaratula,
  editarActo,
  confirmarActo,
} from "./actions";

export type CaratulaView = {
  numero: string;
  tipoExpediente: string;
  caratula: string;
  asunto: string;
  intervinientes: string | null;
  prestadoraId: string;
};

export type PrestadoraOpt = { id: string; razonSocial: string };

// Botón de envío que se bloquea mientras el servidor procesa, para evitar
// dobles clics que crean actos/mensajes duplicados.
function BotonEnviar({
  children,
  className,
  pendingText = "Guardando…",
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className ?? ""} disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {pending ? pendingText : children}
    </button>
  );
}

export type AdjuntoView = {
  id: string;
  tipo: string;
  url: string;
  nombre: string | null;
};

export type MensajeView = {
  id: string;
  autorNombre: string;
  esEnte: boolean;
  cuerpo: string;
  fecha: string;
};

export type ActoView = {
  id: string;
  tipo: TipoActo;
  titulo: string;
  cuerpo: string;
  fecha: string;
  autor: string;
  notificadoTexto: string | null;
  visiblePrestadora: boolean;
  confirmado: boolean;
  adjuntos: AdjuntoView[];
};

type Props = {
  expedienteId: string;
  actos: ActoView[];
  esEnte: boolean;
  esOperadorEstaPrestadora: boolean;
  archivado: boolean;
  notificables: string[];
  mensajesUsuario: MensajeView[];
  mensajesPrestadora: MensajeView[];
  caratula: CaratulaView;
  prestadoras: PrestadoraOpt[];
};

const NUEVO = "__nuevo__";

function iconoAdjunto(tipo: string): string {
  if (tipo === "FOTO") return "🖼️";
  if (tipo === "VIDEO") return "🎬";
  if (tipo === "AUDIO") return "🔊";
  return "📎";
}

export function Workspace({
  expedienteId,
  actos,
  esEnte,
  esOperadorEstaPrestadora,
  archivado,
  notificables,
  mensajesUsuario,
  mensajesPrestadora,
  caratula,
  prestadoras,
}: Props) {
  const puedeLabrar = (esEnte || esOperadorEstaPrestadora) && !archivado;
  // Por defecto mostramos el último acto; si no hay, la mesa de "nuevo acto".
  const [sel, setSel] = useState<string>(
    actos.length ? actos[actos.length - 1].id : puedeLabrar ? NUEVO : "",
  );

  const actoSel = actos.find((a) => a.id === sel) ?? null;

  return (
    <div className="grid lg:grid-cols-[240px_1fr_300px] gap-4 items-start">
      {/* ───────── ZONA I · Crónica / hoja de ruta ───────── */}
      <aside className="rounded-2xl border border-line bg-paper p-3 lg:sticky lg:top-4">
        <h2 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2 px-1">
          Crónica del expediente
        </h2>
        <ol className="flex flex-col gap-1">
          {actos.map((a, i) => {
            const ti = TIPO_ACTO_META[a.tipo];
            const activo = a.id === sel;
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setSel(a.id)}
                  className={`w-full text-left flex items-start gap-2 px-2 py-1.5 rounded-lg border transition ${
                    activo
                      ? "border-svc-orange bg-svc-orange/10"
                      : "border-transparent hover:bg-paper-2"
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-muted mt-0.5 w-8 shrink-0">
                    f.{String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-base leading-none mt-0.5">
                    {ti.icon}
                  </span>
                  <span className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-svc-orange leading-tight">
                      {ti.label}
                      {!a.confirmado && (
                        <span className="ml-1 text-[9px] text-svc-yellow">
                          ● borrador
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-navy truncate leading-tight">
                      {a.titulo}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {puedeLabrar && (
          <button
            type="button"
            onClick={() => setSel(NUEVO)}
            className={`w-full mt-2 px-2 py-2 rounded-lg border-2 border-dashed text-xs font-bold transition ${
              sel === NUEVO
                ? "border-svc-orange text-svc-orange bg-svc-orange/5"
                : "border-line-strong text-muted hover:border-svc-orange hover:text-svc-orange"
            }`}
          >
            + Labrar nuevo acto
          </button>
        )}
      </aside>

      {/* ───────── ZONA II · Mesa de trabajo ───────── */}
      <section className="rounded-2xl border border-line bg-paper p-5 min-h-[300px]">
        {/* Tira horizontal de etapas (atajo) */}
        {actos.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-line">
            {actos.map((a, i) => {
              const ti = TIPO_ACTO_META[a.tipo];
              const activo = a.id === sel;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSel(a.id)}
                  title={`f.${i + 1} · ${ti.label}`}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap border transition ${
                    activo
                      ? "bg-svc-orange text-white border-svc-orange"
                      : "bg-paper-2 text-navy border-line hover:border-svc-orange"
                  }`}
                >
                  {ti.icon} {ti.label}
                </button>
              );
            })}
          </div>
        )}

        {sel === NUEVO ? (
          <NuevoActo
            expedienteId={expedienteId}
            esEnte={esEnte}
            esOperadorEstaPrestadora={esOperadorEstaPrestadora}
          />
        ) : actoSel ? (
          <DetalleActo
            acto={actoSel}
            esEnte={esEnte}
            puedeEditar={esEnte || esOperadorEstaPrestadora}
            notificable={notificables.includes(actoSel.tipo)}
            expedienteId={expedienteId}
            previos={actos.slice(
              0,
              actos.findIndex((a) => a.id === actoSel.id),
            )}
            caratula={caratula}
            prestadoras={prestadoras}
          />
        ) : (
          <p className="text-sm text-muted">
            Seleccioná una etapa de la crónica para verla acá.
          </p>
        )}
      </section>

      {/* ───────── ZONA III · Mensajería ───────── */}
      <aside className="rounded-2xl border border-line bg-paper p-4 flex flex-col gap-4 lg:sticky lg:top-4">
        <h2 className="text-[11px] font-bold text-muted uppercase tracking-wider">
          Mensajería
        </h2>
        {/* El chat con el usuario lo maneja el Ente; la prestadora no lo ve. */}
        {esEnte && (
          <ChatPanel
            titulo="💬 Chat con el usuario"
            expedienteId={expedienteId}
            canal="USUARIO"
            mensajes={mensajesUsuario}
            puedeEscribir={esEnte}
          />
        )}
        {(esEnte || esOperadorEstaPrestadora) && (
          <ChatPanel
            titulo="🏢 Chat con la prestadora"
            expedienteId={expedienteId}
            canal="PRESTADORA"
            mensajes={mensajesPrestadora}
            puedeEscribir={esEnte || esOperadorEstaPrestadora}
          />
        )}
      </aside>
    </div>
  );
}

function ChatPanel({
  titulo,
  expedienteId,
  canal,
  mensajes,
  puedeEscribir,
}: {
  titulo: string;
  expedienteId: string;
  canal: "USUARIO" | "PRESTADORA";
  mensajes: MensajeView[];
  puedeEscribir: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-paper-2 p-3 flex flex-col gap-2">
      <div className="text-xs font-bold text-navy">{titulo}</div>

      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
        {mensajes.length === 0 ? (
          <p className="text-[11px] text-muted italic">
            Todavía no hay mensajes.
          </p>
        ) : (
          mensajes.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.esEnte ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[88%] px-2.5 py-1.5 rounded-2xl text-xs ${
                  msg.esEnte
                    ? "bg-svc-blue/15 text-navy rounded-br-sm"
                    : "bg-paper border border-line text-navy rounded-bl-sm"
                }`}
              >
                <div className="text-[9px] uppercase tracking-wide font-bold text-muted mb-0.5">
                  {msg.autorNombre}
                </div>
                <div className="whitespace-pre-wrap leading-snug">
                  {msg.cuerpo}
                </div>
              </div>
              <div className="text-[9px] text-muted mt-0.5">{msg.fecha}</div>
            </div>
          ))
        )}
      </div>

      {puedeEscribir && (
        <form
          action={enviarMensajeExpediente}
          className="flex flex-col gap-1.5 mt-1"
        >
          <input type="hidden" name="expedienteId" value={expedienteId} />
          <input type="hidden" name="canal" value={canal} />
          <textarea
            name="cuerpo"
            required
            rows={2}
            placeholder="Escribí un mensaje…"
            className="px-2.5 py-1.5 rounded-lg border border-line-strong text-xs bg-paper resize-y"
          />
          <BotonEnviar
            className="self-end px-3 py-1.5 rounded-lg bg-navy-2 text-white text-xs font-semibold"
            pendingText="Enviando…"
          >
            Enviar
          </BotonEnviar>
        </form>
      )}
    </div>
  );
}

function DetalleActo({
  acto,
  esEnte,
  puedeEditar,
  notificable,
  expedienteId,
  previos,
  caratula,
  prestadoras,
}: {
  acto: ActoView;
  esEnte: boolean;
  puedeEditar: boolean;
  notificable: boolean;
  expedienteId: string;
  previos: ActoView[];
  caratula: CaratulaView;
  prestadoras: PrestadoraOpt[];
}) {
  const ti = TIPO_ACTO_META[acto.tipo];
  const esCaratula = acto.tipo === "CARATULACION";
  // En borrador y con permiso → se trabaja la hoja (editable).
  const enBorrador = !acto.confirmado;
  return (
    <div className="flex flex-col gap-2">
      {/* Encabezado contextual: en qué etapa estás + qué hacer + estado */}
      <div className="rounded-xl bg-svc-orange/10 border border-svc-orange/30 px-3 py-2">
        <div className="flex items-center gap-2 justify-between flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-lg">{ti.icon}</span>
            <span className="text-[11px] uppercase tracking-wider font-bold text-svc-orange">
              Estás en: {ti.label}
            </span>
          </div>
          {acto.confirmado ? (
            <span className="text-[10px] uppercase tracking-wider font-bold text-svc-green bg-svc-green/15 border border-svc-green/40 rounded-full px-2 py-0.5">
              ✓ Confirmado
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wider font-bold text-navy bg-svc-yellow/30 border border-svc-yellow/60 rounded-full px-2 py-0.5">
              ● Borrador
            </span>
          )}
        </div>
        <p className="text-xs text-navy mt-1">
          <strong>Qué hacer:</strong> {GUIA_ETAPA[acto.tipo]}
        </p>
      </div>

      {/* Qué se hizo hasta el momento (etapas previas) */}
      <div className="rounded-xl bg-paper-2 border border-line px-3 py-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-muted">
          Qué se hizo hasta acá
        </span>
        {previos.length === 0 ? (
          <p className="text-xs text-muted mt-1 italic">
            Es la primera etapa del expediente.
          </p>
        ) : (
          <ol className="text-xs text-navy mt-1 list-decimal ml-4 space-y-0.5">
            {previos.map((p) => (
              <li key={p.id}>
                <span className="font-semibold">
                  {TIPO_ACTO_META[p.tipo].label}:
                </span>{" "}
                {p.titulo}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* La carátula solo se edita en su propia etapa, y solo el Ente */}
      {esCaratula && esEnte && (
        <EditarCaratula
          expedienteId={expedienteId}
          caratula={caratula}
          prestadoras={prestadoras}
        />
      )}

      <div className="text-xs text-muted mt-1">
        {acto.fecha} · {acto.autor}
      </div>

      {/* Documental ya cargada */}
      {acto.adjuntos.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-2">
          {acto.adjuntos.map((adj) => (
            <a
              key={adj.id}
              href={adj.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-line bg-paper-2 text-xs text-navy hover:bg-paper-3"
            >
              <span>{iconoAdjunto(adj.tipo)}</span>
              <span className="max-w-[160px] truncate">
                {adj.nombre ?? "Archivo"}
              </span>
            </a>
          ))}
        </div>
      )}

      {/* En borrador se trabaja la hoja (editable, como un Word).
          Confirmado se muestra fijo; solo el Ente puede modificarlo. */}
      {enBorrador && puedeEditar ? (
        <FormEditarActo acto={acto} guardarLabel="💾 Guardar borrador" />
      ) : (
        <>
          <h3 className="text-lg font-bold text-navy mt-1">{acto.titulo}</h3>
          <div className="text-sm text-navy whitespace-pre-wrap leading-relaxed">
            {acto.cuerpo}
          </div>
          {esEnte && (
            <details className="mt-1 rounded-xl border border-line bg-paper-2 px-3 py-2">
              <summary className="text-xs font-bold text-navy cursor-pointer">
                ✏️ Modificar (solo ENCOSEP)
              </summary>
              <div className="mt-2">
                <FormEditarActo acto={acto} guardarLabel="💾 Guardar cambios" />
              </div>
            </details>
          )}
        </>
      )}

      {/* Confirmar el trabajo: pasa de borrador a confirmado y habilita notificar */}
      {enBorrador && puedeEditar && (
        <form action={confirmarActo} className="mt-1">
          <input type="hidden" name="actoId" value={acto.id} />
          <BotonEnviar
            className="px-4 py-2 rounded-lg bg-svc-green text-white font-bold text-sm"
            pendingText="Confirmando…"
          >
            ✅ Confirmar trabajo
          </BotonEnviar>
        </form>
      )}

      {/* Notificación (transversal, no es una etapa): comunica la etapa a la
          prestadora. Solo disponible una vez confirmado el trabajo. */}
      {notificable && acto.confirmado && (
        <div className="mt-2 pt-2 border-t border-line flex flex-col gap-1.5">
          {acto.notificadoTexto && (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-svc-green">
              <span>✓</span>
              <span>{acto.notificadoTexto}</span>
            </div>
          )}
          {!acto.notificadoTexto && acto.visiblePrestadora && (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-svc-green">
              <span>👁️</span>
              <span>Visible para la prestadora</span>
            </div>
          )}
          {esEnte ? (
            <div className="flex flex-wrap gap-1.5">
              <form action={notificarActo}>
                <input type="hidden" name="actoId" value={acto.id} />
                <input type="hidden" name="alcance" value="SOLO" />
                <BotonEnviar
                  className="text-xs px-3 py-1.5 rounded-lg border border-svc-blue text-svc-blue font-semibold hover:bg-svc-blue/10"
                  pendingText="Enviando…"
                >
                  📨 Notificar solo esta etapa
                </BotonEnviar>
              </form>
              <form action={notificarActo}>
                <input type="hidden" name="actoId" value={acto.id} />
                <input type="hidden" name="alcance" value="HASTA" />
                <BotonEnviar
                  className="text-xs px-3 py-1.5 rounded-lg border border-svc-blue bg-svc-blue/10 text-svc-blue font-semibold hover:bg-svc-blue/20"
                  pendingText="Enviando…"
                >
                  📨 Notificar todo hasta acá
                </BotonEnviar>
              </form>
            </div>
          ) : !acto.notificadoTexto && !acto.visiblePrestadora ? (
            <div className="text-[11px] text-muted italic">Sin notificar</div>
          ) : null}
        </div>
      )}

      {/* Emisión en DOC/PDF */}
      <div className="mt-2 pt-2 border-t border-line flex flex-wrap gap-1.5">
        <a
          href={`/admin/expediente/${expedienteId}/imprimir?solo=${acto.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3 py-1.5 rounded-lg border border-line-strong text-navy font-semibold hover:bg-paper-2"
        >
          📄 Emitir esta etapa
        </a>
        <a
          href={`/admin/expediente/${expedienteId}/imprimir?hasta=${acto.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3 py-1.5 rounded-lg border border-line-strong text-navy font-semibold hover:bg-paper-2"
        >
          📄 Emitir hasta esta foja
        </a>
      </div>

      {/* Eliminar etapa (p. ej. si quedó duplicada). Solo Ente. */}
      {esEnte && (
        <form
          action={eliminarActo}
          onSubmit={(e) => {
            if (
              !window.confirm(
                "¿Eliminar esta etapa del expediente? No se puede deshacer.",
              )
            ) {
              e.preventDefault();
            }
          }}
          className="mt-1"
        >
          <input type="hidden" name="actoId" value={acto.id} />
          <BotonEnviar
            className="text-xs px-3 py-1.5 rounded-lg border border-svc-red text-svc-red font-semibold hover:bg-svc-red/10"
            pendingText="Eliminando…"
          >
            🗑️ Eliminar etapa (duplicada)
          </BotonEnviar>
        </form>
      )}
    </div>
  );
}

function FormEditarActo({
  acto,
  guardarLabel,
}: {
  acto: ActoView;
  guardarLabel: string;
}) {
  return (
    <form
      action={editarActo}
      encType="multipart/form-data"
      className="flex flex-col gap-2 mt-1"
    >
      <input type="hidden" name="actoId" value={acto.id} />
      <label className="text-[10px] uppercase tracking-wider text-muted font-semibold">
        Título
      </label>
      <input
        name="titulo"
        required
        defaultValue={acto.titulo}
        className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
      />
      <label className="text-[10px] uppercase tracking-wider text-muted font-semibold">
        Cuerpo de la etapa
      </label>
      <textarea
        name="cuerpo"
        required
        rows={6}
        defaultValue={acto.cuerpo}
        className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y"
      />
      <label className="text-[10px] uppercase tracking-wider text-muted font-semibold">
        Sumar documental (opcional)
      </label>
      <input
        type="file"
        name="archivos"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
        className="text-xs text-navy file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-navy-2 file:text-white file:text-xs file:font-semibold"
      />
      <BotonEnviar className="self-start px-4 py-2 rounded-lg bg-navy-2 text-white font-bold text-sm">
        {guardarLabel}
      </BotonEnviar>
    </form>
  );
}

function EditarCaratula({
  expedienteId,
  caratula,
  prestadoras,
}: {
  expedienteId: string;
  caratula: CaratulaView;
  prestadoras: PrestadoraOpt[];
}) {
  return (
    <details className="rounded-xl border border-line bg-paper-2 px-3 py-2">
      <summary className="text-xs font-bold text-navy cursor-pointer">
        ✏️ Editar carátula (N°/Año, tipo, objeto, prestadora, partes)
      </summary>
      <form action={editarCaratula} className="grid sm:grid-cols-2 gap-2 mt-3">
        <input type="hidden" name="expedienteId" value={expedienteId} />
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            N° / Año
          </span>
          <input
            name="numero"
            required
            defaultValue={caratula.numero}
            className="px-2 py-1.5 rounded-lg border border-line-strong text-sm bg-paper font-mono"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            Tipo de expediente
          </span>
          <input
            name="tipoExpediente"
            required
            defaultValue={caratula.tipoExpediente}
            list="tipos-exp-mesa"
            className="px-2 py-1.5 rounded-lg border border-line-strong text-sm bg-paper"
          />
          <datalist id="tipos-exp-mesa">
            <option value="Reclamo individual" />
            <option value="Readecuación tarifaria" />
            <option value="Cambio de cuadro tarifario" />
            <option value="Actuación de oficio" />
          </datalist>
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            Carátula
          </span>
          <input
            name="caratula"
            required
            defaultValue={caratula.caratula}
            className="px-2 py-1.5 rounded-lg border border-line-strong text-sm bg-paper"
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            Objeto
          </span>
          <input
            name="asunto"
            required
            defaultValue={caratula.asunto}
            className="px-2 py-1.5 rounded-lg border border-line-strong text-sm bg-paper"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            Prestadora
          </span>
          <select
            name="prestadoraId"
            required
            defaultValue={caratula.prestadoraId}
            className="px-2 py-1.5 rounded-lg border border-line-strong text-sm bg-paper"
          >
            {prestadoras.map((p) => (
              <option key={p.id} value={p.id}>
                {p.razonSocial}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            Intervinientes
          </span>
          <input
            name="intervinientes"
            defaultValue={caratula.intervinientes ?? ""}
            className="px-2 py-1.5 rounded-lg border border-line-strong text-sm bg-paper"
          />
        </label>
        <div className="sm:col-span-2">
          <BotonEnviar className="px-4 py-2 rounded-lg bg-navy-2 text-white font-bold text-sm">
            Guardar carátula
          </BotonEnviar>
        </div>
      </form>
    </details>
  );
}

function NuevoActo({
  expedienteId,
  esEnte,
  esOperadorEstaPrestadora,
}: {
  expedienteId: string;
  esEnte: boolean;
  esOperadorEstaPrestadora: boolean;
}) {
  const [tipo, setTipo] = useState<string>("");
  const guia = tipo ? GUIA_ETAPA[tipo as TipoActo] : null;

  return (
    <form
      action={agregarActo}
      encType="multipart/form-data"
      className="flex flex-col gap-2"
    >
      <h3 className="text-lg font-bold text-navy">Labrar nuevo acto</h3>
      <input type="hidden" name="expedienteId" value={expedienteId} />

      <label className="text-[10px] uppercase tracking-wider text-muted font-semibold mt-1">
        Tipo de acto
      </label>
      <select
        name="tipo"
        required
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        className="px-2 py-2 rounded-lg border border-line-strong text-sm bg-paper"
      >
        <option value="" disabled>
          Seleccionar…
        </option>
        {esEnte && (
          <>
            <option value="ACTA_RECEPCION">📋 Acta de recepción</option>
            <option value="NOTIFICACION">📨 Notificación</option>
            <option value="INTIMACION">⚖️ Intimación</option>
            <option value="CONSTATACION">🔎 Acta de constatación</option>
            <option value="AMPLIACION">➕ Ampliación</option>
            <option value="DISPOSICION">🖋️ Disposición (proveído)</option>
            <option value="CONVOCATORIA_AUDIENCIA">
              📢 Convocatoria a audiencia
            </option>
            <option value="AUDIENCIA">🗣️ Audiencia pública</option>
            <option value="DICTAMEN">📑 Dictamen técnico</option>
            <option value="DERIVACION">↪️ Derivación / remisión</option>
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

      {guia && (
        <p className="text-xs text-navy bg-svc-orange/10 border border-svc-orange/30 rounded-lg px-3 py-2">
          {guia}
        </p>
      )}

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

      <BotonEnviar className="px-4 py-2.5 rounded-lg bg-svc-orange text-white font-bold text-sm mt-2">
        Labrar acto y agregar al expediente
      </BotonEnviar>
    </form>
  );
}
