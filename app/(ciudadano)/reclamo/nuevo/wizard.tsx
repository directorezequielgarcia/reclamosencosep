"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { ZorritoTour } from "@/components/tour/ZorritoTour";
import { POSE_POR_SVC } from "@/components/tour/zorrito-poses";
import { BuscadorBarrio } from "@/components/ui/BuscadorBarrio";
import {
  SVC_META,
  SVC_ORDER,
  TRANSPORTE_CAMBIO_PARADA_TITULO,
  MOTIVOS_CAMBIO_PARADA,
  EMPRESAS_TRANSPORTE,
  type SvcKey,
  type EmpresaTransporte,
} from "@/lib/servicios";

type Paso = "servicio" | "ubicacion" | "detalle" | "revision";

// Misma clave que usa ControlForm (Calculadora → Controlá tu factura) para
// dejar la factura ya leída + el resumen del control antes de mandar a
// hacer un reclamo/consulta (sobrevive el paso por /ingresar si hacía
// falta iniciar sesión).
const CLAVE_CONSULTA_CONTROL = "encosep_consulta_control";

async function dataUrlAArchivo(
  dataUrl: string,
  nombre: string,
  tipo: string,
): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], nombre || "factura", { type: tipo || blob.type });
}

type State = {
  svc?: SvcKey;
  titulo: string;
  descripcion: string;
  direccion: string;
  barrio: string;
  lat: number | null;
  lng: number | null;
  fotos: File[];
  linea: string;
  empresa: EmpresaTransporte | "";
  paradaAntes: string;
  paradaAhora: string;
  motivos: string[];
  explayarse: string;
};

const INIT: State = {
  titulo: "",
  descripcion: "",
  direccion: "",
  barrio: "",
  lat: null,
  lng: null,
  fotos: [],
  linea: "",
  empresa: "",
  paradaAntes: "",
  paradaAhora: "",
  motivos: [],
  explayarse: "",
};

function construirDescripcionCambioParada(s: {
  linea: string;
  paradaAntes: string;
  paradaAhora: string;
  motivos: string[];
  explayarse: string;
}): string {
  const partes: string[] = [];
  if (s.linea.trim()) partes.push(`Línea: ${s.linea.trim()}`);
  if (s.paradaAntes.trim()) partes.push(`Antes (Patagonia): ${s.paradaAntes.trim()}`);
  if (s.paradaAhora.trim()) partes.push(`Ahora (Sol Bus): ${s.paradaAhora.trim()}`);
  if (s.motivos.length) partes.push(`Motivo: ${s.motivos.join(", ")}`);
  if (s.explayarse.trim()) partes.push(`Detalle: ${s.explayarse.trim()}`);
  return partes.join("\n");
}

const ETIQUETA_CAMPO: Record<string, string> = {
  titulo: "Situación",
  descripcion: "Detalles",
  direccion: "Dirección",
  barrio: "Barrio",
  svc: "Servicio",
  lat: "GPS",
  lng: "GPS",
};

function explicarError(data: {
  error?: string;
  detalle?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
}): string {
  const fieldErrors = data.detalle?.fieldErrors ?? {};
  const mensajes = Object.entries(fieldErrors)
    .filter(([, msgs]) => msgs && msgs.length > 0)
    .map(([campo, msgs]) => `${ETIQUETA_CAMPO[campo] ?? campo}: ${msgs[0]}`);
  if (mensajes.length > 0) return mensajes.join(" · ");
  if (data.detalle?.formErrors?.length) return data.detalle.formErrors[0];
  return data.error || "No pudimos registrar el reclamo.";
}

export function WizardReclamo({ svcInicial }: { svcInicial?: SvcKey }) {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>(svcInicial ? "ubicacion" : "servicio");
  const [state, setState] = useState<State>({ ...INIT, svc: svcInicial });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof State>(k: K, v: State[K]) {
    setState((s) => ({ ...s, [k]: v }));
  }

  // Si venimos de "Controlá tu factura" con "Quiero consultar sobre el
  // control", precargamos el título, el resumen del análisis y la factura
  // ya leída — así la persona no tiene que volver a subir nada.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("consulta") !== "control") return;

    const guardado = sessionStorage.getItem(CLAVE_CONSULTA_CONTROL);
    sessionStorage.removeItem(CLAVE_CONSULTA_CONTROL);
    if (!guardado) return;

    (async () => {
      try {
        const datos = JSON.parse(guardado) as {
          resumen?: string;
          svc?: string;
          fotoDataUrl?: string;
          fotoNombre?: string;
          fotoTipo?: string;
        };
        const fotos: File[] = [];
        if (datos.fotoDataUrl) {
          fotos.push(
            await dataUrlAArchivo(
              datos.fotoDataUrl,
              datos.fotoNombre ?? "factura",
              datos.fotoTipo ?? "",
            ),
          );
        }
        const svc: SvcKey | undefined =
          datos.svc === "agua" || datos.svc === "energia" ? datos.svc : undefined;
        setState((s) => ({
          ...s,
          svc: svc ?? s.svc,
          titulo: "Consulta sobre el control de mi factura",
          descripcion: datos.resumen ?? s.descripcion,
          fotos: fotos.length ? fotos : s.fotos,
        }));
        // Ya tenemos servicio + título + descripción + foto: saltamos
        // directo a confirmar la ubicación en vez de pedirle a la persona
        // que vuelva a elegir servicio o repita el detalle.
        if (svc) setPaso("ubicacion");
      } catch {
        // Si algo falla al reconstruir la factura, seguimos con el
        // formulario vacío — no bloqueamos la carga del reclamo por esto.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (state.svc === "transporte" && state.linea.trim()) fd.append("linea", state.linea.trim());
      if (state.svc === "transporte" && state.empresa) fd.append("empresa", state.empresa);
      for (const f of state.fotos) fd.append("foto", f);

      const res = await fetch("/api/reclamos", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(explicarError(data));
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
      <div id="reclamo-grid-servicios" className="grid grid-cols-2 gap-3">
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

      <ZorritoTour
        storageKey="zorrito-tour-reclamo-servicio-v1"
        tamanoAvatar="w-24 h-24"
        tamanoBoton="w-24 h-24"
        pasos={[
          {
            pose: "parado",
            texto:
              "¡Hola! Soy el Zorrito de ENCOSEP 🦊. Te acompaño paso a paso para hacer tu reclamo.",
          },
          {
            targetId: "reclamo-grid-servicios",
            pose: "agachado",
            texto:
              "Primero tocá el ícono del servicio con el problema: residuos, electricidad, agua o transporte.",
          },
        ]}
      />
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

  const tieneGps = state.lat !== null && state.lng !== null;
  const tieneDireccion = state.direccion.trim().length >= 3;
  const puede = tieneGps || tieneDireccion;

  return (
    <>
      <CabeceraPaso
        svc={svc}
        titulo="¿Dónde está el problema?"
        subtitulo="Usá GPS, escribí la dirección, o las dos juntas."
      />

      <label id="reclamo-campo-direccion" className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-navy">
          Dirección{" "}
          <span className="text-muted font-normal">
            {tieneGps ? "(opcional · ya capturaste GPS)" : "(si no usás GPS)"}
          </span>
        </span>
        <input
          type="text"
          value={state.direccion}
          onChange={(e) => setField("direccion", e.target.value)}
          placeholder="Av. Rivadavia 2200"
          className="w-full px-3 py-3 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
        />
      </label>

      <label id="reclamo-campo-barrio" className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-navy">
          Barrio <span className="text-muted font-normal">(opcional)</span>
        </span>
        <BuscadorBarrio
          value={state.barrio}
          onChange={(v) => setField("barrio", v)}
        />
      </label>

      <div id="reclamo-campo-gps" className="rounded-2xl border border-dashed border-line-strong bg-paper-2 p-3">
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

      <ZorritoTour
        storageKey="zorrito-tour-reclamo-ubicacion-v1"
        tamanoAvatar="w-24 h-24"
        tamanoBoton="w-24 h-24"
        pasos={[
          {
            targetId: "reclamo-campo-gps",
            pose: POSE_POR_SVC[svc],
            texto:
              "Lo más fácil: tocá 'Usar mi ubicación' y tomo tu GPS automáticamente, sin escribir nada.",
          },
          {
            targetId: "reclamo-campo-direccion",
            pose: POSE_POR_SVC[svc],
            texto:
              "Si preferís escribir, poné calle y altura, o una referencia conocida (ej: esquina, comercio).",
          },
          {
            targetId: "reclamo-campo-barrio",
            pose: POSE_POR_SVC[svc],
            texto: "El barrio es opcional, pero ayuda a ubicar más rápido el reclamo.",
          },
        ]}
      />
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
  const esCambioParada =
    svc === "transporte" && state.titulo === TRANSPORTE_CAMBIO_PARADA_TITULO;
  const puede = esCambioParada
    ? state.linea.trim().length >= 1 &&
      state.paradaAhora.trim().length >= 3 &&
      state.motivos.length >= 1
    : state.titulo.trim().length >= 3 && state.descripcion.trim().length >= 5;

  function actualizarCambioParada(
    cambios: Partial<
      Pick<State, "linea" | "paradaAntes" | "paradaAhora" | "motivos" | "explayarse">
    >,
  ) {
    const next = { ...state, ...cambios };
    const descripcion = construirDescripcionCambioParada(next);
    setField("linea", next.linea);
    setField("paradaAntes", next.paradaAntes);
    setField("paradaAhora", next.paradaAhora);
    setField("motivos", next.motivos);
    setField("explayarse", next.explayarse);
    setField("descripcion", descripcion);
  }

  function elegirTitulo(t: string) {
    setField("titulo", t);
    if (t === TRANSPORTE_CAMBIO_PARADA_TITULO) {
      // El cambio de parada es siempre sobre Sol Bus (así lo indica el propio mini-form).
      setField("empresa", "SOL_BUS");
    } else if (esCambioParada) {
      // Salir del mini-form de cambio de parada: no arrastrar la descripción compuesta.
      setField("descripcion", "");
    }
  }

  function toggleMotivo(motivo: string) {
    const activo = state.motivos.includes(motivo);
    actualizarCambioParada({
      motivos: activo
        ? state.motivos.filter((mt) => mt !== motivo)
        : [...state.motivos, motivo],
    });
  }

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

      <div id="reclamo-campo-situacion" className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-navy">Situación</span>
        <div className="flex flex-col gap-1.5">
          {m.examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => elegirTitulo(ex)}
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
            onChange={(e) => elegirTitulo(e.target.value.slice(0, 120))}
            maxLength={120}
            placeholder="O escribilo con tus palabras… (resumen corto)"
            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-dashed border-line-strong bg-paper-2 text-navy text-sm focus:outline-none focus:border-navy-2 focus:bg-paper"
          />
          {!m.examples.includes(state.titulo) && state.titulo.length > 0 && (
            <div className="text-[11px] text-muted text-right -mt-1">
              {state.titulo.length}/120 — para el relato completo usá &quot;Contanos más detalles&quot; más abajo
            </div>
          )}
        </div>
      </div>

      {esCambioParada ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-paper-2 p-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-navy">Línea</span>
            <input
              type="text"
              value={state.linea}
              onChange={(e) => actualizarCambioParada({ linea: e.target.value })}
              placeholder="Ej: 14"
              className="w-full px-3 py-2.5 rounded-xl border border-line-strong bg-paper text-navy text-sm focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-navy">
              Antes, ¿dónde paraba (Patagonia)?{" "}
              <span className="text-muted font-normal">(opcional)</span>
            </span>
            <input
              type="text"
              value={state.paradaAntes}
              onChange={(e) => actualizarCambioParada({ paradaAntes: e.target.value })}
              placeholder="Ej: San Martín y Rivadavia"
              className="w-full px-3 py-2.5 rounded-xl border border-line-strong bg-paper text-navy text-sm focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-navy">
              Ahora, ¿dónde para o levanta (Sol Bus)?
            </span>
            <input
              type="text"
              value={state.paradaAhora}
              onChange={(e) => actualizarCambioParada({ paradaAhora: e.target.value })}
              placeholder="Ej: Belgrano y Mitre"
              className="w-full px-3 py-2.5 rounded-xl border border-line-strong bg-paper text-navy text-sm focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-navy">Motivo</span>
            <div className="flex flex-col gap-1.5">
              {MOTIVOS_CAMBIO_PARADA.map((motivo) => (
                <button
                  key={motivo}
                  type="button"
                  onClick={() => toggleMotivo(motivo)}
                  className={`text-left px-3 py-2.5 rounded-xl border text-sm transition ${
                    state.motivos.includes(motivo)
                      ? "border-navy-2 bg-navy-2/5 text-navy font-semibold"
                      : "border-line bg-paper text-navy hover:bg-paper-2"
                  }`}
                >
                  {motivo}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-navy">
              Explayarse <span className="text-muted font-normal">(opcional)</span>
            </span>
            <textarea
              value={state.explayarse}
              onChange={(e) => actualizarCambioParada({ explayarse: e.target.value })}
              rows={3}
              placeholder="Algo más que quieras agregar…"
              className="w-full px-3 py-3 rounded-xl border border-line-strong bg-paper text-navy text-sm focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20 resize-none"
            />
          </label>
        </div>
      ) : (
        <>
        {svc === "transporte" && (
          <div id="reclamo-campo-linea-empresa" className="flex flex-col gap-3 rounded-2xl border border-line bg-paper-2 p-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-navy">
                ¿Qué línea? <span className="text-muted font-normal">(opcional)</span>
              </span>
              <input
                type="text"
                value={state.linea}
                onChange={(e) => setField("linea", e.target.value)}
                placeholder="Ej: 5U, 14, 6A"
                className="w-full px-3 py-2.5 rounded-xl border border-line-strong bg-paper text-navy text-sm focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
              />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-navy">
                ¿Qué empresa? <span className="text-muted font-normal">(opcional, si la conocés)</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {EMPRESAS_TRANSPORTE.map((emp) => (
                  <button
                    key={emp.value}
                    type="button"
                    onClick={() =>
                      setField("empresa", state.empresa === emp.value ? "" : emp.value)
                    }
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                      state.empresa === emp.value
                        ? "border-navy-2 bg-navy-2/5 text-navy"
                        : "border-line bg-paper text-navy hover:bg-paper-2"
                    }`}
                  >
                    {emp.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <label id="reclamo-campo-detalles" className="flex flex-col gap-1">
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
        </>
      )}

      <div id="reclamo-campo-fotos" className="flex flex-col gap-2">
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

      <ZorritoTour
        storageKey="zorrito-tour-reclamo-detalle-v1"
        tamanoAvatar="w-24 h-24"
        tamanoBoton="w-24 h-24"
        pasos={[
          {
            targetId: "reclamo-campo-situacion",
            pose: POSE_POR_SVC[svc],
            texto:
              "Elegí la opción que más se parece a lo que te pasó, o escribila corta con tus palabras (hasta 120 caracteres). Es el título del reclamo — el relato completo va más abajo, en \"Contanos más detalles\".",
          },
          ...(svc === "transporte"
            ? [
                {
                  targetId: "reclamo-campo-situacion",
                  pose: POSE_POR_SVC[svc],
                  texto:
                    "¿Es por el cambio de Patagonia a Sol Bus (te movieron la parada, no hay cartel, etc.)? Elegí \"Cambio de parada o lugar de levantamiento (Sol Bus)\": ahí te armo un formulario con los campos ya sugeridos, más fácil de completar.",
                },
              ]
            : []),
          {
            targetId: "reclamo-campo-detalles",
            pose: POSE_POR_SVC[svc],
            texto:
              "Acá contá todo con más detalle: hace cuánto pasa, en qué horario, si afecta a más vecinos. Escribí con tus palabras, sin apuro — tu voz cuenta.",
          },
          {
            targetId: "reclamo-campo-fotos",
            pose: POSE_POR_SVC[svc],
            texto: "Si podés, sacá o subí una foto: ayuda mucho a entender el problema.",
          },
        ]}
      />
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
  const [confirmado, setConfirmado] = useState(false);
  if (!state.svc) return null;
  const m = SVC_META[state.svc];
  return (
    <>
      <CabeceraPaso
        svc={state.svc}
        titulo="Revisá y enviá"
        subtitulo="Si está todo bien, registramos tu reclamo."
      />
      <div id="reclamo-resumen" className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-4 text-sm">
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
        {state.svc === "transporte" && state.linea && (
          <Fila label="Línea" value={state.linea} />
        )}
        {state.svc === "transporte" && state.empresa && (
          <Fila
            label="Empresa"
            value={EMPRESAS_TRANSPORTE.find((e) => e.value === state.empresa)?.label ?? state.empresa}
          />
        )}
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

      <label
        id="reclamo-checkbox-confirmar"
        className="flex items-start gap-2 rounded-xl border border-line-strong bg-paper-2 p-3 cursor-pointer mt-1"
      >
        <input
          type="checkbox"
          checked={confirmado}
          onChange={(e) => setConfirmado(e.target.checked)}
          className="mt-0.5 w-4 h-4 shrink-0"
        />
        <span className="text-sm text-navy leading-snug">
          Revisé que la información esté <strong>correcta y completa</strong>.
          Al registrar el reclamo se genera un número para seguirlo.
        </span>
      </label>

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
          disabled={enviando || !confirmado}
          className="flex-[2] px-4 py-3 rounded-xl bg-svc-red text-white font-semibold shadow-md shadow-svc-red/30 disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Registrar reclamo"}
        </button>
      </div>

      <ZorritoTour
        storageKey="zorrito-tour-reclamo-revision-v1"
        tamanoAvatar="w-24 h-24"
        tamanoBoton="w-24 h-24"
        pasos={[
          {
            targetId: "reclamo-resumen",
            pose: POSE_POR_SVC[state.svc],
            texto: "Dale una repasada a todo antes de enviar, que después no se puede editar.",
          },
          {
            targetId: "reclamo-checkbox-confirmar",
            pose: POSE_POR_SVC[state.svc],
            texto:
              "Tildá acá para confirmar y tocá 'Registrar reclamo'. Vas a recibir un número para seguirlo. ¡Gracias por avisarnos!",
          },
        ]}
      />
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
