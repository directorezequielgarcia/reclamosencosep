"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { controlarFactura, type ControlState } from "./actions";
import type { Proyeccion } from "@/lib/factura-parse";
import { pesos } from "@/lib/tarifas";

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
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              PDF de tu factura SCPL
            </span>
            <input type="file" name="factura" accept="application/pdf" className="text-sm" />
            <span className="text-[11px] text-muted">
              Usá el PDF original que te llega por mail. Es la opción más precisa.
            </span>
          </label>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Foto de tu factura
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(ev) => {
                const f = ev.target.files?.[0];
                if (f) correrOcr(f);
              }}
              className="text-sm"
            />
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
          disabled={pending || (modo === "FOTO" && ocrEstado !== "listo")}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-svc-red text-white font-bold text-sm shadow-md shadow-svc-red/30 hover:opacity-90 disabled:opacity-60 w-fit"
        >
          {pending ? "Analizando…" : "Controlar factura"}
        </button>
      </form>

      {state.mensaje && !state.ok ? (
        <div className="rounded-xl border border-svc-red/40 bg-svc-red/10 p-4 text-sm text-navy">
          {state.mensaje}
        </div>
      ) : null}

      {state.ok && state.extraida ? <Resultado state={state} /> : null}
    </div>
  );
}

function Resultado({ state }: { state: ControlState }) {
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
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-navy">
                  {f.facturado != null ? pesos(f.facturado) : "—"}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-muted">
                  {pesos(f.segunCuadro)}
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
