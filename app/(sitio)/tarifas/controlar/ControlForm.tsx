"use client";

import Link from "next/link";
import { useActionState, useState, startTransition } from "react";
import { controlarFactura, type ControlState } from "./actions";
import { leerFactura, type PasoLectura } from "./leerFactura";
import type { Proyeccion } from "@/lib/factura-parse";
import { ESTADO_TXT, pesos } from "@/lib/tarifas";
import { GraficoComposicion } from "../GraficoComposicion";
import { abrirComprobante, donutComprobanteHTML } from "@/lib/comprobante";

const inicial: ControlState = { ok: false };

function mensajePaso(paso: PasoLectura | null): string | null {
  if (!paso) return null;
  if (paso.paso === "leyendo-pdf") return "Leyendo el PDF…";
  if (paso.paso === "convirtiendo-pdf")
    return "Este PDF es una imagen escaneada: convirtiéndolo para leerlo con reconocimiento óptico…";
  return `Leyendo con reconocimiento óptico… ${Math.round(paso.progreso * 100)}%`;
}

export function ControlForm() {
  const [state, action, pending] = useActionState(controlarFactura, inicial);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [ocrTexto, setOcrTexto] = useState("");
  const [ocrEstado, setOcrEstado] = useState<"idle" | "leyendo" | "listo" | "error">(
    "idle",
  );
  const [paso, setPaso] = useState<PasoLectura | null>(null);

  async function elegirArchivo(file: File) {
    setNombreArchivo(file.name);
    setOcrTexto("");
    setOcrEstado("leyendo");
    setPaso(null);
    try {
      const texto = await leerFactura(file, setPaso);
      setOcrTexto(texto);
      setOcrEstado("listo");
    } catch {
      setOcrEstado("error");
    }
  }

  function enviar() {
    const fd = new FormData();
    fd.set("textoOcr", ocrTexto);
    startTransition(() => {
      action(fd);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-line bg-paper p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Tu factura de la SCPL
          </span>
          <label className="cursor-pointer flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong bg-paper-2 px-4 py-7 text-center hover:border-svc-red hover:bg-svc-red/5 transition">
            <span className="text-3xl" aria-hidden>
              🧾
            </span>
            <span className="text-sm font-bold text-navy">
              {nombreArchivo
                ? `✓ ${nombreArchivo}`
                : "Tocá acá para subir tu factura"}
            </span>
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-navy text-white text-xs font-bold">
              {nombreArchivo ? "Cambiar archivo" : "PDF, foto o captura"}
            </span>
            <input
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(ev) => {
                const f = ev.target.files?.[0];
                if (f) elegirArchivo(f);
              }}
            />
          </label>
          <span className="text-[11px] text-muted">
            Subí el PDF que te llega por mail (lo más preciso) o una foto bien
            enfocada y con buena luz. La lectura se hace en tu dispositivo
            (gratis); puede tardar unos segundos.
          </span>
          {ocrEstado === "leyendo" ? (
            <div className="text-xs text-navy">{mensajePaso(paso)}</div>
          ) : null}
          {ocrEstado === "listo" ? (
            <div className="text-xs text-svc-green font-semibold">
              ✓ Factura leída. Ya podés controlarla.
            </div>
          ) : null}
          {ocrEstado === "error" ? (
            <div className="text-xs text-svc-red">
              No se pudo leer el archivo. Probá con otra foto (más nítida) o
              con el PDF original.
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={enviar}
          disabled={pending || ocrEstado !== "listo"}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-svc-red text-white font-bold text-sm shadow-md shadow-svc-red/30 hover:opacity-90 disabled:opacity-60 w-fit"
        >
          {pending ? "Analizando…" : "Controlar factura"}
        </button>
      </div>

      {state.mensaje && !state.ok ? (
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

  // Cuánto daría tu mismo consumo bajo cada cuadro conocido (vigente, pedido,
  // anterior) — para ver de un vistazo si viene un aumento o cuánto subió.
  const ordenEstado: Record<string, number> = { VIGENTE: 0, PEDIDO: 1, ANTERIOR: 2 };
  const proyecciones = [...(state.proyecciones ?? [])].sort(
    (a, b) => (ordenEstado[a.estado ?? ""] ?? 9) - (ordenEstado[b.estado ?? ""] ?? 9),
  );
  const proyeccionesHTML =
    proyecciones.length > 1
      ? `<div class="chart" style="margin-top:14px">
<div class="chart-t">Tu mismo consumo en cada cuadro (estimación)</div>
<table><thead><tr><th>Cuadro</th><th class="num">Total</th><th class="num">Vs. tu factura</th></tr></thead>
<tbody>${proyecciones
          .map((p) => {
            const dif =
              state.totalFacturado != null && state.totalFacturado > 0
                ? (p.total - state.totalFacturado) / state.totalFacturado
                : null;
            const nombre = `${p.nombre}${p.estado ? ` (${ESTADO_TXT[p.estado] ?? p.estado})` : ""}${p.esMatch ? " ← te facturaron con este" : ""}`;
            return `<tr><td>${nombre}</td><td class="num">${pesos(p.total)}</td><td class="num">${
              dif == null || p.esMatch
                ? "—"
                : `${dif >= 0 ? "+" : ""}${(dif * 100).toFixed(1)}%`
            }</td></tr>`;
          })
          .join("")}</tbody></table>
</div>`
      : "";

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
  <div><b>Comparada con:</b> ${state.cuadroMatchNombre ?? "—"}${
    state.cuadroMatchEstado
      ? ` · ${ESTADO_TXT[state.cuadroMatchEstado] ?? state.cuadroMatchEstado}`
      : ""
  }</div>
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
${proyeccionesHTML}
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
          {state.cuadroMatchEstado ? (
            <span className="font-semibold text-svc-green">
              {" "}
              ({ESTADO_TXT[state.cuadroMatchEstado] ?? state.cuadroMatchEstado})
            </span>
          ) : null}
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

      {state.sinConsumo || state.sinAgua ? (
        <DatosManualesForm state={state} action={action} />
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

function DatosManualesForm({
  state,
  action,
}: {
  state: ControlState;
  action: (payload: FormData) => void;
}) {
  const [kwh, setKwh] = useState("");
  const [agua, setAgua] = useState("");
  const modoMedida = state.extraida?.modoAgua === "MEDIDA";

  function enviar() {
    if (!state.texto) return;
    const kwhNum = Number(kwh.replace(",", "."));
    const aguaNum = Number(agua.replace(",", "."));
    if ((state.sinConsumo && !(kwhNum > 0)) || (state.sinAgua && !(aguaNum > 0)))
      return;
    const fd = new FormData();
    fd.set("textoOcr", state.texto);
    if (kwhNum > 0) fd.set("consumoManual", String(kwhNum));
    if (aguaNum > 0) fd.set(modoMedida ? "m3Manual" : "m2Manual", String(aguaNum));
    startTransition(() => {
      action(fd);
    });
  }

  const listo =
    (!state.sinConsumo || Number(kwh.replace(",", ".")) > 0) &&
    (!state.sinAgua || Number(agua.replace(",", ".")) > 0);

  return (
    <div className="rounded-2xl border border-svc-yellow/50 bg-svc-yellow/10 p-4 flex flex-col gap-3">
      <div className="text-sm text-navy">
        <b>Necesitamos confirmar</b>{" "}
        {state.sinConsumo && state.sinAgua
          ? "tu consumo de luz y de agua"
          : state.sinConsumo
            ? "tu consumo de luz"
            : "tu consumo de agua"}{" "}
        —no pudimos leerlo de la factura, es frecuente en fotos o escaneos—,
        así que no comparamos los conceptos que dependen de ese dato.{" "}
        <b>¿Lo cargás vos?</b>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        {state.sinConsumo ? (
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-muted">
              kWh del período («Total Consumo Activo»)
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={1}
              placeholder="kWh"
              value={kwh}
              onChange={(ev) => setKwh(ev.target.value)}
              className="w-36 rounded-lg border border-line-strong px-3 py-1.5 text-sm text-navy bg-paper"
            />
          </label>
        ) : null}
        {state.sinAgua ? (
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-muted">
              {modoMedida
                ? "m³ del período («Total Consumo Medido»)"
                : "Superficie cubierta (m²)"}
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={1}
              placeholder={modoMedida ? "m³" : "m²"}
              value={agua}
              onChange={(ev) => setAgua(ev.target.value)}
              className="w-36 rounded-lg border border-line-strong px-3 py-1.5 text-sm text-navy bg-paper"
            />
          </label>
        ) : null}
        <button
          type="button"
          onClick={enviar}
          disabled={!listo}
          className="inline-flex items-center px-4 py-1.5 rounded-lg bg-navy text-white font-bold text-sm hover:opacity-90 disabled:opacity-50"
        >
          Recalcular
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
          Es una <b>estimación al mismo nivel de consumo</b> (el kWh de esta
          factura) — si comparás distintos meses, el monto de cada cuadro va a
          variar porque cambia el consumo, no el cuadro.
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
