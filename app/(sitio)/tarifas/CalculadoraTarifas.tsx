"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GraficoComposicion } from "./GraficoComposicion";
import {
  TIPO_LABEL,
  type CuadroTarifario,
  type EntradaCalculo,
  type GrupoLinea,
  type ResultadoCalculo,
  type TipoUsuario,
  calcularFactura,
  extrasIniciales,
  pesos,
} from "@/lib/tarifas";
import { abrirComprobante, donutComprobanteHTML } from "@/lib/comprobante";

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const GRUPO_LABEL: Record<GrupoLinea, string> = {
  ENERGIA: "Energía eléctrica",
  AGUA: "Agua",
  CLOACAS: "Cloacas",
  IMPUESTOS: "Impuestos",
  OTROS: "Tasas y otros conceptos",
};

const GRUPO_ORDEN: GrupoLinea[] = [
  "ENERGIA",
  "AGUA",
  "CLOACAS",
  "IMPUESTOS",
  "OTROS",
];

function fechaHoy() {
  return new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Explica, según la categoría/mes/beneficio, qué parte del consumo subsidia
 *  el Estado Nacional. */
function textoSubsidio(
  cuadro: CuadroTarifario,
  tipo: TipoUsuario,
  mes: number,
  topeOverride?: number,
): string {
  if (tipo === "RESIDENCIAL") {
    const s = cuadro.subsidioEnergia;
    const base = s.mesesAlto.includes(mes)
      ? s.topeAlto
      : s.mesesBajo.includes(mes)
        ? s.topeBajo
        : s.topeAlto;
    const tope = topeOverride ?? base;
    return `Este mes el subsidio cubre hasta ${tope} kWh; el resto del consumo va sin subsidio.`;
  }
  const sn = cuadro.subsidioNoResidencial;
  if (!sn) return "Para esta categoría no hay subsidio nacional definido en el cuadro.";
  const precio =
    tipo === "ENTIDAD_SIN_FINES" ? sn.bienPublicoPorKwh : sn.precioPorKwh;
  return `Subsidio no residencial: -$${precio.toLocaleString(
    "es-AR",
  )} por kWh sobre todo el consumo.`;
}

function Campo({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
      {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}

export function CalculadoraTarifas({ cuadros }: { cuadros: CuadroTarifario[] }) {
  const vigente =
    cuadros.find((c) => c.estado === "VIGENTE") ?? cuadros[0];
  // Por defecto comparamos con un aumento pedido si lo hay; si no, con el
  // cuadro anterior (para mostrar el aumento que ya hubo).
  const comparativo =
    cuadros.find((c) => c.estado === "PEDIDO") ??
    cuadros.find((c) => c.estado === "ANTERIOR");

  const [cuadroId, setCuadroId] = useState(vigente.id);
  const [compararId, setCompararId] = useState<string>(comparativo?.id ?? "");

  const [tipo, setTipo] = useState<TipoUsuario>("RESIDENCIAL");
  const [beneficioId, setBeneficioId] = useState<string>("");
  const [potenciaKw, setPotenciaKw] = useState(10);
  const [kwh, setKwh] = useState(221);
  const [modoAgua, setModoAgua] = useState<"ESTIMADA" | "MEDIDA">("ESTIMADA");
  const [m2, setM2] = useState(60);
  const [m3Medido, setM3Medido] = useState(17);
  const [tieneCloacas, setTieneCloacas] = useState(true);
  const [conSubsidio, setConSubsidio] = useState(true);
  const [mes, setMes] = useState(new Date().getMonth() + 1);

  const cuadro = cuadros.find((c) => c.id === cuadroId) ?? vigente;
  const cuadroComparar = cuadros.find((c) => c.id === compararId) ?? null;

  const [extras, setExtras] = useState<Record<string, boolean>>(
    extrasIniciales(vigente),
  );

  // Tipos seleccionables = los que tienen tabla de energía en el cuadro, más
  // Gran usuario (que se calcula con su propia tarifa por kW, no por escala).
  const tiposDisponibles = (Object.keys(TIPO_LABEL) as TipoUsuario[]).filter(
    (t) =>
      cuadro.energia[t]?.length ||
      (t === "GRAN_USUARIO" && cuadro.granUsuario),
  );

  const entrada: EntradaCalculo = {
    tipo,
    kwh: Number(kwh) || 0,
    modoAgua,
    m2: Number(m2) || 0,
    m3Medido: Number(m3Medido) || 0,
    tieneCloacas,
    conSubsidioEnergia: conSubsidio,
    mes,
    extras,
    beneficioId: tipo === "RESIDENCIAL" ? beneficioId : "",
    potenciaKw: Number(potenciaKw) || 0,
  };

  const resultado = useMemo(
    () => calcularFactura(cuadro, entrada),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cuadro, tipo, beneficioId, potenciaKw, kwh, modoAgua, m2, m3Medido, tieneCloacas, conSubsidio, mes, extras],
  );

  const resultadoComparar = useMemo(
    () => (cuadroComparar ? calcularFactura(cuadroComparar, entrada) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cuadroComparar, tipo, beneficioId, potenciaKw, kwh, modoAgua, m2, m3Medido, tieneCloacas, conSubsidio, mes, extras],
  );

  const beneficios = cuadro.beneficiosResidencial ?? [];
  const beneficioSel = beneficios.find((b) => b.id === beneficioId) ?? null;

  const opcionales = cuadro.conceptosExtra.filter((c) => c.opcional);

  // Comprobante imprimible / guardable como PDF (ventana autocontenida).
  function comprobanteHTML(): string {
    const filas = GRUPO_ORDEN.flatMap((g) => {
      const ls = resultado.lineas.filter((l) => l.grupo === g);
      if (!ls.length) return [];
      return [
        `<tr><td colspan="2" class="grp">${GRUPO_LABEL[g]}</td></tr>`,
        ...ls.map(
          (l) =>
            `<tr><td>${l.concepto}${
              l.detalle ? `<div class="det">${l.detalle}</div>` : ""
            }</td><td class="num${l.monto < 0 ? " neg" : ""}">${pesos(
              l.monto,
            )}</td></tr>`,
        ),
      ];
    }).join("");

    const aguaTxt =
      modoAgua === "ESTIMADA"
        ? `${m2} m² (estimada)`
        : `${m3Medido} m³ (medida)`;

    const comp =
      cuadroComparar && resultadoComparar
        ? `<tr><td>${
            cuadroComparar.estado === "PEDIDO"
              ? "Si se aprueba el aumento pedido"
              : cuadroComparar.nombre
          }</td><td class="num">${pesos(resultadoComparar.total)}</td></tr>`
        : "";

    return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Factura estimada - Calculadora ENCOSEP</title>
<style>
  *{box-sizing:border-box} body{font-family:Segoe UI,Arial,sans-serif;color:#1a2b4a;margin:32px;font-size:13px}
  .head{display:flex;align-items:center;gap:14px;border-bottom:2px solid #1a2b4a;padding-bottom:12px;margin-bottom:16px}
  .head img{height:54px}
  .head h1{font-size:18px;margin:0} .head .sub{font-size:11px;color:#667}
  .datos{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin:12px 0 18px;font-size:12px}
  .datos b{color:#1a2b4a} .datos div{color:#445}
  table{width:100%;border-collapse:collapse} td{padding:5px 4px;border-bottom:1px solid #e7e9ef;vertical-align:top}
  td.num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums} td.neg{color:#0a7a3f}
  .grp{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#889;font-weight:700;border:0;padding-top:12px}
  .total{display:flex;justify-content:space-between;align-items:center;background:#1a2b4a;color:#fff;padding:12px 14px;border-radius:8px;margin-top:14px}
  .total .v{font-size:22px;font-weight:800}
  .comp{margin-top:10px;border:1px solid #e7e9ef;border-radius:8px;padding:8px 12px;font-size:12px}
  .nota{margin-top:16px;font-size:10px;color:#889;line-height:1.5}
  .chart{margin-top:16px;border:1px solid #e7e9ef;border-radius:8px;padding:12px 14px}
  .chart-t{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#889;font-weight:700;margin-bottom:8px}
  .chart-row{display:flex;align-items:center;gap:18px}
  .leyenda{display:flex;flex-direction:column;gap:3px;font-size:12px}
  .lg{display:flex;align-items:center;gap:6px} .dot{width:10px;height:10px;border-radius:2px;display:inline-block}
</style></head><body>
<div class="head">
  <img src="${location.origin}/encosep-logo.png" alt="ENCOSEP" onerror="this.style.display='none'">
  <div><h1>Calculadora ENCOSEP — Factura estimada</h1>
  <div class="sub">Ente de Control de los Servicios Públicos · Comodoro Rivadavia · ${fechaHoy()}</div></div>
</div>
<div class="datos">
  <div><b>Categoría:</b> ${TIPO_LABEL[tipo]}${
    tipo === "RESIDENCIAL" && beneficioSel ? ` · ${beneficioSel.label}` : ""
  }</div>
  <div><b>Consumo de luz:</b> ${entrada.kwh} kWh</div>
  ${
    tipo === "GRAN_USUARIO"
      ? `<div><b>Potencia contratada:</b> ${entrada.potenciaKw} kW</div>`
      : ""
  }
  <div><b>Agua:</b> ${aguaTxt}</div>
  <div><b>Cloacas:</b> ${tieneCloacas ? "Sí" : "No"}</div>
  <div><b>Subsidio nacional:</b> ${conSubsidio ? "Sí" : "No"}</div>
  <div><b>Mes:</b> ${MESES[mes - 1]}</div>
  <div><b>Cuadro:</b> ${cuadro.nombre}${
    cuadro.expediente ? ` (${cuadro.expediente})` : ""
  }</div>
</div>
<table><tbody>${filas}</tbody></table>
<div class="total"><div>Total estimado de tu factura</div><div class="v">${pesos(
      resultado.total,
    )}</div></div>
${comp ? `<div class="comp"><table><tbody>${comp}</tbody></table></div>` : ""}
${donutComprobanteHTML(resultado.composicion)}
<div class="nota">Cálculo estimado para un mes completo según el cuadro tarifario vigente. Tu factura real puede variar por el prorrateo de los días del período y por conceptos opcionales. No es un documento oficial de la prestadora.</div>
<script>window.onload=function(){setTimeout(function(){window.print()},200)}</script>
</body></html>`;
  }

  return (
    <div className="grid lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-6 items-start">
      {/* ── Panel de datos ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-line bg-paper p-5 flex flex-col gap-4 lg:sticky lg:top-24">
        <div className="text-sm font-bold text-navy">Tus datos</div>

        <Campo
          label="Tipo de usuario"
          hint={
            beneficioSel?.nota ??
            "Elegí tu categoría. Si sos residencial con beneficio (jubilado, electrodependiente, tarifa social o sin gas), está dentro del grupo Residencial."
          }
        >
          <select
            value={beneficioId ? `RESIDENCIAL:${beneficioId}` : tipo}
            onChange={(ev) => {
              const v = ev.target.value;
              if (v.startsWith("RESIDENCIAL:")) {
                setTipo("RESIDENCIAL");
                setBeneficioId(v.slice("RESIDENCIAL:".length));
              } else {
                setTipo(v as TipoUsuario);
                setBeneficioId("");
              }
            }}
            className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
          >
            <optgroup label="Residencial (hogares)">
              <option value="RESIDENCIAL">Residencial (sin beneficio)</option>
              {beneficios.map((b) => (
                <option key={b.id} value={`RESIDENCIAL:${b.id}`}>
                  {b.label}
                </option>
              ))}
              {tiposDisponibles.includes("ELECTROINTENSIVO") && (
                <option value="ELECTROINTENSIVO">
                  Electrointensivo (sin gas + calefacción eléctrica)
                </option>
              )}
            </optgroup>
            {tiposDisponibles.filter(
              (t) => t !== "RESIDENCIAL" && t !== "ELECTROINTENSIVO",
            ).length > 0 && (
              <optgroup label="Comercios, producción y entidades">
                {tiposDisponibles
                  .filter(
                    (t) => t !== "RESIDENCIAL" && t !== "ELECTROINTENSIVO",
                  )
                  .map((t) => (
                    <option key={t} value={t}>
                      {TIPO_LABEL[t]}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
        </Campo>

        {tipo === "GRAN_USUARIO" && (
          <Campo
            label="Potencia contratada (kW)"
            hint="Capacidad de suministro contratada. El cargo fijo del gran usuario se cobra por cada kW."
          >
            <input
              type="number"
              min={0}
              value={potenciaKw}
              onChange={(ev) => setPotenciaKw(ev.target.valueAsNumber || 0)}
              className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
            />
          </Campo>
        )}

        {tipo === "ELECTROINTENSIVO" && (
          <div className="rounded-lg bg-svc-yellow/10 border border-svc-yellow/40 px-3 py-2 text-[11px] text-navy leading-relaxed">
            Para hogares <b>sin gas de red</b> que calefaccionan con
            electricidad. La escala rige para las emisiones de junio a
            noviembre. Si además tenés el subsidio nacional ampliado, elegí
            “Sin acceso a gas”.
          </div>
        )}

        <Campo
          label="Consumo de luz (kWh)"
          hint="Lo encontrás en tu factura: 'Total Consumo Activo'."
        >
          <input
            type="number"
            min={0}
            value={kwh}
            onChange={(ev) => setKwh(ev.target.valueAsNumber || 0)}
            className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
          />
        </Campo>

        {/* Servicio de agua: estimada (por m²) o medida (por m³) */}
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Servicio de agua
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setModoAgua("ESTIMADA")}
              className={
                "rounded-lg border px-3 py-2 text-xs font-semibold transition " +
                (modoAgua === "ESTIMADA"
                  ? "border-svc-red bg-svc-red/10 text-svc-red"
                  : "border-line-strong text-navy hover:bg-paper-2")
              }
            >
              Estimada (por m²)
            </button>
            <button
              type="button"
              onClick={() => setModoAgua("MEDIDA")}
              className={
                "rounded-lg border px-3 py-2 text-xs font-semibold transition " +
                (modoAgua === "MEDIDA"
                  ? "border-svc-red bg-svc-red/10 text-svc-red"
                  : "border-line-strong text-navy hover:bg-paper-2")
              }
            >
              Medida (por m³)
            </button>
          </div>

          {modoAgua === "ESTIMADA" ? (
            <Campo
              label="Superficie cubierta (m²)"
              hint={`Consumo estimado: ${cuadro.aguaFormula.baseM3} m³ + ${cuadro.aguaFormula.m3Por10m2} m³ cada 10 m². Para casas sin medidor de agua.`}
            >
              <input
                type="number"
                min={0}
                value={m2}
                onChange={(ev) => setM2(ev.target.valueAsNumber || 0)}
                className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
              />
            </Campo>
          ) : (
            <Campo
              label="Consumo de agua medido (m³)"
              hint="El consumo en m³ que figura en tu factura (ej. el del mes anterior). Para usuarios con medidor de agua."
            >
              <input
                type="number"
                min={0}
                value={m3Medido}
                onChange={(ev) => setM3Medido(ev.target.valueAsNumber || 0)}
                placeholder="ej. 17"
                className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
              />
            </Campo>
          )}
        </div>

        <Campo label="Mes facturado" hint="Cambia el tope del subsidio nacional.">
          <select
            value={mes}
            onChange={(ev) => setMes(Number(ev.target.value))}
            className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
          >
            {MESES.map((m, i) => (
              <option key={m} value={i + 1}>
                {m[0].toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>
        </Campo>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-navy">
            <input
              type="checkbox"
              checked={tieneCloacas}
              onChange={(ev) => setTieneCloacas(ev.target.checked)}
              className="w-4 h-4 accent-svc-red"
            />
            ¿Tenés servicio de cloacas?
          </label>
          <label className="flex items-center gap-2 text-sm text-navy">
            <input
              type="checkbox"
              checked={conSubsidio}
              onChange={(ev) => setConSubsidio(ev.target.checked)}
              className="w-4 h-4 accent-svc-red"
            />
            ¿Tenés subsidio nacional a la energía?
          </label>
          {conSubsidio && (
            <span className="text-[11px] text-muted pl-6 -mt-1">
              {textoSubsidio(cuadro, tipo, mes, beneficioSel?.subsidioTopeKwh)}
            </span>
          )}
        </div>

        {opcionales.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-line pt-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Adhesiones opcionales
            </span>
            {opcionales.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-2 text-sm text-navy"
              >
                <input
                  type="checkbox"
                  checked={extras[c.id] ?? c.pordefecto}
                  onChange={(ev) =>
                    setExtras((s) => ({ ...s, [c.id]: ev.target.checked }))
                  }
                  className="w-4 h-4 accent-svc-red"
                />
                {c.label}
              </label>
            ))}
          </div>
        )}

        {/* Selector de cuadros */}
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <Campo label="Cuadro tarifario">
            <select
              value={cuadroId}
              onChange={(ev) => setCuadroId(ev.target.value)}
              className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
            >
              {cuadros.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Comparar con (opcional)">
            <select
              value={compararId}
              onChange={(ev) => setCompararId(ev.target.value)}
              disabled={cuadros.length < 2}
              className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper disabled:opacity-50"
            >
              <option value="">— Sin comparación —</option>
              {cuadros
                .filter((c) => c.id !== cuadroId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
            </select>
            {cuadros.length < 2 ? (
              <span className="text-[11px] text-muted">
                Se activa cuando el Ente cargue otro cuadro (ej. un aumento
                pedido).
              </span>
            ) : null}
          </Campo>
        </div>
      </div>

      {/* ── Resultado ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5">
        <ResumenTotal
          cuadro={cuadro}
          resultado={resultado}
          comparar={
            cuadroComparar && resultadoComparar
              ? { cuadro: cuadroComparar, resultado: resultadoComparar }
              : null
          }
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => abrirComprobante(comprobanteHTML())}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy text-white font-bold text-sm hover:opacity-90"
          >
            <span aria-hidden>🖨️</span> Imprimir
          </button>
          <button
            type="button"
            onClick={() => abrirComprobante(comprobanteHTML())}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-line-strong text-navy font-bold text-sm hover:bg-paper-2"
          >
            <span aria-hidden>💾</span> Guardar PDF
          </button>
          <span className="text-[11px] text-muted self-center">
            En «Guardar PDF», elegí <b>Guardar como PDF</b> en el destino de
            impresión.
          </span>
        </div>

        <GraficoComposicion composicion={resultado.composicion} />

        <Desglose resultado={resultado} />

        <div className="rounded-2xl border border-svc-yellow/50 bg-svc-yellow/10 p-4 text-sm text-navy leading-relaxed">
          <div className="font-bold mb-1">¿La cuenta no te cierra?</div>
          Este es un cálculo <b>estimado para un mes completo</b> según el cuadro
          tarifario vigente. Tu factura real puede variar por el prorrateo de los
          días del período y por conceptos opcionales. Si encontrás una diferencia
          importante,{" "}
          <Link
            href="/reclamo/nuevo"
            className="font-bold underline underline-offset-2 text-svc-red"
          >
            registrá un reclamo
          </Link>
          .
        </div>

        {cuadro.pdfUrl ? (
          <a
            href={cuadro.pdfUrl}
            target="_blank"
            rel="noopener"
            className="text-xs text-navy-2 underline underline-offset-4"
          >
            Ver cuadro tarifario (PDF) · {cuadro.expediente}
          </a>
        ) : null}
      </div>
    </div>
  );
}

function ResumenTotal({
  cuadro,
  resultado,
  comparar,
}: {
  cuadro: CuadroTarifario;
  resultado: ResultadoCalculo;
  comparar: { cuadro: CuadroTarifario; resultado: ResultadoCalculo } | null;
}) {
  // Ordenamos los dos cuadros por fecha: "antes" (más viejo) vs "ahora".
  let antes: { cuadro: CuadroTarifario; resultado: ResultadoCalculo } | null =
    null;
  let ahora = { cuadro, resultado };
  if (comparar) {
    const selMasViejo =
      (cuadro.vigenteDesde || "") <= (comparar.cuadro.vigenteDesde || "");
    antes = selMasViejo ? { cuadro, resultado } : comparar;
    ahora = selMasViejo ? comparar : { cuadro, resultado };
  }
  const esPedido = ahora.cuadro.estado === "PEDIDO";
  const dif = antes ? ahora.resultado.total - antes.resultado.total : 0;
  const difPorc =
    antes && antes.resultado.total > 0
      ? (dif / antes.resultado.total) * 100
      : 0;

  return (
    <div className="rounded-2xl border border-line bg-navy text-white p-5">
      <div className="text-xs font-bold uppercase tracking-widest opacity-70">
        Tu factura estimada con {cuadro.nombre}
      </div>
      <div className="text-3xl sm:text-4xl font-extrabold mt-1">
        {pesos(resultado.total)}
      </div>
      <div className="text-xs opacity-70 mt-1">
        {cuadro.vigenteDesde
          ? `Vigente desde ${new Date(
              cuadro.vigenteDesde + "T00:00:00",
            ).toLocaleDateString("es-AR")}`
          : ""}
      </div>

      {antes ? (
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="opacity-70 text-xs">Antes · {antes.cuadro.nombre}</div>
              <div className="font-bold text-lg">{pesos(antes.resultado.total)}</div>
            </div>
            <div>
              <div className="opacity-70 text-xs">
                {esPedido ? "Si se aprueba el pedido" : "Ahora"} · {ahora.cuadro.nombre}
              </div>
              <div className="font-bold text-lg">{pesos(ahora.resultado.total)}</div>
            </div>
          </div>
          <div
            className={
              "mt-3 rounded-lg px-3 py-2 text-sm font-bold " +
              (dif >= 0
                ? "bg-svc-red/20 text-svc-yellow"
                : "bg-svc-green/20 text-svc-green")
            }
          >
            {dif >= 0 ? "Aumento" : "Baja"}: {dif >= 0 ? "+" : ""}
            {pesos(dif)} ({difPorc >= 0 ? "+" : ""}
            {difPorc.toFixed(1)}%)
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Desglose({ resultado }: { resultado: ResultadoCalculo }) {
  return (
    <div className="rounded-2xl border border-line bg-paper overflow-hidden">
      <div className="px-5 py-3 border-b border-line text-sm font-bold text-navy">
        Detalle de conceptos
      </div>
      <div className="divide-y divide-line">
        {GRUPO_ORDEN.map((grupo) => {
          const lineas = resultado.lineas.filter((l) => l.grupo === grupo);
          if (!lineas.length) return null;
          return (
            <div key={grupo} className="px-5 py-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
                {GRUPO_LABEL[grupo]}
              </div>
              <div className="flex flex-col gap-1.5">
                {lineas.map((l, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-4 text-sm"
                  >
                    <div className="text-navy">
                      {l.concepto}
                      {l.detalle ? (
                        <div className="text-[11px] text-muted">{l.detalle}</div>
                      ) : null}
                    </div>
                    <div
                      className={
                        "font-semibold tabular-nums whitespace-nowrap " +
                        (l.monto < 0 ? "text-svc-green" : "text-navy")
                      }
                    >
                      {pesos(l.monto)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-5 py-3 border-t border-line-strong flex items-center justify-between">
        <div className="text-sm font-bold text-navy">Servicios (sin impuestos)</div>
        <div className="text-sm font-bold text-navy tabular-nums">
          {pesos(resultado.subtotalServicios)}
        </div>
      </div>
    </div>
  );
}
