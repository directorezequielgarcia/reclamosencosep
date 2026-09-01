"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { crearInspeccionRapido } from "@/app/admin/inspecciones/actions";
import { estaEnZonaComodoro } from "@/lib/geocode";

type Servicio = { id: string; nombre: string; nombreCorto: string };

type Props = {
  servicioId: string;
  servicioNombre: string;
  servicios?: Servicio[]; // lista para selector cuando no viene pre-seleccionado
  reclamoId?: string;
  relamoCodigo?: string;
};

type Phase = "form" | "saving" | "uploading" | "done" | "error";

export function FormMovil({
  servicioId: servicioIdInicial,
  servicioNombre,
  servicios = [],
  reclamoId,
  relamoCodigo,
}: Props) {
  const [servicioId, setServicioId] = useState(servicioIdInicial);
  const [phase, setPhase] = useState<Phase>("form");
  const [observaciones, setObservaciones] = useState("");
  const [direccion, setDireccion] = useState("");
  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [fotos, setFotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [resultado, setResultado] = useState<{
    id: string;
    codigo: string;
    savedAt: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Intentar capturar GPS automáticamente al montar
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (estaEnZonaComodoro(latitude, longitude)) {
          setCoord({ lat: latitude, lng: longitude });
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  function pedirGps() {
    if (!("geolocation" in navigator)) {
      setGpsError("GPS no disponible en este dispositivo");
      return;
    }
    setGpsError(null);
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsLoading(false);
        // Ubicación muy alejada de Comodoro: geolocalización por IP/VPN
        // fallando en vez de GPS real. No la aceptamos.
        if (!estaEnZonaComodoro(latitude, longitude)) {
          setGpsError(
            "La ubicación detectada está fuera de Comodoro Rivadavia. Verificá el GPS del dispositivo (o desconectá cualquier VPN activa) e intentá de nuevo.",
          );
          return;
        }
        setCoord({ lat: latitude, lng: longitude });
      },
      () => {
        setGpsLoading(false);
        setGpsError("No se pudo obtener la ubicación. Verificá los permisos.");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  function agregarFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const espacioLibre = 10 - fotos.length;
    const nuevas = Array.from(files).slice(0, espacioLibre);
    setFotos((prev) => [...prev, ...nuevas]);
    nuevas.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  }

  function quitarFoto(i: number) {
    setFotos((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPhase("saving");
    setErrorMsg(null);

    try {
      const fd = new FormData();
      fd.set("servicioId", servicioId);
      fd.set("observaciones", observaciones);
      fd.set("direccion", direccion);
      if (coord) {
        fd.set("lat", String(coord.lat));
        fd.set("lng", String(coord.lng));
      }
      if (reclamoId) fd.set("reclamoId", reclamoId);

      const res = await crearInspeccionRapido(fd);
      if (!res.ok) throw new Error(res.error);

      if (fotos.length > 0) {
        setPhase("uploading");
        const fotoFd = new FormData();
        fotos.forEach((f) => fotoFd.append("fotos", f));
        const fotoRes = await fetch(`/api/inspecciones/${res.id}/fotos`, {
          method: "POST",
          body: fotoFd,
        });
        if (!fotoRes.ok) {
          const msg = await fotoRes.text().catch(() => "");
          throw new Error(`Error al subir las fotos: ${msg || fotoRes.status}`);
        }
      }

      setResultado({ id: res.id, codigo: res.codigo, savedAt: res.savedAt });
      setPhase("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error inesperado");
      setPhase("error");
    }
  }

  function resetForm() {
    setPhase("form");
    setObservaciones("");
    setDireccion("");
    setFotos([]);
    setPreviews([]);
    setResultado(null);
    setErrorMsg(null);
  }

  // --- PANTALLA DE CONFIRMACIÓN ---
  if (phase === "done" && resultado) {
    return (
      <div className="rounded-2xl border border-svc-green bg-svc-green/5 p-6 flex flex-col items-center gap-5 text-center">
        <div className="w-16 h-16 rounded-full bg-svc-green/15 flex items-center justify-center text-3xl">
          ✓
        </div>
        <div>
          <div className="text-xl font-extrabold text-navy">Borrador guardado</div>
          <div className="font-mono text-sm text-navy mt-1">{resultado.codigo}</div>
          <div className="text-xs text-muted mt-1">{resultado.savedAt}</div>
          {fotos.length > 0 && (
            <div className="text-xs text-svc-green font-semibold mt-1">
              {fotos.length} foto{fotos.length !== 1 ? "s" : ""} subida
              {fotos.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Link
            href={`/admin/inspecciones/${resultado.id}`}
            className="w-full text-center px-4 py-3 rounded-xl bg-navy text-white font-bold text-sm"
          >
            Editar inspección →
          </Link>
          {reclamoId && (
            <Link
              href={`/admin/reclamo/${reclamoId}`}
              className="w-full text-center px-4 py-3 rounded-xl border border-line-strong text-navy font-semibold text-sm"
            >
              ← Volver al reclamo #{relamoCodigo}
            </Link>
          )}
          <button
            type="button"
            onClick={resetForm}
            className="w-full text-center px-4 py-3 rounded-xl border border-line-strong text-navy text-sm"
          >
            + Nueva inspección
          </button>
        </div>
      </div>
    );
  }

  const saving = phase === "saving" || phase === "uploading";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* SERVICIO — solo si no viene pre-seleccionado */}
      {servicios.length > 0 && (
        <div className="rounded-2xl border border-line bg-paper p-4 flex flex-col gap-3">
          <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">
            Servicio a inspeccionar <span className="text-svc-red">*</span>
          </div>
          <select
            required
            value={servicioId}
            onChange={(e) => setServicioId(e.target.value)}
            disabled={saving}
            className="px-3 py-2.5 rounded-xl border border-line-strong bg-paper text-navy text-sm disabled:opacity-60"
          >
            <option value="">— Elegí un servicio —</option>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* FOTOS */}
      <div className="rounded-2xl border border-line bg-paper p-4 flex flex-col gap-3">
        <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">
          Fotos {fotos.length > 0 && `(${fotos.length}/10)`}
        </div>

        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Foto ${i + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => quitarFoto(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={saving || fotos.length >= 10}
          className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-line-strong text-navy text-sm font-semibold disabled:opacity-50 active:bg-paper-2"
        >
          {fotos.length === 0
            ? "📷 Agregar fotos"
            : fotos.length >= 10
              ? "Máximo 10 fotos"
              : "📷 Agregar más fotos"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={agregarFotos}
          className="hidden"
        />
        <p className="text-[10px] text-muted">
          Podés sacar fotos con la cámara o elegir de la galería. Máx 8 MB por
          foto.
        </p>
      </div>

      {/* UBICACIÓN */}
      <div className="rounded-2xl border border-line bg-paper p-4 flex flex-col gap-3">
        <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">
          Ubicación
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={pedirGps}
            disabled={gpsLoading || saving}
            className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 active:opacity-80 ${
              coord
                ? "bg-svc-green/15 text-svc-green border border-svc-green/30"
                : "bg-navy-2 text-white"
            }`}
          >
            {gpsLoading
              ? "Obteniendo GPS…"
              : coord
                ? "✓ GPS capturado"
                : "📍 Capturar GPS"}
          </button>
          {coord && (
            <span className="text-[10px] font-mono text-muted shrink-0">
              {coord.lat.toFixed(4)},<br />
              {coord.lng.toFixed(4)}
            </span>
          )}
        </div>
        {gpsError && (
          <p className="text-xs text-svc-red">{gpsError}</p>
        )}

        <input
          type="text"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          placeholder="Dirección / referencia (opcional)"
          disabled={saving}
          maxLength={200}
          className="px-3 py-2.5 rounded-xl border border-line-strong bg-paper text-navy text-sm placeholder:text-muted/60 disabled:opacity-60"
        />
      </div>

      {/* OBSERVACIONES */}
      <div className="rounded-2xl border border-line bg-paper p-4 flex flex-col gap-3">
        <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">
          Observaciones
        </div>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={5}
          placeholder="Describí lo que relevaste en campo…"
          disabled={saving}
          maxLength={20000}
          className="px-3 py-2.5 rounded-xl border border-line-strong bg-paper text-navy text-sm resize-none disabled:opacity-60 placeholder:text-muted/60"
        />
      </div>

      {/* ERROR */}
      {phase === "error" && errorMsg && (
        <div className="rounded-xl bg-svc-red/10 border border-svc-red/30 p-3 text-sm text-svc-red">
          {errorMsg}
          <button
            type="button"
            onClick={() => setPhase("form")}
            className="ml-2 underline text-xs"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={saving}
        className="w-full px-4 py-4 rounded-xl bg-navy text-white font-extrabold text-base tracking-wide disabled:opacity-60 active:opacity-80"
      >
        {phase === "saving"
          ? "Guardando…"
          : phase === "uploading"
            ? `Subiendo ${fotos.length} foto${fotos.length !== 1 ? "s" : ""}…`
            : "GUARDAR COMO BORRADOR"}
      </button>

      {saving && (
        <p className="text-center text-xs text-muted">
          No cerrés la pantalla hasta que termine.
        </p>
      )}
    </form>
  );
}
