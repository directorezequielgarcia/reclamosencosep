"use client";

/**
 * Componente de captura de campo para Inspecciones.
 * Tres bloques: GPS desde el navegador, audio dictado con MediaRecorder,
 * y fotos múltiples desde la cámara del celular.
 *
 * No depende de librerías externas: usa solo Web APIs estándar (Geolocation,
 * MediaRecorder, FormData). Funciona en Chrome/Edge/Firefox y Safari iOS 14+.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  inspeccionId: string;
  audioInicialUrl: string | null;
  latInicial: number | null;
  lngInicial: number | null;
};

export function CapturaCampo({
  inspeccionId,
  audioInicialUrl,
  latInicial,
  lngInicial,
}: Props) {
  const router = useRouter();

  // ─── GPS ───
  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(
    latInicial != null && lngInicial != null
      ? { lat: latInicial, lng: lngInicial }
      : null,
  );
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  function pedirGps() {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError("Tu navegador no soporta geolocalización");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoord({ lat, lng });
        try {
          const r = await fetch(`/api/inspecciones/${inspeccionId}/gps`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lng }),
          });
          if (!r.ok) throw new Error(await r.text());
          router.refresh();
        } catch (e) {
          setGpsError(
            e instanceof Error ? e.message : "No se pudo guardar la ubicación",
          );
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError(
            "Permiso denegado. Habilitá la ubicación para este sitio en tu navegador.",
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGpsError("Ubicación no disponible en este momento.");
        } else if (err.code === err.TIMEOUT) {
          setGpsError("Tardó mucho la respuesta del GPS. Intentá de nuevo.");
        } else {
          setGpsError(err.message || "Error de GPS");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  // ─── Audio ───
  const [grabando, setGrabando] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [audioDuracion, setAudioDuracion] = useState<number>(0);
  const [audioSubiendo, setAudioSubiendo] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioYaSubidoUrl, setAudioYaSubidoUrl] = useState<string | null>(
    audioInicialUrl,
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const inicioRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    },
    [audioPreviewUrl],
  );

  async function comenzarGrabacion() {
    setAudioError(null);
    if (!navigator.mediaDevices) {
      setAudioError("Tu navegador no soporta grabación de audio");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });
        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        setAudioDuracion(Math.round((Date.now() - inicioRef.current) / 1000));
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      mediaRecorderRef.current = mr;
      inicioRef.current = Date.now();
      mr.start();
      setGrabando(true);
    } catch (e) {
      setAudioError(
        e instanceof Error
          ? e.message
          : "No se pudo acceder al micrófono. Revisá los permisos.",
      );
    }
  }

  function detenerGrabacion() {
    mediaRecorderRef.current?.stop();
    setGrabando(false);
  }

  function descartarAudio() {
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioBlob(null);
    setAudioPreviewUrl(null);
    setAudioDuracion(0);
    chunksRef.current = [];
  }

  async function subirAudio() {
    if (!audioBlob) return;
    setAudioSubiendo(true);
    setAudioError(null);
    try {
      const ext = (audioBlob.type.split("/")[1] || "webm").split(";")[0];
      const file = new File([audioBlob], `dictado.${ext}`, {
        type: audioBlob.type || "audio/webm",
      });
      const fd = new FormData();
      fd.append("audio", file);
      fd.append("duracionSeg", String(audioDuracion));
      const r = await fetch(`/api/inspecciones/${inspeccionId}/audio`, {
        method: "POST",
        body: fd,
      });
      if (!r.ok) throw new Error(await r.text());
      const json = (await r.json()) as { url: string };
      setAudioYaSubidoUrl(json.url);
      descartarAudio();
      router.refresh();
    } catch (e) {
      setAudioError(e instanceof Error ? e.message : "Error al subir audio");
    } finally {
      setAudioSubiendo(false);
    }
  }

  // ─── Fotos ───
  const [fotosPendientes, setFotosPendientes] = useState<File[]>([]);
  const [descripcionFotos, setDescripcionFotos] = useState("");
  const [fotosSubiendo, setFotosSubiendo] = useState(false);
  const [fotosError, setFotosError] = useState<string | null>(null);

  function onSeleccionFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setFotosPendientes((prev) => [...prev, ...files]);
    e.target.value = ""; // permite re-seleccionar las mismas
  }

  function quitarFotoPendiente(idx: number) {
    setFotosPendientes((prev) => prev.filter((_, i) => i !== idx));
  }

  async function subirFotos() {
    if (fotosPendientes.length === 0) return;
    setFotosSubiendo(true);
    setFotosError(null);
    try {
      const fd = new FormData();
      for (const f of fotosPendientes) fd.append("fotos", f);
      if (descripcionFotos.trim()) {
        fd.append("descripcion", descripcionFotos.trim());
      }
      const r = await fetch(`/api/inspecciones/${inspeccionId}/fotos`, {
        method: "POST",
        body: fd,
      });
      if (!r.ok) throw new Error(await r.text());
      setFotosPendientes([]);
      setDescripcionFotos("");
      router.refresh();
    } catch (e) {
      setFotosError(e instanceof Error ? e.message : "Error al subir fotos");
    } finally {
      setFotosSubiendo(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-paper p-5 flex flex-col gap-5">
      <header>
        <h2 className="text-sm font-bold text-navy uppercase tracking-wider">
          Captura de campo
        </h2>
        <p className="text-xs text-muted mt-1">
          Usá estos botones desde el celular en obra para sumar audio, fotos y
          ubicación a la inspección.
        </p>
      </header>

      {/* GPS */}
      <section className="border border-line rounded-xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-bold text-navy">📍 Ubicación GPS</h3>
            {coord ? (
              <div className="text-xs font-mono text-navy mt-1">
                {coord.lat.toFixed(5)}, {coord.lng.toFixed(5)}
              </div>
            ) : (
              <div className="text-xs text-muted mt-1">
                Sin coordenadas cargadas todavía.
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={pedirGps}
            disabled={gpsLoading}
            className="px-3 py-2 rounded-lg bg-navy-2 text-white text-xs font-bold disabled:opacity-60"
          >
            {gpsLoading ? "Obteniendo…" : "Obtener ubicación"}
          </button>
        </div>
        {gpsError && (
          <div className="text-xs text-svc-red bg-svc-red/10 rounded-md p-2">
            {gpsError}
          </div>
        )}
      </section>

      {/* Audio */}
      <section className="border border-line rounded-xl p-4 flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-bold text-navy">🎙️ Audio dictado</h3>
          <p className="text-xs text-muted mt-1">
            Grabá tus observaciones en voz alta y subilas. Después podés
            transcribir el texto a mano desde el campo "Transcripción".
          </p>
        </div>

        {audioYaSubidoUrl && !audioBlob && (
          <div className="text-xs text-muted bg-paper-2 rounded-md p-2">
            Ya hay un audio cargado.{" "}
            <a
              href={audioYaSubidoUrl}
              target="_blank"
              rel="noreferrer"
              className="underline text-navy-2"
            >
              Escucharlo
            </a>
            . Si grabás uno nuevo, lo reemplazás.
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {!grabando && !audioBlob && (
            <button
              type="button"
              onClick={comenzarGrabacion}
              className="px-3 py-2 rounded-lg bg-svc-red text-white text-xs font-bold"
            >
              ● Iniciar grabación
            </button>
          )}
          {grabando && (
            <button
              type="button"
              onClick={detenerGrabacion}
              className="px-3 py-2 rounded-lg bg-navy text-white text-xs font-bold animate-pulse"
            >
              ■ Detener
            </button>
          )}
          {audioBlob && audioPreviewUrl && (
            <>
              <audio controls src={audioPreviewUrl} className="h-9" />
              <span className="text-xs text-muted">{audioDuracion}s</span>
              <button
                type="button"
                onClick={subirAudio}
                disabled={audioSubiendo}
                className="px-3 py-2 rounded-lg bg-svc-green text-white text-xs font-bold disabled:opacity-60"
              >
                {audioSubiendo ? "Subiendo…" : "Subir audio"}
              </button>
              <button
                type="button"
                onClick={descartarAudio}
                disabled={audioSubiendo}
                className="px-3 py-2 rounded-lg border border-line-strong text-navy text-xs font-semibold"
              >
                Descartar
              </button>
            </>
          )}
        </div>
        {audioError && (
          <div className="text-xs text-svc-red bg-svc-red/10 rounded-md p-2">
            {audioError}
          </div>
        )}
      </section>

      {/* Fotos */}
      <section className="border border-line rounded-xl p-4 flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-bold text-navy">📷 Fotos</h3>
          <p className="text-xs text-muted mt-1">
            Sumá una o varias fotos desde la cámara del celular o de la galería.
          </p>
        </div>

        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={onSeleccionFotos}
          className="text-xs file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-navy file:text-white file:font-bold file:cursor-pointer"
        />

        {fotosPendientes.length > 0 && (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {fotosPendientes.map((f, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-lg overflow-hidden border border-line"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => quitarFotoPendiente(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs font-bold"
                    aria-label="Quitar foto"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <input
              type="text"
              value={descripcionFotos}
              onChange={(e) => setDescripcionFotos(e.target.value)}
              maxLength={200}
              placeholder="Descripción común para estas fotos (opcional)"
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy text-sm"
            />

            <div>
              <button
                type="button"
                onClick={subirFotos}
                disabled={fotosSubiendo}
                className="px-4 py-2 rounded-lg bg-svc-green text-white text-sm font-bold disabled:opacity-60"
              >
                {fotosSubiendo
                  ? "Subiendo…"
                  : `Subir ${fotosPendientes.length} foto${fotosPendientes.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </>
        )}
        {fotosError && (
          <div className="text-xs text-svc-red bg-svc-red/10 rounded-md p-2">
            {fotosError}
          </div>
        )}
      </section>
    </div>
  );
}
