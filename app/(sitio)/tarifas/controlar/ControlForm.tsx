"use client";

import Link from "next/link";
import { useActionState, useState, startTransition } from "react";
import { controlarFactura, type ControlState } from "./actions";
import type { Proyeccion } from "@/lib/factura-parse";
import { pesos } from "@/lib/tarifas";
import { GraficoComposicion } from "../GraficoComposicion";
import { abrirComprobante, donutComprobanteHTML } from "@/lib/comprobante";

const ESTADO_TXT: Record<string, string> = {
  VIGENTE: "Vigente",
  PEDIDO: "Aumento pedido",
  ANTERIOR: "Anterior",
  BORRADOR: "Borrador",
};

const inicial: ControlState = { ok: false };

export function ControlForm() {
  const [state, action, pending] = useActionState(controlarFactura, inicial);
  const [modo, setModo] = useState<"PDF" | "FOTO">("PDF");
  const [nombrePdf, setNombrePdf] = useState("");
  const [nombreFoto, setNombreFoto] = useState("");
  const [ocrTexto, setOcrTexto] = useState("");
  const [ocrEstado, setOcrEstado] = useState<"idle" | "leyendo" | "listo" | "error">(
    "idle",
  );
  const [progreso, setProgreso] = useState(0);

  async function correrOcr(file: File) {
    setOcrEstado("leyendo");
    setProgreso(0);
    setOcrTexto("");
    try {
      const T = await import("tesseract.js");
      const worker = await T.createWorker("spa", 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") setProgreso(m.progress);
        },
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();
      setOcrTexto(data.text ?? "");
      setOcrEstado("listo");
    } catch {
      setOcrEstado("error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Selector de modo */}
      <div className="inline-flex rounded-xl border border-line-strong overflow-hidden w-fit">
        {(["PDF", "FOTO"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setModo(m)}
            className={
              "px-4 py-2 text-sm font-bold " +
              (modo === m
                ? "bg-svc-red text-white"
                : "bg-paper text-navy hover:bg-paper-2")
            }
          >
            {m === "PDF" ? "📄 PDF" : "📷 Foto"}
          </button>
        ))}
      </div>

      <form
        action={action}
        className="rounded-2xl border border-line bg-paper p-5 flex flex-col gap-4"
      >
        <input type="hidden" name="textoOcr" value={modo === "FOTO" ? ocrTexto : ""} />

        {modo === "PDF" ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              PDF de tu factura SCPL
            </span>
            <label className="cursor-pointer flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong bg-paper-2 px-4 py-7 text-center hover:border-svc-red hover:bg-svc-red/5 transition">
              <span className="text-3xl" aria-hidden>
                📄
              </span>
              <span className="text-sm font-bold text-navy">
                {nombrePdf ? `✓ ${nombrePdf}` : "Tocá acá para elegir tu PDF"}
              </span>
              <span className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-navy text-white text-xs font-bold">
                {nombrePdf ? "Cambiar archivo" : "Seleccionar archivo"}
              </span>
              <input
                type="file"
                name="factura"
                accept="application/pdf"
                className="hidden"
                onChange={(ev) => setNombrePdf(ev.target.files?.[0]?.name ?? "")}
              />
            </label>
            <span className="text-[11px] text-muted">
              Usá el PDF original que te llega por mail. Es la opción más precisa.
            </span>
            {state.esEscaneado ? (
              <div className="rounded-lg border border-svc-yellow/50 bg-svc-yellow/10 p-3 flex flex-col gap-2">
                <div className="text-xs text-navy">
                  Este PDF parece ser una imagen escaneada (no trae texto): no
                  lo podemos leer automáticamente. Sacale una foto o una
                  captura de pantalla y usá la opción «Foto» — ahí sí lo
                  leemos con reconocimiento óptico.
                </div>
                <button
                  type="button"
                  onClick={() => setModo("FOTO")}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy text-white font-bold text-xs hover:opacity-90 w-fit"
                >
                  📷 Usar la opción Foto
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Foto de tu factura
            </span>
            <label className="cursor-pointer flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong bg-paper-2 px-4 py-7 text-center hover:border-svc-red hover:bg-svc-red/5 transition">
              <span className="text-3xl" aria-hidden>
                📷
              </span>
              <span className="text-sm font-bold text-navy">
                {nombreFoto
                  ? `✓ ${nombreFoto}`
                  : "Tocá acá para sacar o elegir una foto"}
              </span>
              <span className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-navy text-white text-xs font-bold">
                {nombreFoto ? "Cambiar foto" : "Cámara o galería"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  setNombreFoto(f?.name ?? "");
                  if (f) correrOcr(f);
                }}
              />
            </label>
            <span className="text-[11px] text-muted">
              Sacala derecha, con buena luz y enfocada. La lectura se hace en tu
              teléfono (gratis); puede tardar unos segundos.
            </span>
            {ocrEstado === "leyendo" ? (
              <div className="text-xs text-navy">
                Leyendo la foto… {Math.round(progreso * 100)}%
              </div>
            ) : null}
            {ocrEstado === "listo" ? (
              <div className="text-xs text-svc-green font-semibold">
                ✓ Foto leída. Ya podés controlar la factura.
              </div>
            ) : null}
            {ocrEstado === "error" ? (
              <div className="text-xs text-svc-red">
                No se pudo leer la foto. Probá con otra o usá el PDF.
              </div>
            ) : null}
          </div>
        )}

        <button
          type="submit"
          disabled={
            pending ||
            (modo === "PDF" && !nombrePdf) ||
            (modo === "FOTO" && ocrEstado !== "listo")
          }
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-svc-red text-white font-bold text-sm shadow-md shadow-svc-red/30 hover:opacity-90 disabled:opacity-60 w-fit"
        >
          {pending ? "Analizando…" : "Controlar factura"}
        </button>
      </form>

      {state.mensaje && !state.ok && !state.esEscaneado ? (
        <div className="rounded-xl border border-svc-red/40 bg-svc-red/10 p-4 text-sm text-navy">
          {state.mensaje}
        </div>
      ) : null}

      {state.ok && state.extraida ? (
        <Resultado state={state} action={action} />
      ) : null}
    </div>
  );
}

function fechaHoy() {
  return new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// Comprobante imprimible / guardable como PDF del control de factura.
function comprobanteControlHTML(state: ControlState): string {
  const e = state.extraida!;
  const filas = state.filas ?? [];
  const difTotal =
    state.totalFacturado != null && state.totalCuadro
      ? (state.totalFacturado - state.totalCuadro) / state.totalCuadro
      : null;

  const filasHTML = filas
    .map(
      (f) =>
        `<tr${f.alerta ? ' class="alerta"' : ""}><td>${f.concepto}${
          f.alerta ? ' <b class="rev">⚠ revisar</b>' : ""
        }${
          f.noComparable
            ? ' <span class="rev" style="color:#889">(no comparable)</span>'
            : ""
        }</td><td class="num">${
          f.facturado != null ? pesos(f.facturado) : "—"
        }</td><td class="num">${
          f.noComparable ? "—" : pesos(f.segunCuadro)
        }</td><td class="num">${
          f.difPorc == null
            ? "—"
            : `${f.difPorc >= 0 ? "+" : ""}${(f.difPorc * 100).toFixed(1)}%`
        }</td></tr>`,
    )
    .join("");

  const aguaTxt =
    e.modoAgua === "MEDIDA"
      ? `${e.m3Medido ?? "?"} m³ (medida)`
      : `${e.m2 ?? "?"} m² (estimada)`;

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Control de factura - Calculadora ENCOSEP</title>
<style>
  *{box-sizing:border-box} body{font-family:Segoe UI,Arial,sans-serif;color:#1a2b4a;margin:32px;font-size:13px}
  .head{display:flex;align-items:center;gap:14px;border-bottom:2px solid #1a2b4a;padding-bottom:12px;margin-bottom:16px}
  .head img{height:54px}
  .head h1{font-size:18px;margin:0} .head .sub{font-size:11px;color:#667}
  .datos{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin:12px 0 18px;font-size:12px}
  .datos b{color:#1a2b4a} .datos div{color:#445}
  table{width:100%;border-collapse:collapse} td,th{padding:5px 4px;border-bottom:1px solid #e7e9ef;vertical-align:top;text-align:left}
  th{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#889}
  td.num,th.num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
  tr.alerta{background:#fff7e6} .rev{color:#c0392b}
  .tot{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:14px 0}
  .box{border:1px solid #e7e9ef;border-radius:8px;padding:8px 12px} .box .l{font-size:10px;color:#889} .box .v{font-size:16px;font-weight:800}
  .chart{margin-top:16px;border:1px solid #e7e9ef;border-radius:8px;padding:12px 14px}
  .chart-t{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#889;font-weight:700;margin-bottom:8px}
  .chart-row{display:flex;align-items:center;gap:18px}
  .leyenda{display:flex;flex-direction:column;gap:3px;font-size:12px}
  .lg{display:flex;align-items:center;gap:6px} .dot{width:10px;height:10px;border-radius:2px;display:inline-block}
  .nota{margin-top:16px;font-size:10px;color:#889;line-height:1.5}
</style></head><body>
<div class="head">
  <img src="${location.origin}/encosep-logo.png" alt="ENCOSEP" onerror="this.style.display='none'">
  <div><h1>Calculadora ENCOSEP — Control de tu factura</h1>
  <div class="sub">Ente de Control de los Servicios Públicos · Comodoro Rivadavia · ${fechaHoy()}</div></div>
</div>
<div class="datos">
  <div><b>Categoría:</b> ${e.tipo}</div>
  <div><b>Período:</b> ${e.periodo ?? "—"}</div>
  <div><b>Consumo de luz:</b> ${e.consumoKwh ?? "?"} kWh</div>
  <div><b>Agua:</b> ${aguaTxt}</div>
  <div><b>Comparada con:</b> ${state.cuadroMatchNombre ?? "—"}</div>
  <div><b>Subsidio nacional:</b> ${e.conSubsidio ? "Sí" : "No"}</div>
</div>
<div class="tot">
  <div class="box"><div class="l">Total facturado</div><div class="v">${
    state.totalFacturado != null ? pesos(state.totalFacturado) : "—"
  }</div></div>
  <div class="box"><div class="l">Según el cuadro</div><div class="v">${
    state.totalCuadro != null ? pesos(state.totalCuadro) : "—"
  }</div></div>
  <div class="box"><div class="l">Diferencia</div><div class="v">${
    difTotal == null
      ? "—"
      : `${difTotal >= 0 ? "+" : ""}${(difTotal * 100).toFixed(1)}%`
  }</div></div>
</div>
<table><thead><tr><th>Concepto</th><th class="num">Te cobraron</th><th class="num">Según cuadro</th><th class="num">Dif.</th></tr></thead>
<tbody>${filasHTML}</tbody></table>
${state.composicion ? donutComprobanteHTML(state.composicion, "Composición de tu factura (según el cuadro)") : ""}
<div class="nota">Control orientativo. Las diferencias chicas (hasta ~3%) son normales por el prorrateo de los días del período y por adhesiones opcionales. No reemplaza la liquidación oficial de la prestadora.</div>
<script>window.onload=function(){setTimeout(function(){window.print()},200)}</script>
</body></html>`;
}

function Resultado({
  state,
  action,
}: {
  state: ControlState;
  action: (payload: FormData) => void;
}) {
  const e = state.extraida!;
  const filas = state.filas ?? [];
  const conAlerta = filas.filter((f) => f.alerta);
  const difTotal =
    state.totalFacturado != null && state.totalCuadro
      ? (state.totalFacturado - state.totalCuadro) / state.totalCuadro
      : null;

  return (
    <div className="flex flex-col gap-5">
      <div
        className={
          "rounded-2xl border p-5 " +
          (conAlerta.length
            ? "border-svc-yellow/60 bg-svc-yellow/10"
            : "border-svc-green/50 bg-svc-green/10")
        }
      >
        <div className="text-sm font-bold text-navy">
          {conAlerta.length
            ? `Encontramos ${conAlerta.length} concepto(s) para revisar`
            : "Tu factura coincide con el cuadro tarifario"}
        </div>
        <div className="text-xs text-muted mt-1">
          Comparada con: <b className="text-navy">{state.cuadroMatchNombre}</b>
          {e.periodo ? ` · período ${e.periodo}` : ""} · {e.consumoKwh ?? "?"} kWh
          {e.m2 ? ` · ${e.m2} m²` : ""}
        </div>
        <div className="mt-3 grid sm:grid-cols-3 gap-3 text-sm">
          <Caja label="Total facturado" valor={state.totalFacturado} />
          <Caja label="Según el cuadro" valor={state.totalCuadro} />
          <div className="rounded-lg bg-paper border border-line px-3 py-2">
            <div className="text-[11px] text-muted">Diferencia</div>
            <div
              className={
                "font-bold " +
                (difTotal != null && Math.abs(difTotal) > 0.03
                  ? "text-svc-red"
                  : "text-navy")
              }
            >
              {difTotal == null
                ? "—"
                : `${difTotal >= 0 ? "+" : ""}${(difTotal * 100).toFixed(1)}%`}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => abrirComprobante(comprobanteControlHTML(state))}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy text-white font-bold text-sm hover:opacity-90"
        >
          <span aria-hidden>🖨️</span> Imprimir
        </button>
        <button
          type="button"
          onClick={() => abrirComprobante(comprobanteControlHTML(state))}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-line-strong text-navy font-bold text-sm hover:bg-paper-2"
        >
          <span aria-hidden>💾</span> Guardar PDF
        </button>
        <span className="text-[11px] text-muted self-center">
          En «Guardar PDF», elegí <b>Guardar como PDF</b> en el destino de
          impresión.
        </span>
      </div>

      <div className="rounded-2xl border border-line bg-paper overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper-2 text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-2">Concepto</th>
              <th className="px-4 py-2 text-right">Te cobraron</th>
              <th className="px-4 py-2 text-right">Según cuadro</th>
              <th className="px-4 py-2 text-right">Dif.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filas.map((f, i) => (
              <tr key={i} className={f.alerta ? "bg-svc-yellow/10" : ""}>
                <td className="px-4 py-2 text-navy">
                  {f.concepto}
                  {f.alerta ? (
                    <span className="ml-2 text-svc-red font-bold">⚠ revisar</span>
                  ) : null}
                  {f.noComparable ? (
                    <span className="ml-2 text-muted font-normal">
                      (no comparable)
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-navy">
                  {f.facturado != null ? pesos(f.facturado) : "—"}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-muted">
                  {f.noComparable ? "—" : pesos(f.segunCuadro)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums font-semibold text-navy">
                  {f.difPorc == null
                    ? "—"
                    : `${f.difPorc >= 0 ? "+" : ""}${(f.difPorc * 100).toFixed(1)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {state.sinConsumo ? (
        <ConsumoManualForm state={state} action={action} />
      ) : null}

      {state.composicion ? (
        <GraficoComposicion composicion={state.composicion} />
      ) : null}

      {state.checks && state.checks.length ? (
        <div className="rounded-2xl border border-line bg-paper p-4 flex flex-col gap-2">
          <div className="text-xs font-bold uppercase tracking-wider text-muted">
            Controles
          </div>
          {state.checks.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-navy">
              <span>{c.ok ? "✅" : "⚠️"}</span>
              <span className="font-semibold">{c.label}:</span>
              <span className="text-muted">{c.detalle}</span>
            </div>
          ))}
        </div>
      ) : null}

      {state.proyecciones && state.proyecciones.length > 1 ? (
        <Proyecciones
          proyecciones={state.proyecciones}
          facturado={state.totalFacturado}
        />
      ) : null}

      <div className="rounded-2xl border border-svc-yellow/50 bg-svc-yellow/10 p-4 text-sm text-navy leading-relaxed">
        Las diferencias chicas (hasta ~3%) son normales por redondeos. Si ves un
        concepto marcado para revisar o una diferencia grande,{" "}
        <Link
          href="/reclamo/nuevo"
          className="font-bold underline underline-offset-2 text-svc-red"
        >
          hacé un reclamo
        </Link>{" "}
        adjuntando tu factura. Este control es orientativo y no reemplaza la
        liquidación oficial de la prestadora.
      </div>
    </div>
  );
}

function ConsumoManualForm({
  state,
  action,
}: {
  state: ControlState;
  action: (payload: FormData) => void;
}) {
  const [valor, setValor] = useState("");

  function enviar() {
    const kwh = Number(valor.replace(",", "."));
    if (!kwh || kwh <= 0 || !state.texto) return;
    const fd = new FormData();
    fd.set("textoOcr", state.texto);
    fd.set("consumoManual", String(kwh));
    startTransition(() => {
      action(fd);
    });
  }

  return (
    <div className="rounded-2xl border border-svc-yellow/50 bg-svc-yellow/10 p-4 flex flex-col gap-3">
      <div className="text-sm text-navy">
        <b>No pudimos leer tu consumo de luz (kWh)</b> de la factura —es
        frecuente en fotos o escaneos—, así que no comparamos el cargo fijo,
        el cargo variable, la compra de energía ni el alumbrado público.{" "}
        <b>¿Lo cargás vos?</b> Mirá el casillero «Total Consumo Activo» de tu
        factura.
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          min={1}
          placeholder="kWh del período"
          value={valor}
          onChange={(ev) => setValor(ev.target.value)}
          className="w-40 rounded-lg border border-line-strong px-3 py-1.5 text-sm text-navy bg-paper"
        />
        <button
          type="button"
          onClick={enviar}
          disabled={!valor}
          className="inline-flex items-center px-4 py-1.5 rounded-lg bg-navy text-white font-bold text-sm hover:opacity-90 disabled:opacity-50"
        >
          Recalcular con este consumo
        </button>
      </div>
    </div>
  );
}

function Proyecciones({
  proyecciones,
  facturado,
}: {
  proyecciones: Proyeccion[];
  facturado: number | null | undefined;
}) {
  // Orden: vigente, pedido, anterior, resto.
  const orden: Record<string, number> = { VIGENTE: 0, PEDIDO: 1, ANTERIOR: 2 };
  const lista = [...proyecciones].sort(
    (a, b) => (orden[a.estado ?? ""] ?? 9) - (orden[b.estado ?? ""] ?? 9),
  );
  return (
    <div className="rounded-2xl border border-line bg-paper overflow-hidden">
      <div className="px-5 py-3 border-b border-line">
        <div className="text-sm font-bold text-navy">
          Tu mismo consumo en cada cuadro
        </div>
        <div className="text-xs text-muted">
          Con los datos de tu factura, cuánto daría bajo cada cuadro tarifario.
        </div>
      </div>
      <div className="divide-y divide-line">
        {lista.map((p, i) => {
          const dif =
            facturado != null && facturado > 0
              ? (p.total - facturado) / facturado
              : null;
          return (
            <div key={i} className="px-5 py-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm font-semibold text-navy">
                  {p.nombre}
                  {p.esMatch ? (
                    <span className="ml-2 text-[11px] font-bold text-svc-green">
                      ← te facturaron con este
                    </span>
                  ) : null}
                </div>
                {p.estado ? (
                  <div className="text-[11px] text-muted">
                    {ESTADO_TXT[p.estado] ?? p.estado}
                  </div>
                ) : null}
              </div>
              <div className="text-right">
                <div className="font-bold text-navy tabular-nums">
                  {pesos(p.total)}
                </div>
                {dif != null && !p.esMatch ? (
                  <div
                    className={
                      "text-[11px] font-semibold tabular-nums " +
                      (dif >= 0 ? "text-svc-red" : "text-svc-green")
                    }
                  >
                    {dif >= 0 ? "+" : ""}
                    {(dif * 100).toFixed(1)}% vs tu factura
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Caja({ label, valor }: { label: string; valor: number | null | undefined }) {
  return (
    <div className="rounded-lg bg-paper border border-line px-3 py-2">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="font-bold text-navy tabular-nums">
        {valor != null ? pesos(valor) : "—"}
      </div>
    </div>
  );
}
