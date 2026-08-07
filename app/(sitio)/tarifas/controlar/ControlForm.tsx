"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, startTransition } from "react";
import { controlarFactura, type ControlState } from "./actions";
import { leerDocumento, type PasoLectura } from "@/lib/leer-documento";
import type { FacturaExtraida, Proyeccion } from "@/lib/factura-parse";
import { ESTADO_TXT, TIPO_LABEL, pesos, type TipoUsuario } from "@/lib/tarifas";
import { GraficoComposicion } from "../GraficoComposicion";
import { abrirComprobante, donutComprobanteHTML } from "@/lib/comprobante";

const inicial: ControlState = { ok: false };

// Clave de sessionStorage donde se deja la factura + el análisis para que
// el wizard de "nuevo reclamo" los recupere sin pedirle a la persona que
// vuelva a subir el archivo, incluso si de por medio tiene que iniciar
// sesión (sessionStorage sobrevive la navegación por /ingresar).
const CLAVE_CONSULTA_CONTROL = "encosep_consulta_control";

function archivoADataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Campos de la factura que pertenecen a cada servicio, para adivinar sobre
// cuál es la consulta a partir de qué conceptos quedaron marcados para
// revisar (si no hay ninguno marcado, o hay de los dos, default a "agua").
const CAMPOS_ENERGIA = new Set(["cargoFijo", "cargoVariable", "compra", "alumbrado"]);
const CAMPOS_AGUA = new Set(["agua", "cloacas"]);

function inferirServicio(state: ControlState): "agua" | "energia" {
  const conAlerta = (state.filas ?? []).filter((f) => f.alerta && f.campo);
  let energia = 0;
  let agua = 0;
  for (const f of conAlerta) {
    if (f.campo && CAMPOS_ENERGIA.has(f.campo)) energia++;
    if (f.campo && CAMPOS_AGUA.has(f.campo)) agua++;
  }
  return energia > agua ? "energia" : "agua";
}

function construirResumenControl(state: ControlState): string {
  const e = state.extraida;
  const filas = state.filas ?? [];
  const conAlerta = filas.filter((f) => f.alerta);
  const difTotal =
    state.totalFacturado != null && state.totalCuadro
      ? (state.totalFacturado - state.totalCuadro) / state.totalCuadro
      : null;

  const partes: string[] = ["Control automático de mi factura de la SCPL:"];
  if (e?.periodo) partes.push(`Período: ${e.periodo}.`);
  if (state.totalFacturado != null)
    partes.push(`Total facturado: ${pesos(state.totalFacturado)}.`);
  if (state.totalCuadro != null)
    partes.push(`Según el cuadro vigente: ${pesos(state.totalCuadro)}.`);
  if (difTotal != null)
    partes.push(
      `Diferencia: ${difTotal >= 0 ? "+" : ""}${(difTotal * 100).toFixed(1)}%.`,
    );
  if (conAlerta.length) {
    partes.push(
      `Conceptos marcados para revisar: ${conAlerta.map((f) => f.concepto).join(", ")}.`,
    );
  }
  partes.push(
    "Quisiera que revisen esto y me digan si corresponde hacer un reclamo formal.",
  );
  return partes.join(" ");
}

function mensajePaso(paso: PasoLectura | null): string | null {
  if (!paso) return null;
  if (paso.paso === "leyendo-pdf") return "Leyendo el PDF…";
  if (paso.paso === "convirtiendo-pdf")
    return "Este PDF es una imagen escaneada: convirtiéndolo para leerlo con reconocimiento óptico…";
  return `Leyendo con reconocimiento óptico… ${Math.round(paso.progreso * 100)}%`;
}

export function ControlForm({ estaLogueado }: { estaLogueado: boolean }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(controlarFactura, inicial);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [ocrTexto, setOcrTexto] = useState("");
  const [ocrEstado, setOcrEstado] = useState<"idle" | "leyendo" | "listo" | "error">(
    "idle",
  );
  const [paso, setPaso] = useState<PasoLectura | null>(null);
  const [enviandoConsulta, setEnviandoConsulta] = useState(false);
  // Correcciones a mano acumuladas (consumo/agua y montos de conceptos mal
  // leídos por el OCR): se guardan acá, no en los sub-componentes, para que
  // cada "Recalcular" reenvíe TODAS las correcciones ya hechas, no solo la
  // última.
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  async function elegirArchivo(file: File) {
    setArchivo(file);
    setNombreArchivo(file.name);
    setOcrTexto("");
    setOcrEstado("leyendo");
    setPaso(null);
    setOverrides({});
    try {
      const texto = await leerDocumento(file, setPaso);
      setOcrTexto(texto);
      setOcrEstado("listo");
    } catch {
      setOcrEstado("error");
    }
  }

  // Deja la factura ya leída + el resumen del control en sessionStorage y
  // manda a hacer un reclamo/consulta — así la persona no tiene que volver
  // a subir el archivo, ni siquiera si de paso tiene que iniciar sesión.
  async function irAConsultar() {
    setEnviandoConsulta(true);
    try {
      const resumen = construirResumenControl(state);
      const payload: Record<string, string> = {
        resumen,
        svc: inferirServicio(state),
      };
      if (archivo) {
        payload.fotoDataUrl = await archivoADataUrl(archivo);
        payload.fotoNombre = archivo.name;
        payload.fotoTipo = archivo.type;
      }
      sessionStorage.setItem(CLAVE_CONSULTA_CONTROL, JSON.stringify(payload));
      const destino = "/reclamo/nuevo?consulta=control";
      router.push(
        estaLogueado
          ? destino
          : `/ingresar?callbackUrl=${encodeURIComponent(destino)}`,
      );
    } finally {
      setEnviandoConsulta(false);
    }
  }

  function enviarConOverrides(nuevos?: Record<string, string>) {
    const combinados = nuevos ? { ...overrides, ...nuevos } : overrides;
    if (nuevos) setOverrides(combinados);
    const fd = new FormData();
    fd.set("textoOcr", ocrTexto);
    for (const [k, v] of Object.entries(combinados)) if (v) fd.set(k, v);
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
          <label
            id="controlar-subir-archivo"
            className="cursor-pointer flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong bg-paper-2 px-4 py-7 text-center hover:border-svc-red hover:bg-svc-red/5 transition"
          >
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
          id="controlar-boton-controlar"
          type="button"
          onClick={() => enviarConOverrides()}
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
        <Resultado
          state={state}
          onRecalcular={enviarConOverrides}
          onConsultar={irAConsultar}
          consultando={enviandoConsulta}
        />
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
  onRecalcular,
  onConsultar,
  consultando,
}: {
  state: ControlState;
  onRecalcular: (overrides?: Record<string, string>) => void;
  onConsultar: () => void;
  consultando: boolean;
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
                  {f.alerta && f.campo ? (
                    <CorregirMonto
                      campo={f.campo}
                      valorActual={f.facturado}
                      onEnviar={onRecalcular}
                    />
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

      {state.sinConsumo || state.sinAgua || state.sinCategoria ? (
        <DatosManualesForm state={state} onEnviar={onRecalcular} />
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

      <div className="rounded-2xl border-2 border-svc-yellow/60 bg-svc-yellow/10 p-4 text-sm text-navy leading-relaxed flex flex-col gap-2">
        <div className="font-bold">
          ⚠️ Antes de reclamar: fijate si leímos bien tu factura
        </div>
        <p>
          Revisá los <b>metros cuadrados</b>, el <b>agua estimada</b> y el{" "}
          <b>consumo en kWh</b> de arriba. Si algo está mal leído, podés{" "}
          <b>corregirlo vos</b> —en la fila marcada «⚠ revisar» o completando
          los datos a mano— y volver a controlar antes de seguir.
        </p>
      </div>

      <div className="rounded-2xl border border-svc-yellow/50 bg-svc-yellow/10 p-4 text-sm text-navy leading-relaxed flex flex-col gap-3">
        <p>
          Las diferencias chicas (hasta ~3%) son normales por redondeos. Este
          control es orientativo y no reemplaza la liquidación oficial de la
          prestadora.
        </p>
        <div>
          <button
            type="button"
            onClick={onConsultar}
            disabled={consultando}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-svc-red text-white font-bold text-sm shadow-md shadow-svc-red/30 hover:opacity-90 disabled:opacity-60"
          >
            {consultando ? "Preparando…" : "Quiero consultar sobre el control →"}
          </button>
          <p className="text-xs text-muted mt-1.5">
            Ya con tu factura y este análisis cargados: si no estás logueado
            te pedimos iniciar sesión, y después solo confirmás la ubicación
            para registrar la consulta.
          </p>
        </div>
      </div>
    </div>
  );
}

function DatosManualesForm({
  state,
  onEnviar,
}: {
  state: ControlState;
  onEnviar: (overrides: Record<string, string>) => void;
}) {
  const [kwh, setKwh] = useState("");
  const [agua, setAgua] = useState("");
  const [tipo, setTipo] = useState<TipoUsuario | "">("");
  const modoMedida = state.extraida?.modoAgua === "MEDIDA";

  function enviar() {
    const kwhNum = Number(kwh.replace(",", "."));
    const aguaNum = Number(agua.replace(",", "."));
    if (
      (state.sinConsumo && !(kwhNum > 0)) ||
      (state.sinAgua && !(aguaNum > 0)) ||
      (state.sinCategoria && !tipo)
    )
      return;
    const nuevos: Record<string, string> = {};
    if (kwhNum > 0) nuevos.consumoManual = String(kwhNum);
    if (aguaNum > 0) nuevos[modoMedida ? "m3Manual" : "m2Manual"] = String(aguaNum);
    if (tipo) nuevos.tipoManual = tipo;
    onEnviar(nuevos);
  }

  const listo =
    (!state.sinConsumo || Number(kwh.replace(",", ".")) > 0) &&
    (!state.sinAgua || Number(agua.replace(",", ".")) > 0) &&
    (!state.sinCategoria || !!tipo);

  const partesFaltantes = [
    state.sinCategoria ? "tu categoría" : null,
    state.sinConsumo ? "tu consumo de luz" : null,
    state.sinAgua ? "tu dato de agua" : null,
  ].filter((s): s is string => s != null);
  const faltante =
    partesFaltantes.length > 1
      ? partesFaltantes.slice(0, -1).join(", ") + " y " + partesFaltantes[partesFaltantes.length - 1]
      : partesFaltantes[0];

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
          <span className="font-extrabold">Zorrito:</span> No pude leer bien{" "}
          <b>{faltante}</b> en tu factura —pasa seguido con fotos o
          escaneos—, así que no comparé los conceptos que dependen de ese
          dato. <b>Cargalo vos acá abajo</b> y sigo con el control.
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3 pl-14">
        {state.sinCategoria ? (
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-muted">Categoría de usuario</span>
            <select
              value={tipo}
              onChange={(ev) => setTipo(ev.target.value as TipoUsuario)}
              className="w-48 rounded-lg border border-line-strong px-3 py-1.5 text-sm text-navy bg-paper"
            >
              <option value="">Elegí una…</option>
              {(Object.keys(TIPO_LABEL) as TipoUsuario[]).map((t) => (
                <option key={t} value={t}>
                  {TIPO_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
        ) : null}
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

// Corrección puntual de un monto que el OCR leyó mal (ej. pegó dos números
// juntos): aparece solo en filas marcadas "⚠ revisar" que tienen un campo
// propio de `conceptos` al que se le puede pisar el valor.
function CorregirMonto({
  campo,
  valorActual,
  onEnviar,
}: {
  campo: keyof FacturaExtraida["conceptos"];
  valorActual: number | null;
  onEnviar: (overrides: Record<string, string>) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [valor, setValor] = useState(valorActual != null ? String(valorActual) : "");

  if (!abierto) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="text-[11px] text-svc-blue underline underline-offset-2 font-semibold"
        >
          ¿Está mal el monto? Corregilo
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-1">
      <input
        type="number"
        inputMode="decimal"
        step="0.01"
        min={0}
        value={valor}
        onChange={(ev) => setValor(ev.target.value)}
        placeholder="Monto correcto"
        className="w-32 rounded-lg border border-line-strong px-2 py-1 text-xs text-navy bg-paper"
      />
      <button
        type="button"
        onClick={() => {
          const n = Number(valor.replace(",", "."));
          if (!(n > 0)) return;
          onEnviar({ [`concepto_${campo}`]: String(n) });
          setAbierto(false);
        }}
        className="px-2.5 py-1 rounded-lg bg-navy text-white text-[11px] font-bold hover:opacity-90"
      >
        Recalcular
      </button>
      <button
        type="button"
        onClick={() => setAbierto(false)}
        className="text-[11px] text-muted underline underline-offset-2"
      >
        Cancelar
      </button>
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
