"use client";

import { useActionState, useState, startTransition } from "react";
import { compararFacturas, type CompararState } from "./actions";
import { leerDocumento, type PasoLectura } from "@/lib/leer-documento";
import { pesos } from "@/lib/tarifas";
import type { ComparacionDosFacturas, MotivoVariacion } from "@/lib/factura-comparar";

const inicial: CompararState = { ok: false };

function mensajePaso(paso: PasoLectura | null): string | null {
  if (!paso) return null;
  if (paso.paso === "leyendo-pdf") return "Leyendo el PDF…";
  if (paso.paso === "convirtiendo-pdf")
    return "Este PDF es una imagen escaneada: convirtiéndolo para leerlo con reconocimiento óptico…";
  return `Leyendo con reconocimiento óptico… ${Math.round(paso.progreso * 100)}%`;
}

const MOTIVO_LABEL: Record<MotivoVariacion, string> = {
  consumo: "Consumo",
  tarifa: "Tarifa",
  ambos: "Tarifa + Consumo",
  impuesto: "Arrastre de base",
  sin_variacion: "Sin variación",
  no_comparable: "No comparable",
};

const MOTIVO_CLASE: Record<MotivoVariacion, string> = {
  consumo: "bg-amber-100 text-amber-700",
  tarifa: "bg-svc-blue/15 text-svc-blue",
  ambos: "bg-purple-100 text-purple-700",
  impuesto: "bg-pink-100 text-pink-700",
  sin_variacion: "bg-paper-2 text-muted",
  no_comparable: "bg-paper-2 text-muted italic",
};

function UploadSlot({
  label,
  nombreArchivo,
  ocrEstado,
  paso,
  onArchivo,
}: {
  label: string;
  nombreArchivo: string;
  ocrEstado: "idle" | "leyendo" | "listo" | "error";
  paso: PasoLectura | null;
  onArchivo: (file: File) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-muted">
        {label}
      </span>
      <label className="cursor-pointer flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong bg-paper-2 px-4 py-6 text-center hover:border-svc-red hover:bg-svc-red/5 transition">
        <span className="text-2xl" aria-hidden>
          🧾
        </span>
        <span className="text-sm font-bold text-navy">
          {nombreArchivo ? `✓ ${nombreArchivo}` : "Tocá acá para subir"}
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-bold">
          {nombreArchivo ? "Cambiar archivo" : "PDF, foto o captura"}
        </span>
        <input
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(ev) => {
            const f = ev.target.files?.[0];
            if (f) onArchivo(f);
          }}
        />
      </label>
      {ocrEstado === "leyendo" ? (
        <div className="text-xs text-navy">{mensajePaso(paso)}</div>
      ) : null}
      {ocrEstado === "listo" ? (
        <div className="text-xs text-svc-green font-semibold">✓ Leída</div>
      ) : null}
      {ocrEstado === "error" ? (
        <div className="text-xs text-svc-red">
          No se pudo leer. Probá con otra foto o con el PDF original.
        </div>
      ) : null}
    </div>
  );
}

export function CompararForm() {
  const [state, action, pending] = useActionState(compararFacturas, inicial);

  const [nombre1, setNombre1] = useState("");
  const [texto1, setTexto1] = useState("");
  const [estado1, setEstado1] = useState<"idle" | "leyendo" | "listo" | "error">("idle");
  const [paso1, setPaso1] = useState<PasoLectura | null>(null);

  const [nombre2, setNombre2] = useState("");
  const [texto2, setTexto2] = useState("");
  const [estado2, setEstado2] = useState<"idle" | "leyendo" | "listo" | "error">("idle");
  const [paso2, setPaso2] = useState<PasoLectura | null>(null);

  async function elegir(
    file: File,
    setNombre: (s: string) => void,
    setTexto: (s: string) => void,
    setEstado: (s: "idle" | "leyendo" | "listo" | "error") => void,
    setPaso: (p: PasoLectura | null) => void,
  ) {
    setNombre(file.name);
    setTexto("");
    setEstado("leyendo");
    setPaso(null);
    try {
      const texto = await leerDocumento(file, setPaso);
      setTexto(texto);
      setEstado("listo");
    } catch {
      setEstado("error");
    }
  }

  function enviar(manual?: Record<string, string>) {
    const fd = new FormData();
    fd.set("textoOcr1", texto1 || state.texto1 || "");
    fd.set("textoOcr2", texto2 || state.texto2 || "");
    if (manual) {
      for (const [k, v] of Object.entries(manual)) if (v) fd.set(k, v);
    }
    startTransition(() => {
      action(fd);
    });
  }

  const listoParaComparar = estado1 === "listo" && estado2 === "listo";

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-line bg-paper p-5 flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <UploadSlot
            label="Factura 1"
            nombreArchivo={nombre1}
            ocrEstado={estado1}
            paso={paso1}
            onArchivo={(f) => elegir(f, setNombre1, setTexto1, setEstado1, setPaso1)}
          />
          <UploadSlot
            label="Factura 2"
            nombreArchivo={nombre2}
            ocrEstado={estado2}
            paso={paso2}
            onArchivo={(f) => elegir(f, setNombre2, setTexto2, setEstado2, setPaso2)}
          />
        </div>
        <span className="text-[11px] text-muted">
          No importa el orden en que las subas: detectamos automáticamente
          cuál es la anterior y cuál la actual por el período de consumo de
          cada una. Subí el PDF que te llega por mail (lo más preciso) o una
          foto bien enfocada y con buena luz; puede tardar unos segundos por
          factura.
        </span>
        <button
          id="comparar-boton-comparar"
          type="button"
          onClick={() => enviar()}
          disabled={pending || !listoParaComparar}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-svc-red text-white font-bold text-sm shadow-md shadow-svc-red/30 hover:opacity-90 disabled:opacity-60 w-fit"
        >
          {pending ? "Comparando…" : "Comparar facturas"}
        </button>
      </div>

      {state.mensaje && !state.ok ? (
        <div className="rounded-xl border border-svc-red/40 bg-svc-red/10 p-4 text-sm text-navy">
          {state.mensaje}
        </div>
      ) : null}

      {!state.ok && (state.analisis1?.sinConsumo || state.analisis1?.sinAgua || state.analisis2?.sinConsumo || state.analisis2?.sinAgua) ? (
        <DatosManualesForm state={state} onEnviar={enviar} />
      ) : null}

      {state.ok && state.comparacion ? (
        <Resultado comparacion={state.comparacion} ordenDetectado={!!state.ordenDetectado} />
      ) : null}
    </div>
  );
}

function DatosManualesForm({
  state,
  onEnviar,
}: {
  state: CompararState;
  onEnviar: (manual: Record<string, string>) => void;
}) {
  const [kwh1, setKwh1] = useState("");
  const [agua1, setAgua1] = useState("");
  const [kwh2, setKwh2] = useState("");
  const [agua2, setAgua2] = useState("");

  const falta1 = state.analisis1?.sinConsumo || state.analisis1?.sinAgua;
  const falta2 = state.analisis2?.sinConsumo || state.analisis2?.sinAgua;
  const modoMedida1 = state.analisis1?.extraida.modoAgua === "MEDIDA";
  const modoMedida2 = state.analisis2?.extraida.modoAgua === "MEDIDA";

  function enviar() {
    onEnviar({
      consumoManual1: kwh1,
      m2Manual1: modoMedida1 ? "" : agua1,
      m3Manual1: modoMedida1 ? agua1 : "",
      consumoManual2: kwh2,
      m2Manual2: modoMedida2 ? "" : agua2,
      m3Manual2: modoMedida2 ? agua2 : "",
    });
  }

  const listo =
    (!state.analisis1?.sinConsumo || Number(kwh1.replace(",", ".")) > 0) &&
    (!state.analisis1?.sinAgua || Number(agua1.replace(",", ".")) > 0) &&
    (!state.analisis2?.sinConsumo || Number(kwh2.replace(",", ".")) > 0) &&
    (!state.analisis2?.sinAgua || Number(agua2.replace(",", ".")) > 0);

  return (
    <div className="rounded-2xl border-2 border-[#7e57c2]/40 bg-paper-2 p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 shrink-0 rounded-full overflow-hidden border-2 border-[#7e57c2]/50 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/imagenes/zorrito/zorrito-agachado.png"
            alt=""
            className="w-full h-full object-cover object-top"
          />
        </div>
        <div className="text-sm text-navy leading-relaxed">
          <span className="font-extrabold">Zorrito:</span> No pude leer bien
          algunos datos —pasa seguido con fotos o escaneos—, así que no
          comparé los conceptos que dependen de ellos.{" "}
          <b>Cargalos vos acá abajo</b> y sigo con la comparación.
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 pl-14">
        {falta1 ? (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Factura 1
            </span>
            {state.analisis1?.sinConsumo ? (
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-muted">kWh del período</span>
                <input type="number" inputMode="decimal" min={1} placeholder="kWh" value={kwh1} onChange={(e) => setKwh1(e.target.value)} className="w-32 rounded-lg border border-line-strong px-3 py-1.5 text-sm text-navy bg-paper" />
              </label>
            ) : null}
            {state.analisis1?.sinAgua ? (
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-muted">{modoMedida1 ? "m³ del período" : "Superficie cubierta (m²)"}</span>
                <input type="number" inputMode="decimal" min={1} placeholder={modoMedida1 ? "m³" : "m²"} value={agua1} onChange={(e) => setAgua1(e.target.value)} className="w-32 rounded-lg border border-line-strong px-3 py-1.5 text-sm text-navy bg-paper" />
              </label>
            ) : null}
          </div>
        ) : null}
        {falta2 ? (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Factura 2
            </span>
            {state.analisis2?.sinConsumo ? (
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-muted">kWh del período</span>
                <input type="number" inputMode="decimal" min={1} placeholder="kWh" value={kwh2} onChange={(e) => setKwh2(e.target.value)} className="w-32 rounded-lg border border-line-strong px-3 py-1.5 text-sm text-navy bg-paper" />
              </label>
            ) : null}
            {state.analisis2?.sinAgua ? (
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-muted">{modoMedida2 ? "m³ del período" : "Superficie cubierta (m²)"}</span>
                <input type="number" inputMode="decimal" min={1} placeholder={modoMedida2 ? "m³" : "m²"} value={agua2} onChange={(e) => setAgua2(e.target.value)} className="w-32 rounded-lg border border-line-strong px-3 py-1.5 text-sm text-navy bg-paper" />
              </label>
            ) : null}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={enviar}
        disabled={!listo}
        className="ml-14 inline-flex items-center px-4 py-1.5 rounded-lg bg-navy text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 w-fit"
      >
        Recalcular
      </button>
    </div>
  );
}

function Caja({ label, valor }: { label: string; valor: number | null }) {
  return (
    <div className="rounded-lg bg-paper border border-line px-3 py-2">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="font-bold text-navy tabular-nums">
        {valor != null ? pesos(valor) : "—"}
      </div>
    </div>
  );
}

/** Narración en lenguaje simple de lo que explica el aumento, para la
 *  burbuja del Zorrito arriba de los resultados. */
function narrarZorrito(c: ComparacionDosFacturas): string[] {
  const parrafos: string[] = [];

  if (c.variacionTotal == null || c.totalAnterior == null || c.totalActual == null) {
    return ["No tengo el total de las dos facturas para explicarte el aumento en números, pero podés ver el detalle en la tabla de abajo."];
  }

  const subioBajo = c.variacionTotal >= 0 ? "subió" : "bajó";
  parrafos.push(
    `Tu factura ${subioBajo} ${pesos(Math.abs(c.variacionTotal))} (${c.variacionPorc != null ? `${c.variacionPorc >= 0 ? "+" : ""}${c.variacionPorc.toFixed(1)}%` : "?"}): de ${pesos(c.totalAnterior)} a ${pesos(c.totalActual)}.`,
  );

  const partes: string[] = [];
  if (c.pctConsumo >= 5) {
    const kwhTxt =
      c.consumoAnteriorKwh != null && c.consumoActualKwh != null
        ? ` (de ${c.consumoAnteriorKwh} a ${c.consumoActualKwh} kWh)`
        : "";
    partes.push(`${c.pctConsumo.toFixed(0)}% es porque consumiste más${kwhTxt}`);
  }
  if (c.pctTarifa >= 5) {
    partes.push(`${c.pctTarifa.toFixed(0)}% es porque cambió la tarifa`);
  }
  if (c.pctImpuestos >= 5) {
    partes.push(`${c.pctImpuestos.toFixed(0)}% son impuestos y tasas que suben junto con la base`);
  }
  if (c.pctOtros >= 5) {
    partes.push(`${c.pctOtros.toFixed(0)}% no lo pude clasificar (subsidios u otros conceptos)`);
  }
  if (partes.length) {
    parrafos.push(`De eso: ${partes.join(", ")}.`);
  }

  if (c.mismoCuadro) {
    parrafos.push(
      `La tarifa de energía no cambió: las dos facturas están bajo el mismo cuadro tarifario (${c.cuadroAnteriorNombre}).`,
    );
  } else {
    parrafos.push(
      `Cambió el cuadro tarifario entre las dos facturas: ${c.cuadroAnteriorNombre} → ${c.cuadroActualNombre}.`,
    );
  }

  return parrafos;
}

function ZorritoExplica({ comparacion: c }: { comparacion: ComparacionDosFacturas }) {
  const parrafos = narrarZorrito(c);
  return (
    <div className="rounded-2xl border-2 border-[#7e57c2]/40 bg-paper-2 p-4 flex items-start gap-3">
      <div className="w-12 h-12 shrink-0 rounded-full overflow-hidden border-2 border-[#7e57c2]/50 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/imagenes/zorrito/zorrito-parado.png"
          alt=""
          className="w-full h-full object-cover object-top"
        />
      </div>
      <div className="text-sm text-navy leading-relaxed flex flex-col gap-1.5">
        <span className="font-extrabold">Zorrito te explica:</span>
        {parrafos.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}

function EscenarioMismoConsumo({ comparacion: c }: { comparacion: ComparacionDosFacturas }) {
  if (c.subtotalServiciosMismoConsumoTarifaActual == null || c.subtotalServiciosAnterior == null) return null;

  const dif = c.subtotalServiciosMismoConsumoTarifaActual - c.subtotalServiciosAnterior;
  const difSignificativa = Math.abs(dif) >= 1;

  return (
    <div className="rounded-2xl border border-svc-blue/40 bg-svc-blue/10 p-4">
      <div className="text-sm font-bold text-navy mb-1">
        ¿Qué hubiera pasado si consumías lo mismo?
      </div>
      <div className="text-sm text-navy leading-relaxed">
        Los servicios de energía y agua de tu factura anterior (sin
        impuestos), con tu mismo consumo
        {c.consumoAnteriorKwh != null ? ` (${c.consumoAnteriorKwh} kWh)` : ""}
        {" "}pero la tarifa de la factura actual, te habrían costado{" "}
        <b className="tabular-nums">{pesos(c.subtotalServiciosMismoConsumoTarifaActual)}</b>
        {" "}en vez de{" "}
        <b className="tabular-nums">{pesos(c.subtotalServiciosAnterior)}</b> que pagaste antes.
      </div>
      {difSignificativa ? (
        <div className="mt-2 text-xs text-muted">
          Es decir: {dif >= 0 ? "+" : ""}
          {pesos(dif)} es <b>solo por tarifa</b>, sin contar el consumo extra
          (no incluye impuestos, que se mueven aparte con la base gravada).
        </div>
      ) : (
        <div className="mt-2 text-xs text-muted">
          Casi no hay diferencia: la tarifa de energía y agua prácticamente
          no cambió entre las dos facturas.
        </div>
      )}
    </div>
  );
}

function Resultado({
  comparacion: c,
  ordenDetectado,
}: {
  comparacion: NonNullable<CompararState["comparacion"]>;
  ordenDetectado: boolean;
}) {
  if (!c.ok) {
    return (
      <div className="rounded-xl border border-svc-red/40 bg-svc-red/10 p-4 text-sm text-navy">
        {c.mensaje ?? "No pudimos comparar las dos facturas."}
      </div>
    );
  }

  const kwhVar =
    c.consumoAnteriorKwh && c.consumoActualKwh
      ? ((c.consumoActualKwh - c.consumoAnteriorKwh) / c.consumoAnteriorKwh) * 100
      : null;

  return (
    <div className="flex flex-col gap-5">
      {ordenDetectado && c.periodoAnterior && c.periodoActual ? (
        <div className="text-xs text-muted">
          Detectamos por el período de consumo que la factura de{" "}
          <b className="text-navy">{c.periodoAnterior}</b> es la anterior y la
          de <b className="text-navy">{c.periodoActual}</b> es la actual.
        </div>
      ) : null}

      <ZorritoExplica comparacion={c} />

      <div className="rounded-2xl border border-line bg-navy text-white p-5">
        <div className="text-xs font-bold uppercase tracking-widest opacity-70">
          Resumen
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm mt-2">
          <div>
            <div className="opacity-70 text-xs">Factura anterior · {c.cuadroAnteriorNombre}</div>
            <div className="font-bold text-lg">{c.totalAnterior != null ? pesos(c.totalAnterior) : "—"}</div>
          </div>
          <div>
            <div className="opacity-70 text-xs">Factura actual · {c.cuadroActualNombre}</div>
            <div className="font-bold text-lg">{c.totalActual != null ? pesos(c.totalActual) : "—"}</div>
          </div>
        </div>
        {c.variacionTotal != null ? (
          <div className={"mt-3 rounded-lg px-3 py-2 text-sm font-bold " + (c.variacionTotal >= 0 ? "bg-svc-red/20 text-svc-yellow" : "bg-svc-green/20 text-svc-green")}>
            {c.variacionTotal >= 0 ? "Aumento" : "Baja"}: {c.variacionTotal >= 0 ? "+" : ""}
            {pesos(c.variacionTotal)} ({c.variacionPorc != null ? `${c.variacionPorc >= 0 ? "+" : ""}${c.variacionPorc.toFixed(1)}%` : "—"})
          </div>
        ) : null}
        <div className="text-xs opacity-70 mt-2">
          Consumo: {c.consumoAnteriorKwh ?? "?"} kWh → {c.consumoActualKwh ?? "?"} kWh
          {kwhVar != null ? ` (${kwhVar >= 0 ? "+" : ""}${kwhVar.toFixed(1)}%)` : ""}
          {c.mismoCuadro ? " · mismo cuadro tarifario en ambas" : " · cambió el cuadro tarifario entre las dos"}
        </div>
      </div>

      <EscenarioMismoConsumo comparacion={c} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Caja label="Por consumo" valor={c.montoConsumo} />
        <Caja label="Por tarifa" valor={c.montoTarifa} />
        <Caja label="Impuestos (arrastre)" valor={c.montoImpuestos} />
        <Caja label="Otros / no itemizado" valor={c.montoOtros} />
      </div>

      <div className="rounded-2xl border border-line bg-paper p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
          Qué explica el aumento
        </div>
        <div className="h-6 rounded-md overflow-hidden flex bg-paper-2">
          {c.pctConsumo > 0 && <div className="bg-amber-400 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${c.pctConsumo}%` }}>{c.pctConsumo > 8 ? `${c.pctConsumo.toFixed(0)}%` : ""}</div>}
          {c.pctTarifa > 0 && <div className="bg-svc-blue flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${c.pctTarifa}%` }}>{c.pctTarifa > 8 ? `${c.pctTarifa.toFixed(0)}%` : ""}</div>}
          {c.pctImpuestos > 0 && <div className="bg-pink-500 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${c.pctImpuestos}%` }}>{c.pctImpuestos > 8 ? `${c.pctImpuestos.toFixed(0)}%` : ""}</div>}
          {c.pctOtros > 0 && <div className="bg-muted flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${c.pctOtros}%` }}>{c.pctOtros > 8 ? `${c.pctOtros.toFixed(0)}%` : ""}</div>}
        </div>
        <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-muted">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Consumo</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-svc-blue inline-block" /> Tarifa</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" /> Impuestos</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-muted inline-block" /> Otros / no itemizado</span>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-paper overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper-2 text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-2">Concepto</th>
              <th className="px-4 py-2 text-right">Anterior</th>
              <th className="px-4 py-2 text-right">Actual</th>
              <th className="px-4 py-2 text-right">Var.</th>
              <th className="px-4 py-2">Motivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {c.filas.map((f, i) => (
              <tr key={i}>
                <td className="px-4 py-2 text-navy align-top">
                  {f.concepto}
                  {f.detalle ? <div className="text-[11px] text-muted mt-0.5">{f.detalle}</div> : null}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-navy align-top">{f.anterior != null ? pesos(f.anterior) : "—"}</td>
                <td className="px-4 py-2 text-right tabular-nums text-navy align-top">{f.actual != null ? pesos(f.actual) : "—"}</td>
                <td className="px-4 py-2 text-right tabular-nums font-semibold text-navy align-top">
                  {f.diferencia != null ? `${f.diferencia >= 0 ? "+" : ""}${pesos(f.diferencia)}` : "—"}
                  {f.difPorc != null ? <div className="text-[11px] font-normal text-muted">{f.difPorc >= 0 ? "+" : ""}{f.difPorc.toFixed(1)}%</div> : null}
                </td>
                <td className="px-4 py-2 align-top">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${MOTIVO_CLASE[f.motivo]}`}>
                    {MOTIVO_LABEL[f.motivo]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-svc-yellow/50 bg-svc-yellow/10 p-4 text-sm text-navy leading-relaxed">
        Los impuestos (IVA, Ley I-26, ENRE) no tienen tarifa propia fija: se
        mueven junto con la base gravada, por eso se cuentan aparte de
        consumo y tarifa. &ldquo;Otros / no itemizado&rdquo; junta lo que no
        tiene un concepto propio en la factura (subsidios, redondeos). Este
        control es orientativo y no reemplaza la liquidación oficial de la
        prestadora.
      </div>
    </div>
  );
}
