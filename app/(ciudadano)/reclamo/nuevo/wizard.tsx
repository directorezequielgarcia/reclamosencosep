"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { SVC_META, SVC_ORDER, type SvcKey } from "@/lib/servicios";

type Paso = "servicio" | "ubicacion" | "detalle" | "revision";

type State = {
  svc?: SvcKey;
  titulo: string;
  descripcion: string;
  direccion: string;
  barrio: string;
  lat: number | null;
  lng: number | null;
  fotos: File[];
};

const INIT: State = {
  titulo: "",
  descripcion: "",
  direccion: "",
  barrio: "",
  lat: null,
  lng: null,
  fotos: [],
};

export function WizardReclamo({ svcInicial }: { svcInicial?: SvcKey }) {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>(svcInicial ? "ubicacion" : "servicio");
  const [state, setState] = useState<State>({ ...INIT, svc: svcInicial });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof State>(k: K, v: State[K]) {
    setState((s) => ({ ...s, [k]: v }));
  }

  function elegirServicio(svc: SvcKey) {
    setField("svc", svc);
    setPaso("ubicacion");
  }

  async function enviar() {
    if (!state.svc) return;
    setEnviando(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("svc", state.svc);
      fd.append("titulo", state.titulo);
      fd.append("descripcion", state.descripcion);
      fd.append("direccion", state.direccion);
      if (state.barrio) fd.append("barrio", state.barrio);
      if (state.lat !== null) fd.append("lat", String(state.lat));
      if (state.lng !== null) fd.append("lng", String(state.lng));
      for (const f of state.fotos) fd.append("foto", f);

      const res = await fetch("/api/reclamos", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "No pudimos registrar el reclamo.");
        setEnviando(false);
        return;
      }
      router.push(`/reclamo/nuevo/listo/${data.codigo}`);
    } catch {
      setError("Error de conexión. Probá de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4 py-4">
      <ProgressBar paso={paso} />

      {paso === "servicio" && <PasoServicio onElegir={elegirServicio} />}

      {paso === "ubicacion" && state.svc && (
        <PasoUbicacion
          svc={state.svc}
          state={state}
          setField={setField}
          onAtras={() => setPaso("servicio")}
          onSiguiente={() => setPaso("detalle")}
        />
      )}

      {paso === "detalle" && state.svc && (
        <PasoDetalle
          svc={state.svc}
          state={state}
          setField={setField}
          onAtras={() => setPaso("ubicacion")}
          onSiguiente={() => setPaso("revision")}
        />
      )}

      {paso === "revision" && state.svc && (
        <PasoRevision
          state={state}
          enviando={enviando}
          error={error}
          onAtras={() => setPaso("detalle")}
          onEnviar={enviar}
        />
      )}
    </main>
  );
}

function ProgressBar({ paso }: { paso: Paso }) {
  const idx = { servicio: 0, ubicacion: 1, detalle: 2, revision: 3 }[paso];
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full ${i <= idx ? "bg-navy-2" : "bg-paper-3"}`}
        />
      ))}
    </div>
  );
}

function PasoServicio({ onElegir }: { onElegir: (s: SvcKey) => void }) {
  return (
    <>
      <header>
        <h1 className="text-2xl font-extrabold text-navy leading-tight">
          ¿Sobre qué servicio?
        </h1>
        <p className="text-sm text-muted mt-1">
          Elegí el servicio público con el problema.
        </p>
      </header>
      <div className="grid grid-cols-2 gap-3">
        {SVC_ORDER.map((kind) => {
          const m = SVC_META[kind];
          return (
            <button
              key={kind}
              type="button"
              onClick={() => onElegir(kind)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-line bg-paper shadow-sm hover:shadow-md transition active:scale-[0.98]"
            >
              <SvcIcon kind={kind} size={68} />
              <div className="text-center leading-tight">
                <div className="text-sm font-bold text-navy">{m.short}</div>
                <div className="text-[11px] text-muted">{m.sub}</div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function PasoUbicacion({
  svc,
  state,
  setField,
  onAtras,
  onSiguiente,
}: {
  svc: SvcKey;
  state: State;
  setField: <K extends keyof State>(k: K, v: State[K]) => void;
  onAtras: () => void;
  onSiguiente: () => void;
}) {
  const [gpsState, setGpsState] = useState<"idle" | "asking" | "ok" | "error">(
    state.lat !== null ? "ok" : "idle",
  );

  function pedirGPS() {
    if (!navigator.geolocation) {
      setGpsState("error");
      return;
    }
    setGpsState("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setField("lat", pos.coords.latitude);
        setField("lng", pos.coords.longitude);
        setGpsState("ok");
      },
      () => setGpsState("error"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function limpiarGPS() {
    setField("lat", null);
    setField("lng", null);
    setGpsState("idle");
  }

  const puede = state.direccion.trim().length >= 3;

  return (
    <>
      <CabeceraPaso
        svc={svc}
        titulo="¿Dónde está el problema?"
        subtitulo="Indicá la dirección y, si querés, agregá tu ubicación GPS."
      />

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-navy">Dirección</span>
        <input
          type="text"
          value={state.direccion}
          onChange={(e) => setField("direccion", e.target.value)}
          placeholder="Av. Rivadavia 2200"
          className="w-full px-3 py-3 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-navy">
          Barrio <span className="text-muted font-normal">(opcional)</span>
        </span>
        <input
          type="text"
          value={state.barrio}
          onChange={(e) => setField("barrio", e.target.value)}
          placeholder="Pueyrredón"
          className="w-full px-3 py-3 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
        />
      </label>

      <div className="rounded-2xl border border-dashed border-line-strong bg-paper-2 p-3">
        {gpsState === "ok" && state.lat !== null && state.lng !== null ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-svc-green/15 border-2 border-svc-green flex items-center justify-center text-svc-green text-lg">
              ●
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-navy">
                Ubicación capturada
              </div>
              <div className="text-[11px] text-muted font-mono">
                {state.lat.toFixed(5)}, {state.lng.toFixed(5)}
              </div>
            </div>
            <button
              type="button"
              onClick={limpiarGPS}
              className="text-xs text-navy-2 underline underline-offset-4"
            >
              Quitar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={pedirGPS}
            disabled={gpsState === "asking"}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-line-strong bg-paper text-navy font-semibold text-sm disabled:opacity-50"
          >
            {gpsState === "asking" ? "Pidiendo permiso…" : "📍 Usar mi ubicación"}
          </button>
        )}
        {gpsState === "error" && (
          <div className="text-[11px] text-svc-red mt-2 text-center">
            No pudimos obtener tu ubicación. Podés seguir con la dirección.
          </div>
        )}
      </div>

      <BotoneraPaso onAtras={onAtras} onSiguiente={onSiguiente} puede={puede} />
    </>
  );
}

function PasoDetalle({
  svc,
  state,
  setField,
  onAtras,
  onSiguiente,
}: {
  svc: SvcKey;
  state: State;
  setField: <K extends keyof State>(k: K, v: State[K]) => void;
  onAtras: () => void;
  onSiguiente: () => void;
}) {
  const m = SVC_META[svc];
  const puede =
    state.titulo.trim().length >= 3 && state.descripcion.trim().length >= 5;

  function onFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const arr = Array.from(e.target.files ?? []);
    setField("fotos", arr.slice(0, 5));
  }

  function quitarFoto(i: number) {
    setField(
      "fotos",
      state.fotos.filter((_, idx) => idx !== i),
    );
  }

  return (
    <>
      <CabeceraPaso
        svc={svc}
        titulo="¿Qué pasó?"
        subtitulo="Elegí lo que más se parezca y agregá detalles."
      />

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-navy">Situación</span>
        <div className="flex flex-col gap-1.5">
          {m.examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setField("titulo", ex)}
              className={`text-left px-3 py-2.5 rounded-xl border text-sm transition ${
                state.titulo === ex
                  ? "border-navy-2 bg-navy-2/5 text-navy font-semibold"
                  : "border-line bg-paper text-navy hover:bg-paper-2"
              }`}
            >
              {ex}
            </button>
          ))}
          <input
            type="text"
            value={m.examples.includes(state.titulo) ? "" : state.titulo}
            onChange={(e) => setField("titulo", e.target.value)}
            placeholder="O escribilo con tus palabras…"
            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-dashed border-line-strong bg-paper-2 text-navy text-sm focus:outline-none focus:border-navy-2 focus:bg-paper"
          />
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-navy">
          Contanos más detalles
        </span>
        <textarea
          value={state.descripcion}
          onChange={(e) => setField("descripcion", e.target.value)}
          rows={4}
          placeholder="Hace cuánto está el problema, en qué horario, si afecta a más vecinos…"
          className="w-full px-3 py-3 rounded-xl border border-line-strong bg-paper text-navy text-sm focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20 resize-none"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-navy">
          Fotos{" "}
          <span className="text-muted font-normal">
            (opcional, hasta 5)
          </span>
        </span>
        <label className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl border border-dashed border-line-strong bg-paper-2 text-navy text-sm font-semibold cursor-pointer hover:bg-paper">
          📷 Sacar foto o subir desde galería
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={onFotos}
            className="hidden"
          />
        </label>

        {state.fotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-1">
            {state.fotos.map((f, i) => {
              const url = URL.createObjectURL(f);
              return (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`foto ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => quitarFoto(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-navy/80 text-white text-xs font-bold"
                    aria-label="Quitar foto"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BotoneraPaso onAtras={onAtras} onSiguiente={onSiguiente} puede={puede} />
    </>
  );
}

function PasoRevision({
  state,
  enviando,
  error,
  onAtras,
  onEnviar,
}: {
  state: State;
  enviando: boolean;
  error: string | null;
  onAtras: () => void;
  onEnviar: () => void;
}) {
  if (!state.svc) return null;
  const m = SVC_META[state.svc];
  return (
    <>
      <CabeceraPaso
        svc={state.svc}
        titulo="Revisá y enviá"
        subtitulo="Si está todo bien, registramos tu reclamo."
      />
      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-4 text-sm">
        <Fila label="Servicio" value={m.label} />
        <Fila label="Dirección" value={state.direccion} />
        {state.barrio && <Fila label="Barrio" value={state.barrio} />}
        {state.lat !== null && state.lng !== null && (
          <Fila
            label="GPS"
            value={`${state.lat.toFixed(5)}, ${state.lng.toFixed(5)}`}
          />
        )}
        <Fila label="Situación" value={state.titulo} />
        {state.fotos.length > 0 && (
          <Fila
            label="Fotos"
            value={`${state.fotos.length} adjunta${state.fotos.length === 1 ? "" : "s"}`}
          />
        )}
        <div className="border-t border-line pt-2 mt-1">
          <div className="text-[11px] uppercase tracking-wider text-muted font-semibold mb-1">
            Detalles
          </div>
          <p className="text-navy whitespace-pre-wrap leading-snug">
            {state.descripcion}
          </p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-svc-red bg-svc-red/10 border border-svc-red/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={onAtras}
          disabled={enviando}
          className="flex-1 px-4 py-3 rounded-xl border border-line-strong bg-paper text-navy font-semibold disabled:opacity-50"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={onEnviar}
          disabled={enviando}
          className="flex-[2] px-4 py-3 rounded-xl bg-svc-red text-white font-semibold shadow-md shadow-svc-red/30 disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Registrar reclamo"}
        </button>
      </div>
    </>
  );
}

function CabeceraPaso({
  svc,
  titulo,
  subtitulo,
}: {
  svc: SvcKey;
  titulo: string;
  subtitulo: string;
}) {
  const m = SVC_META[svc];
  return (
    <div className="flex items-start gap-3">
      <SvcIcon kind={svc} size={48} />
      <div className="flex-1">
        <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">
          {m.short}
        </div>
        <h1 className="text-xl font-extrabold text-navy leading-tight">
          {titulo}
        </h1>
        <p className="text-xs text-muted mt-0.5">{subtitulo}</p>
      </div>
    </div>
  );
}

function BotoneraPaso({
  onAtras,
  onSiguiente,
  puede,
}: {
  onAtras: () => void;
  onSiguiente: () => void;
  puede: boolean;
}) {
  return (
    <div className="flex gap-2 mt-2">
      <button
        type="button"
        onClick={onAtras}
        className="flex-1 px-4 py-3 rounded-xl border border-line-strong bg-paper text-navy font-semibold"
      >
        Atrás
      </button>
      <button
        type="button"
        onClick={onSiguiente}
        disabled={!puede}
        className="flex-[2] px-4 py-3 rounded-xl bg-navy-2 text-white font-semibold disabled:opacity-40"
      >
        Siguiente
      </button>
    </div>
  );
}

function Fila({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[11px] uppercase tracking-wider text-muted font-semibold w-20 shrink-0">
        {label}
      </span>
      <span className="text-navy text-sm flex-1">{value}</span>
    </div>
  );
}
