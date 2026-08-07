"use client";

import { useMemo, useState } from "react";
import {
  ELECTRODOMESTICOS,
  kwhMensual,
  type Electrodomestico,
} from "@/lib/electrodomesticos";
import { categoriaDe, categoriasOrdenadas, emojiDe } from "@/lib/electrodomesticos-meta";
import {
  TIPO_LABEL,
  pesos,
  tramoEnergiaPara,
  type CuadroTarifario,
  type TipoUsuario,
} from "@/lib/tarifas";
import { ZorritoTour } from "@/components/tour/ZorritoTour";

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

  const [items, setItems] = useState<Item[]>([]);
  const [tipo, setTipo] = useState<TipoUsuario>("RESIDENCIAL");
  const [busqueda, setBusqueda] = useState("");

  const tiposDisponibles = (Object.keys(TIPO_LABEL) as TipoUsuario[]).filter(
    (t) => vigente.energia[t]?.length,
  );

  const cantidadPorId = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const it of items) mapa.set(it.artefacto.id, (mapa.get(it.artefacto.id) ?? 0) + it.cantidad);
    return mapa;
  }, [items]);

  const artefactosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const lista = q
      ? ELECTRODOMESTICOS.filter((a) => a.nombre.toLowerCase().includes(q))
      : ELECTRODOMESTICOS;
    const grupos = new Map<string, { nombre: string; emoji: string; artefactos: Electrodomestico[] }>();
    for (const cat of categoriasOrdenadas()) {
      grupos.set(cat.id, { nombre: cat.nombre, emoji: cat.emoji, artefactos: [] });
    }
    for (const a of lista) {
      const cat = categoriaDe(a.nombre);
      grupos.get(cat.id)!.artefactos.push(a);
    }
    return [...grupos.values()].filter((g) => g.artefactos.length > 0);
  }, [busqueda]);

  // Tocar una tarjeta suma 1 unidad: si el artefacto ya está en la lista le
  // suma cantidad, si no lo agrega. Así se arma la lista "picando" en vez de
  // tener que abrir un select con 76 opciones.
  function sumarUno(artefacto: Electrodomestico) {
    setItems((prev) => {
      const existente = prev.find((it) => it.artefacto.id === artefacto.id);
      if (existente) {
        return prev.map((it) =>
          it.artefacto.id === artefacto.id ? { ...it, cantidad: it.cantidad + 1 } : it,
        );
      }
      return [
        ...prev,
        {
          key: `${artefacto.id}-${Date.now()}-${Math.random()}`,
          artefacto,
          cantidad: 1,
          horasPorDia: 1,
          diasPorSemana: 7,
        },
      ];
    });
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
        <div>
          <div className="text-sm font-bold text-navy">Tocá los artefactos que tenés</div>
          <div className="text-xs text-muted mt-0.5">
            Cada toque suma una unidad. Después ajustás horas y días de uso en la tabla de abajo.
          </div>
        </div>

        <input
          type="search"
          value={busqueda}
          onChange={(ev) => setBusqueda(ev.target.value)}
          placeholder="Buscar artefacto…"
          className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
        />

        <div id="electrodomesticos-tablero" className="flex flex-col gap-4 max-h-[28rem] overflow-y-auto pr-1">
          {artefactosFiltrados.map((grupo) => (
            <div key={grupo.nombre}>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
                {grupo.emoji} {grupo.nombre}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {grupo.artefactos.map((a) => {
                  const cant = cantidadPorId.get(a.id) ?? 0;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => sumarUno(a)}
                      className={`relative flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center shadow-sm hover:shadow-md transition active:scale-[0.97] ${
                        cant > 0
                          ? "border-svc-green bg-svc-green/10"
                          : "border-line bg-paper-2"
                      }`}
                    >
                      {cant > 0 && (
                        <span className="absolute -top-2 -right-2 min-w-[1.25rem] h-5 px-1 rounded-full bg-svc-green text-white text-[11px] font-bold flex items-center justify-center">
                          {cant}
                        </span>
                      )}
                      <div className="text-2xl leading-none" aria-hidden>
                        {emojiDe(a.nombre)}
                      </div>
                      <div className="text-[11px] text-navy leading-tight">{a.nombre}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {artefactosFiltrados.length === 0 && (
            <div className="text-sm text-muted py-4 text-center">
              No encontramos ningún artefacto con ese nombre.
            </div>
          )}
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
          Todavía no agregaste ningún artefacto. Tocá alguno del tablero de
          arriba para sumarlo.
        </div>
      )}

      <ZorritoTour
        storageKey="zorrito-tour-electrodomesticos-v1"
        pasos={[
          {
            pose: "energia",
            texto:
              "¡Hola! Soy el Zorrito de ENCOSEP 🦊. Te ayudo a estimar cuánto consume tu casa.",
          },
          {
            targetId: "electrodomesticos-tablero",
            pose: "energia",
            texto:
              "Tocá cada artefacto que tenés en casa: cada toque suma una unidad. Si tenés 3 lámparas iguales, tocás 3 veces.",
          },
        ]}
      />
    </div>
  );
}
