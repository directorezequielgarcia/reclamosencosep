"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  SECCIONES_CERT,
  servicioACertTipo,
  type ObservacionSeccion,
  type TipoServicioCert,
} from "@/lib/docx-certificacion";
import { guardarAnalisis, generarNota } from "./actions";
import type { ServicioKind } from "@prisma/client";

// ─────────────────────────────────────────────
// Props que llegan desde el Server Component wrapper
// ─────────────────────────────────────────────

export type AnalisisPageProps = {
  docId: string;
  docTitulo: string;
  docPeriodo: string;
  archivoUrl: string;
  prestadoraRazonSocial: string;
  servicios: { kind: ServicioKind }[];
  // valores guardados previamente
  savedObs: ObservacionSeccion[] | null;
  savedConclusion: string | null;
  savedMontoMaximo: string | null;
  savedNotaNumero: string | null;
  savedNotaDocxUrl: string | null;
  esDireccion: boolean;
};

// ─────────────────────────────────────────────
// Componente principal (Client Component)
// ─────────────────────────────────────────────

export function AnalisisForm(props: AnalisisPageProps) {
  const tipoServicio: TipoServicioCert = servicioACertTipo(props.servicios);
  const secciones = SECCIONES_CERT[tipoServicio];

  // Estado de observaciones
  const [observaciones, setObs] = useState<ObservacionSeccion[]>(() => {
    if (props.savedObs && props.savedObs.length > 0) return props.savedObs;
    return secciones.map((s) => ({ seccion: s.id, titulo: s.titulo, texto: "" }));
  });

  const [conclusion, setConclusion] = useState(props.savedConclusion ?? "");
  const [monto, setMonto] = useState(props.savedMontoMaximo ?? "");
  const [notaNum, setNotaNum] = useState(props.savedNotaNumero ?? "");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState("");

  const obsJson = JSON.stringify(observaciones);

  function updateObs(seccion: string, texto: string) {
    setObs((prev) =>
      prev.map((o) => (o.seccion === seccion ? { ...o, texto } : o)),
    );
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback("");
    const fd = buildFormData(false);
    try {
      await guardarAnalisis(fd);
      setFeedback("Guardado correctamente.");
    } catch (err: unknown) {
      setFeedback("Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerar(e: React.FormEvent) {
    e.preventDefault();
    if (!notaNum.trim()) {
      setFeedback("Ingresá el número de nota antes de generar.");
      return;
    }
    setGenerating(true);
    setFeedback("");
    const fd = buildFormData(true);
    try {
      await generarNota(fd);
      // generarNota hace redirect, así que esta línea no se alcanza normalmente
    } catch (err: unknown) {
      setFeedback("Error: " + (err instanceof Error ? err.message : String(err)));
      setGenerating(false);
    }
  }

  function buildFormData(conNotaNum: boolean): FormData {
    const fd = new FormData();
    fd.set("documentoId", props.docId);
    fd.set("conclusionGeneral", conclusion);
    fd.set("montoMaximo", monto);
    fd.set("observaciones", obsJson);
    if (conNotaNum) fd.set("notaNumero", notaNum);
    return fd;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <header className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs text-muted mb-1">
            <Link href="/admin/documentacion" className="hover:underline">Documentación</Link>
            {" / "}
            <Link href={`/admin/documentacion/${props.docId}`} className="hover:underline">
              {props.docTitulo}
            </Link>
            {" / Analizar"}
          </div>
          <h1 className="text-2xl font-extrabold text-navy">Análisis de certificación</h1>
          <p className="text-sm text-muted mt-1">
            {props.prestadoraRazonSocial} · {props.docPeriodo}
          </p>
        </div>
        {props.savedNotaDocxUrl && (
          <a
            href={props.savedNotaDocxUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-svc-green text-white font-bold text-sm"
          >
            Descargar Nota generada
          </a>
        )}
      </header>

      <div className="grid lg:grid-cols-[1fr_420px] gap-5 items-start">
        {/* PDF viewer */}
        <div className="rounded-2xl border border-line overflow-hidden bg-paper">
          <div className="px-4 py-2 text-[11px] uppercase font-bold tracking-wider text-muted border-b border-line bg-paper-2">
            Certificado de la prestadora
          </div>
          {props.archivoUrl ? (
            <iframe
              src={props.archivoUrl}
              className="w-full"
              style={{ height: "75vh" }}
              title="Certificado PDF"
            />
          ) : (
            <div className="p-8 text-center text-muted text-sm">
              No hay archivo adjunto.
            </div>
          )}
        </div>

        {/* Panel de análisis */}
        <div className="flex flex-col gap-4">
          {/* Observaciones por sección */}
          <div className="rounded-2xl border border-line bg-paper p-5">
            <h2 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-4">
              Observaciones por sección
            </h2>
            <div className="flex flex-col gap-4">
              {observaciones.map((obs) => (
                <div key={obs.seccion} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-navy">
                    {obs.titulo}
                  </label>
                  <textarea
                    rows={4}
                    value={obs.texto}
                    onChange={(e) => updateObs(obs.seccion, e.target.value)}
                    placeholder="Ingresá las observaciones para esta sección…"
                    className="w-full px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy resize-y leading-relaxed"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Conclusión */}
          <div className="rounded-2xl border border-line bg-paper p-5">
            <h2 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3">
              Conclusión general
            </h2>
            <textarea
              rows={5}
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="Redactá la conclusión general del análisis…"
              className="w-full px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy resize-y leading-relaxed"
            />

            {tipoServicio === "RESIDUOS" && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-navy mb-1">
                  Monto máximo del certificado (solo higiene urbana)
                </label>
                <input
                  type="text"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="Ej: $ 3.055.591.137,06"
                  className="w-full px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
                />
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="rounded-2xl border border-line bg-paper p-5 flex flex-col gap-3">
            <h2 className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Acciones
            </h2>

            {/* Guardar borrador */}
            <button
              onClick={handleGuardar}
              disabled={saving}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-navy-2 text-navy-2 font-bold text-sm disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar borrador"}
            </button>

            {/* Generar nota (solo Dirección) */}
            {props.esDireccion && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-navy">
                  Número de nota ENCOSEP (requerido para generar)
                </label>
                <input
                  type="text"
                  value={notaNum}
                  onChange={(e) => setNotaNum(e.target.value)}
                  placeholder="Ej: 105/2026"
                  className="w-full px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
                />
                <button
                  onClick={handleGenerar}
                  disabled={generating || !notaNum.trim()}
                  className="w-full px-4 py-2.5 rounded-lg bg-svc-red text-white font-bold text-sm disabled:opacity-50"
                >
                  {generating ? "Generando nota Word…" : "Generar Nota ENCOSEP (.docx)"}
                </button>
                <p className="text-[11px] text-muted leading-tight">
                  Genera el Word de la nota de respuesta, lo sube al repositorio y marca el documento como <strong>Analizado</strong>.
                </p>
              </div>
            )}

            {feedback && (
              <p
                className={`text-sm font-medium ${
                  feedback.startsWith("Error") ? "text-red-600" : "text-green-700"
                }`}
              >
                {feedback}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
