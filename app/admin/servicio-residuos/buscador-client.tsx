"use client";

import { useMemo, useState, useTransition } from "react";
import { BuscadorBarrio } from "@/components/ui/BuscadorBarrio";
import {
  buscarRecoleccionPorBarrio,
  buscarBarridoPorCalleOBarrio,
  horarioRecoleccion,
  horarioBarrido,
  SERVICIOS_ADICIONALES,
  type NucleoRecoleccion,
  type RecorridoBarrido,
} from "@/lib/servicios-por-barrio";
import { resolverDireccion, type RecorridoCercano } from "./actions";

export function BuscadorServicioResiduos() {
  const [barrio, setBarrio] = useState("");
  const [calle, setCalle] = useState("");
  const [copiado, setCopiado] = useState(false);

  const [direccion, setDireccion] = useState("");
  const [barrioResuelto, setBarrioResuelto] = useState<string | null>(null);
  const [barrioAproximado, setBarrioAproximado] = useState(false);
  const [recorridosCercanos, setRecorridosCercanos] = useState<RecorridoCercano[]>([]);
  const [errorDireccion, setErrorDireccion] = useState<string | null>(null);
  const [buscando, startTransition] = useTransition();

  const nucleos = useMemo(() => buscarRecoleccionPorBarrio(barrio), [barrio]);
  const recorridos = useMemo(
    () => buscarBarridoPorCalleOBarrio(calle),
    [calle],
  );

  function buscarPorDireccion() {
    if (!direccion.trim()) return;
    setErrorDireccion(null);
    startTransition(async () => {
      try {
        const r = await resolverDireccion(direccion.trim());
        setBarrioResuelto(r.barrioResuelto);
        setBarrioAproximado(r.barrioAproximado);
        setRecorridosCercanos(r.recorridosCercanos);
        if (r.barrioResuelto) setBarrio(r.barrioResuelto);
        if (!r.barrioResuelto) {
          setErrorDireccion(
            "No pude ubicar esa dirección en el mapa de barrios. Probá escribirla distinto (ej. \"Rivadavia 100\") o buscá manualmente por barrio/calle abajo.",
          );
        }
      } catch {
        setErrorDireccion(
          "Falló la búsqueda por dirección (puede ser un problema momentáneo del servicio de mapas). Probá de nuevo o usá la búsqueda manual abajo.",
        );
      }
    });
  }

  const respuesta = useMemo(
    () =>
      armarRespuesta(
        barrio,
        nucleos,
        calle,
        recorridos,
        barrioResuelto ? recorridosCercanos : [],
      ),
    [barrio, nucleos, calle, recorridos, barrioResuelto, recorridosCercanos],
  );

  async function copiar() {
    if (!respuesta) return;
    try {
      await navigator.clipboard.writeText(respuesta);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // portapapeles no disponible (http sin permiso, etc.) — no rompemos la UI
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card titulo="¿Qué podés hacer acá?">
        <ul className="text-sm text-navy flex flex-col gap-2 leading-relaxed">
          <li>
            <b>🗑️ Buscá por barrio</b> para saber qué día pasa el camión de
            residuos domiciliarios y en qué turno (izquierda).
          </li>
          <li>
            <b>🧹 Buscá por calle</b> para saber si esa calle está en el
            circuito de barrido y qué día le corresponde (derecha) — el
            barrido se organiza por calle pavimentada, no por barrio entero.
          </li>
          <li>
            <b>📋 Copiá la respuesta</b> lista para repetirle al vecino por
            teléfono o pegarla en el reclamo, con el botón &ldquo;Copiar&rdquo;.
          </li>
          <li>
            <b>🧭 Más abajo</b> hay una referencia rápida de otros servicios
            del contrato (baldíos, basurales clandestinos, chatarra, playas
            en verano, mascotas muertas) para cuando el reclamo no es de
            recolección ni barrido.
          </li>
        </ul>
      </Card>

      <Card titulo="📍 Buscar por dirección exacta (recomendado)">
        <p className="text-xs text-muted mb-2">
          Escribí calle y altura (ej. &ldquo;Rivadavia 100&rdquo;) — ubica el
          punto en el mapa y resuelve el barrio automáticamente, en vez de
          tener que adivinar entre varios resultados de una misma avenida.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscarPorDireccion()}
            placeholder="Rivadavia 100"
            className="flex-1 px-3 py-3 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
          />
          <button
            type="button"
            onClick={buscarPorDireccion}
            disabled={buscando || !direccion.trim()}
            className="px-4 py-3 rounded-xl bg-navy text-white text-sm font-semibold disabled:opacity-50"
          >
            {buscando ? "Buscando…" : "Buscar"}
          </button>
        </div>
        {errorDireccion && <div className="mt-3"><Aviso>{errorDireccion}</Aviso></div>}
        {barrioResuelto && (
          <div className="mt-3 rounded-xl border border-navy-2/30 bg-navy/5 p-3">
            <p className="text-sm text-navy">
              📍 Esa dirección cae en el barrio{" "}
              <b>{barrioResuelto}</b>
              {barrioAproximado
                ? " (no cayó justo dentro del límite oficial de ningún barrio — te muestro el más cercano, verificalo)."
                : " (límite oficial municipal)."}
            </p>
            {recorridosCercanos.length > 0 && (
              <div className="mt-2 flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Recorridos de barrido más cercanos
                </span>
                {recorridosCercanos.map((rc, i) => (
                  <ResultadoRecorrido
                    key={i}
                    recorrido={rc.recorrido}
                    distanciaKm={rc.distanciaKm}
                  />
                ))}
                <p className="text-[11px] text-muted italic">
                  Aproximado: se compara contra un punto de referencia de
                  cada recorrido, no contra su trazado real (no está
                  digitalizado). Si la distancia es mayor a ~1 km, verificar
                  antes de responder.
                </p>
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card titulo="🗑️ Recolección de residuos domiciliarios">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">
            Barrio del vecino
          </label>
          <BuscadorBarrio value={barrio} onChange={setBarrio} />
          <div className="mt-4 flex flex-col gap-3">
            {barrio.trim().length > 0 && nucleos.length === 0 && (
              <Aviso>
                No encontré ese barrio en los núcleos digitalizados del
                pliego. Puede que el nombre no coincida exacto con el mapa
                original — probá con un barrio vecino o revisá el pliego.
              </Aviso>
            )}
            {nucleos.map((n, i) => (
              <ResultadoNucleo key={i} nucleo={n} />
            ))}
          </div>
        </Card>

        <Card titulo="🧹 Barrido y limpieza de calles">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">
            Calle del vecino (o nombre de barrio)
          </label>
          <input
            type="text"
            value={calle}
            onChange={(e) => setCalle(e.target.value)}
            placeholder="Av. Rivadavia"
            className="w-full px-3 py-3 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
          />
          <p className="text-[11px] text-muted mt-1.5 leading-relaxed">
            El barrido es por calle, no por barrio completo — el contrato
            solo cubre calles y pasajes <b>pavimentados</b>. Por eso acá se
            busca por calle.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {calle.trim().length >= 3 && recorridos.length === 0 && (
              <Aviso>
                No encontré esa calle en los recorridos digitalizados. Puede
                ser una calle sin pavimentar (sin barrido concesionado) o que
                el nombre no coincida con el callejero del pliego —
                verificalo antes de responder que no tiene servicio.
              </Aviso>
            )}
            {recorridos.map((r, i) => (
              <ResultadoRecorrido key={i} recorrido={r} />
            ))}
          </div>
        </Card>
      </div>

      {respuesta && (
        <Card
          titulo="Respuesta para el vecino"
          right={
            <button
              type="button"
              onClick={copiar}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-line-strong text-navy hover:bg-paper-2"
            >
              {copiado ? "Copiado ✓" : "Copiar"}
            </button>
          }
        >
          <pre className="whitespace-pre-wrap text-sm text-navy font-sans leading-relaxed">
            {respuesta}
          </pre>
        </Card>
      )}

      <Card titulo="🧭 Otros servicios del contrato (referencia rápida)">
        <div className="grid md:grid-cols-2 gap-3">
          {SERVICIOS_ADICIONALES.map((s) => (
            <div
              key={s.nombre}
              className="rounded-xl border border-line-strong bg-paper-2 p-3 flex flex-col gap-1.5"
            >
              <span className="text-sm font-bold text-navy">{s.nombre}</span>
              <p className="text-xs text-muted">
                <b className="text-navy">Cuándo usarlo:</b> {s.cuandoUsar}
              </p>
              <p className="text-xs text-muted">
                <b className="text-navy">Cómo funciona:</b> {s.comoFunciona}
              </p>
              <p className="text-xs text-muted">
                <b className="text-navy">Plazo/alcance:</b> {s.plazoOAlcance}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <p className="text-[11px] text-muted leading-relaxed">
        Cobertura de estos datos: recolección domiciliaria está digitalizada
        completa (Zona Norte y Sur, turno diurno y nocturno). Barrido manual
        de Zona Sur tiene el día exacto confirmado (recorridos 001 a 069);
        Zona Norte solo tiene la frecuencia (2 veces por semana) sin el día
        exacto, porque el pliego no lo especifica. Ante cualquier duda,
        cotejar contra el Pliego de Higiene Urbana (Res. 0752/2025) y el
        Contrato con Clear Urbana S.A. (Res. 0370/2026).
      </p>
    </div>
  );
}

function formatDistancia(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function armarRespuesta(
  barrio: string,
  nucleos: NucleoRecoleccion[],
  calle: string,
  recorridos: RecorridoBarrido[],
  recorridosCercanos: RecorridoCercano[] = [],
): string {
  const partes: string[] = [];

  if (nucleos.length > 0) {
    for (const n of nucleos) {
      if (n.diasConfirmados && n.dias.length > 0) {
        partes.push(
          `🗑️ Recolección de residuos: pasa ${n.dias.join(", ")} (turno ${n.turno.toLowerCase()}, ${horarioRecoleccion(n.turno)}).`,
        );
      } else {
        partes.push(
          `🗑️ Recolección de residuos: el pliego no confirma el día exacto para este núcleo (turno ${n.turno.toLowerCase()}) — verificar antes de responder.`,
        );
      }
    }
  } else if (barrio.trim()) {
    partes.push(
      `🗑️ Recolección de residuos: no se encontró "${barrio}" en los datos digitalizados — verificar en el pliego.`,
    );
  }

  if (recorridos.length > 0) {
    const confirmados = recorridos.filter((r) => r.diasConfirmados);
    const sinConfirmar = recorridos.filter((r) => !r.diasConfirmados);
    for (const r of confirmados) {
      partes.push(
        `🧹 Barrido (${r.tipo.toLowerCase()}, recorrido ${r.recorrido}): pasa ${r.dias.join(" y ")}, en el horario de ${horarioBarrido(r.turno)}.`,
      );
    }
    if (sinConfirmar.length > 0) {
      partes.push(
        `🧹 Barrido: la calle está en el circuito de barrido de Zona Norte (2 veces por semana), pero el pliego no especifica qué día exacto — verificar antes de responder.`,
      );
    }
  } else if (calle.trim().length >= 3) {
    partes.push(
      `🧹 Barrido: no se encontró "${calle}" en los recorridos digitalizados — puede ser una calle sin pavimentar (fuera del contrato) o falta cotejar el nombre exacto.`,
    );
  } else if (recorridosCercanos.length > 0) {
    const masCercano = recorridosCercanos[0];
    if (masCercano.distanciaKm <= 1) {
      const r = masCercano.recorrido;
      partes.push(
        r.diasConfirmados && r.dias.length > 0
          ? `🧹 Barrido (${r.tipo.toLowerCase()}, recorrido ${r.recorrido}, a ~${formatDistancia(masCercano.distanciaKm)} de la dirección): pasa ${r.dias.join(" y ")}, en el horario de ${horarioBarrido(r.turno)}. Aproximado — confirmar antes de responder.`
          : `🧹 Barrido: el recorrido más cercano (${r.recorrido}, a ~${formatDistancia(masCercano.distanciaKm)}) no tiene el día confirmado en el pliego — verificar antes de responder.`,
      );
    } else {
      partes.push(
        `🧹 Barrido: el recorrido más cercano digitalizado está a ${formatDistancia(masCercano.distanciaKm)} de esa dirección — demasiado lejos para asumir que es el mismo, verificar manualmente por calle.`,
      );
    }
  }

  return partes.join("\n");
}

function ResultadoNucleo({ nucleo }: { nucleo: NucleoRecoleccion }) {
  return (
    <div className="rounded-xl border border-svc-green/40 bg-svc-green/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-navy">
          Zona {nucleo.zona} · Turno {nucleo.turno}
        </span>
        {nucleo.codigo && (
          <span className="text-[10px] font-mono text-muted">{nucleo.codigo}</span>
        )}
      </div>
      {nucleo.diasConfirmados && nucleo.dias.length > 0 ? (
        <p className="text-sm text-navy mt-1">
          Pasa <b>{nucleo.dias.join(", ")}</b>
          {nucleo.frecuenciaSemanal ? ` (${nucleo.frecuenciaSemanal}x por semana)` : ""},{" "}
          {horarioRecoleccion(nucleo.turno)}.
        </p>
      ) : (
        <p className="text-sm text-muted mt-1 italic">
          Día exacto no confirmado en el pliego para este núcleo.
        </p>
      )}
      {nucleo.barrios.length > 0 && (
        <p className="text-[11px] text-muted mt-1">
          Barrios en este núcleo: {nucleo.barrios.join(" · ")}
        </p>
      )}
    </div>
  );
}

function ResultadoRecorrido({
  recorrido,
  distanciaKm,
}: {
  recorrido: RecorridoBarrido;
  distanciaKm?: number;
}) {
  return (
    <div className="rounded-xl border border-svc-yellow/50 bg-svc-yellow/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-navy">
          {recorrido.tipo} · {recorrido.zona}
        </span>
        <span className="text-[10px] font-mono text-muted">
          Recorrido {recorrido.recorrido}
          {distanciaKm !== undefined ? ` · ~${formatDistancia(distanciaKm)}` : ""}
        </span>
      </div>
      {recorrido.diasConfirmados && recorrido.dias.length > 0 ? (
        <p className="text-sm text-navy mt-1">
          Pasa <b>{recorrido.dias.join(" y ")}</b>, turno {recorrido.turno.toLowerCase()}
          {" "}({horarioBarrido(recorrido.turno)}).
        </p>
      ) : (
        <p className="text-sm text-muted mt-1 italic">
          Frecuencia {recorrido.frecuenciaSemanal ?? "?"}x/semana — día exacto no
          confirmado en el pliego.
        </p>
      )}
      {recorrido.barrios.length > 0 && (
        <p className="text-[11px] text-muted mt-1">
          Barrios: {recorrido.barrios.join(" · ")}
        </p>
      )}
      <p className="text-[11px] text-muted mt-1 truncate">
        Calles: {recorrido.calles.slice(0, 6).join(", ")}
      </p>
    </div>
  );
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line-strong bg-paper-2 p-3 text-sm text-muted">
      {children}
    </div>
  );
}

function Card({
  titulo,
  children,
  right,
}: {
  titulo: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-navy uppercase tracking-wider">
          {titulo}
        </h2>
        {right}
      </div>
      {children}
    </div>
  );
}
