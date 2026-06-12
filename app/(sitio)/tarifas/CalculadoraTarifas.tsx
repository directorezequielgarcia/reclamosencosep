"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CUADROS,
  TIPO_LABEL,
  type CuadroTarifario,
  type EntradaCalculo,
  type GrupoLinea,
  type ResultadoCalculo,
  type TipoUsuario,
  calcularFactura,
  cuadroVigente,
  extrasIniciales,
  pesos,
} from "@/lib/tarifas";

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

export function CalculadoraTarifas() {
  const vigente = cuadroVigente();
  const [cuadroId, setCuadroId] = useState(vigente.id);
  const [compararId, setCompararId] = useState<string>("");

  const [tipo, setTipo] = useState<TipoUsuario>("RESIDENCIAL");
  const [kwh, setKwh] = useState(221);
  const [m2, setM2] = useState(60);
  const [tieneCloacas, setTieneCloacas] = useState(true);
  const [conSubsidio, setConSubsidio] = useState(true);
  const [mes, setMes] = useState(new Date().getMonth() + 1);

  const cuadro = CUADROS.find((c) => c.id === cuadroId) ?? vigente;
  const cuadroComparar = CUADROS.find((c) => c.id === compararId) ?? null;

  const [extras, setExtras] = useState<Record<string, boolean>>(
    extrasIniciales(vigente),
  );

  const entrada: EntradaCalculo = {
    tipo,
    kwh: Number(kwh) || 0,
    m2: Number(m2) || 0,
    tieneCloacas,
    conSubsidioEnergia: conSubsidio,
    mes,
    extras,
  };

  const resultado = useMemo(
    () => calcularFactura(cuadro, entrada),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cuadro, tipo, kwh, m2, tieneCloacas, conSubsidio, mes, extras],
  );

  const resultadoComparar = useMemo(
    () => (cuadroComparar ? calcularFactura(cuadroComparar, entrada) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cuadroComparar, tipo, kwh, m2, tieneCloacas, conSubsidio, mes, extras],
  );

  const opcionales = cuadro.conceptosExtra.filter((c) => c.opcional);

  return (
    <div className="grid lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-6 items-start">
      {/* ── Panel de datos ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-line bg-paper p-5 flex flex-col gap-4 lg:sticky lg:top-24">
        <div className="text-sm font-bold text-navy">Tus datos</div>

        <Campo label="Tipo de usuario">
          <select
            value={tipo}
            onChange={(ev) => setTipo(ev.target.value as TipoUsuario)}
            className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
          >
            {(Object.keys(TIPO_LABEL) as TipoUsuario[])
              .filter((t) => cuadro.energia[t] || t === "RESIDENCIAL")
              .map((t) => (
                <option key={t} value={t}>
                  {TIPO_LABEL[t]}
                </option>
              ))}
          </select>
        </Campo>

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

        <Campo
          label="Superficie cubierta (m²)"
          hint={`Define el consumo de agua estimado: ${cuadro.aguaFormula.baseM3} m³ + ${cuadro.aguaFormula.m3Por10m2} m³ cada 10 m².`}
        >
          <input
            type="number"
            min={0}
            value={m2}
            onChange={(ev) => setM2(ev.target.valueAsNumber || 0)}
            className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
          />
        </Campo>

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
              {CUADROS.map((c) => (
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
              disabled={CUADROS.length < 2}
              className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper disabled:opacity-50"
            >
              <option value="">— Sin comparación —</option>
              {CUADROS.filter((c) => c.id !== cuadroId).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            {CUADROS.length < 2 ? (
              <span className="text-[11px] text-muted">
                Se activa cuando el Ente cargue un segundo cuadro.
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

        <Desglose resultado={resultado} />

        <div className="rounded-2xl border border-svc-yellow/50 bg-svc-yellow/10 p-4 text-sm text-navy leading-relaxed">
          <div className="font-bold mb-1">¿La cuenta no te cierra?</div>
          Este es un cálculo <b>estimado para un mes completo</b> según el cuadro
          tarifario aprobado. Tu factura real puede variar por el prorrateo de los
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
            Ver cuadro tarifario aprobado (PDF) · {cuadro.expediente}
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
  const dif = comparar
    ? resultado.total - comparar.resultado.total
    : 0;
  const difPorc =
    comparar && comparar.resultado.total > 0
      ? (dif / comparar.resultado.total) * 100
      : 0;

  return (
    <div className="rounded-2xl border border-line bg-navy text-white p-5">
      <div className="text-xs font-bold uppercase tracking-widest opacity-70">
        Total estimado de tu factura
      </div>
      <div className="text-3xl sm:text-4xl font-extrabold mt-1">
        {pesos(resultado.total)}
      </div>
      <div className="text-xs opacity-70 mt-1">
        Según {cuadro.nombre} · vigente desde{" "}
        {new Date(cuadro.vigenteDesde + "T00:00:00").toLocaleDateString("es-AR")}
      </div>

      {comparar ? (
        <div className="mt-4 pt-4 border-t border-white/20 grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="opacity-70 text-xs">{comparar.cuadro.nombre}</div>
            <div className="font-bold text-lg">
              {pesos(comparar.resultado.total)}
            </div>
          </div>
          <div
            className={
              dif >= 0
                ? "text-svc-yellow font-bold"
                : "text-svc-green font-bold"
            }
          >
            <div className="opacity-90 text-xs">Variación</div>
            <div className="text-lg">
              {dif >= 0 ? "+" : ""}
              {pesos(dif)} ({difPorc >= 0 ? "+" : ""}
              {difPorc.toFixed(1)}%)
            </div>
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
