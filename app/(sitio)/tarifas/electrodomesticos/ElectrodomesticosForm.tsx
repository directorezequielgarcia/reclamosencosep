"use client";

import { useMemo, useState } from "react";
import {
  ELECTRODOMESTICOS,
  kwhMensual,
  type Electrodomestico,
} from "@/lib/electrodomesticos";
import {
  TIPO_LABEL,
  pesos,
  tramoEnergiaPara,
  type CuadroTarifario,
  type TipoUsuario,
} from "@/lib/tarifas";

type Item = {
  key: string;
  artefacto: Electrodomestico;
  cantidad: number;
  horasPorDia: number;
  diasPorSemana: number;
};

export function ElectrodomesticosForm({
  cuadros,
}: {
  cuadros: CuadroTarifario[];
}) {
  const vigente = cuadros.find((c) => c.estado === "VIGENTE") ?? cuadros[0];

  const [seleccionId, setSeleccionId] = useState(ELECTRODOMESTICOS[0].id);
  const [items, setItems] = useState<Item[]>([]);
  const [tipo, setTipo] = useState<TipoUsuario>("RESIDENCIAL");

  const tiposDisponibles = (Object.keys(TIPO_LABEL) as TipoUsuario[]).filter(
    (t) => vigente.energia[t]?.length,
  );

  function agregar() {
    const artefacto = ELECTRODOMESTICOS.find((a) => a.id === seleccionId);
    if (!artefacto) return;
    setItems((prev) => [
      ...prev,
      {
        key: `${artefacto.id}-${Date.now()}-${Math.random()}`,
        artefacto,
        cantidad: 1,
        horasPorDia: 1,
        diasPorSemana: 7,
      },
    ]);
  }

  function actualizar(key: string, cambios: Partial<Item>) {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, ...cambios } : it)),
    );
  }

  function quitar(key: string) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  const filas = useMemo(
    () =>
      items.map((it) => ({
        ...it,
        kwh: kwhMensual(it.artefacto, it.cantidad, it.horasPorDia, it.diasPorSemana),
      })),
    [items],
  );

  const totalKwh = filas.reduce((acc, f) => acc + f.kwh, 0);

  const tramos = vigente.energia[tipo] ?? vigente.energia.RESIDENCIAL ?? [];
  const tramo = tramos.length ? tramoEnergiaPara(tramos, totalKwh) : null;
  const precioPorKwh = tramo ? tramo.cgoVariable + tramo.energia : 0;
  const totalPesos = totalKwh * precioPorKwh;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-line bg-paper p-5 flex flex-col gap-4">
        <div className="text-sm font-bold text-navy">Agregar artefacto</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={seleccionId}
            onChange={(ev) => setSeleccionId(ev.target.value)}
            className="flex-1 rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
          >
            {ELECTRODOMESTICOS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={agregar}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-navy text-white font-bold text-sm hover:opacity-90"
          >
            + Agregar
          </button>
        </div>

        <label className="flex flex-col gap-1 max-w-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Categoría (para el precio)
          </span>
          <select
            value={tipo}
            onChange={(ev) => setTipo(ev.target.value as TipoUsuario)}
            className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
          >
            {tiposDisponibles.map((t) => (
              <option key={t} value={t}>
                {TIPO_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filas.length > 0 && (
        <div className="rounded-2xl border border-line bg-paper overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-2 text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="text-left px-4 py-2">Artefacto</th>
                  <th className="text-center px-2 py-2">Cuántos</th>
                  <th className="text-center px-2 py-2">Horas/día</th>
                  <th className="text-center px-2 py-2">Días/semana</th>
                  <th className="text-right px-4 py-2">kWh/mes</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filas.map((f) => (
                  <tr key={f.key}>
                    <td className="px-4 py-2 text-navy">{f.artefacto.nombre}</td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min={0}
                        value={f.cantidad}
                        onChange={(ev) =>
                          actualizar(f.key, {
                            cantidad: ev.target.valueAsNumber || 0,
                          })
                        }
                        className="w-16 rounded-lg border border-line-strong px-2 py-1 text-sm bg-paper text-center"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min={0}
                        max={24}
                        value={f.horasPorDia}
                        onChange={(ev) =>
                          actualizar(f.key, {
                            horasPorDia: ev.target.valueAsNumber || 0,
                          })
                        }
                        className="w-16 rounded-lg border border-line-strong px-2 py-1 text-sm bg-paper text-center"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min={0}
                        max={7}
                        value={f.diasPorSemana}
                        onChange={(ev) =>
                          actualizar(f.key, {
                            diasPorSemana: ev.target.valueAsNumber || 0,
                          })
                        }
                        className="w-16 rounded-lg border border-line-strong px-2 py-1 text-sm bg-paper text-center"
                      />
                    </td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums text-navy">
                      {f.kwh.toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => quitar(f.key)}
                        aria-label={`Quitar ${f.artefacto.nombre}`}
                        className="text-svc-red text-lg leading-none px-2"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filas.length > 0 && (
        <div className="rounded-2xl border border-line bg-navy text-white p-5">
          <div className="text-xs font-bold uppercase tracking-widest opacity-70">
            Consumo estimado de estos {filas.length} artefacto
            {filas.length === 1 ? "" : "s"}
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold mt-1">
            {totalKwh.toFixed(2)} kWh/mes
          </div>
          {tramo ? (
            <div className="text-xl font-bold mt-2 text-svc-yellow">
              ≈ {pesos(totalPesos)} / mes
            </div>
          ) : null}
          <div className="text-[11px] opacity-70 mt-3 leading-relaxed">
            Estimación con el cuadro {vigente.nombre}, categoría{" "}
            {TIPO_LABEL[tipo]}. Incluye solo el costo variable de energía
            (cargo variable + compra de energía) según la escala que
            corresponde a este consumo. No incluye cargo fijo, agua,
            cloacas, impuestos ni subsidios — para tu factura completa usá
            la{" "}
            <a href="/tarifas" className="underline underline-offset-2">
              Calculadora ENCOSEP
            </a>
            .
          </div>
        </div>
      )}

      {filas.length === 0 && (
        <div className="rounded-2xl border border-line bg-paper-2 p-5 text-sm text-muted">
          Todavía no agregaste ningún artefacto. Elegí uno de la lista de
          arriba y tocá «Agregar».
        </div>
      )}
    </div>
  );
}
