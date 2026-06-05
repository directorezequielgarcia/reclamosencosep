"use client";

import Link from "next/link";
import { useState } from "react";
import { TIPO_INSPECCION_META } from "@/lib/inspecciones";
import { crearInspeccion } from "../actions";
import type { TipoInspeccion } from "@prisma/client";

type Servicio = { id: string; nombre: string };
type Prestadora = { id: string; razonSocial: string };
type Expediente = { id: string; numero: string; caratula: string };

type Props = {
  servicios: Servicio[];
  prestadoras: Prestadora[];
  expedientes: Expediente[];
  fechaPorDefecto: string;
};

export function NuevaInspeccionForm({
  servicios,
  prestadoras,
  expedientes,
  fechaPorDefecto,
}: Props) {
  const [tipo, setTipo] = useState<string>("OFICIO");
  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null);
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
      (pos) => {
        setCoord({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError(
            "Permiso denegado. Habilitá la ubicación para este sitio.",
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGpsError("Ubicación no disponible en este momento.");
        } else if (err.code === err.TIMEOUT) {
          setGpsError("Tardó mucho el GPS. Intentá de nuevo.");
        } else {
          setGpsError(err.message || "Error de GPS");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  return (
    <form
      action={crearInspeccion}
      className="rounded-2xl border border-line bg-paper p-5 flex flex-col gap-4"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Servicio inspeccionado" required>
          <select
            name="servicioId"
            required
            defaultValue=""
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
          >
            <option value="" disabled>
              Elegí un servicio…
            </option>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tipo de inspección" required>
          <select
            name="tipo"
            required
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
          >
            {(Object.keys(TIPO_INSPECCION_META) as TipoInspeccion[]).map((t) => (
              <option key={t} value={t}>
                {TIPO_INSPECCION_META[t].label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Fecha y hora" required>
          <input
            type="datetime-local"
            name="fecha"
            required
            defaultValue={fechaPorDefecto}
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
          />
        </Field>

        <Field label="Prestadora (opcional)">
          <select
            name="prestadoraId"
            defaultValue=""
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
          >
            <option value="">— No corresponde —</option>
            {prestadoras.map((p) => (
              <option key={p.id} value={p.id}>
                {p.razonSocial}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {expedientes.length > 0 && (
        <Field
          label={
            tipo === "SEGUIMIENTO_EXPEDIENTE"
              ? "Expediente que se sigue"
              : "Expediente vinculado (opcional)"
          }
        >
          <select
            name="expedienteId"
            defaultValue=""
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
          >
            <option value="">— Sin vincular —</option>
            {expedientes.map((e) => (
              <option key={e.id} value={e.id}>
                {e.numero} — {e.caratula}
              </option>
            ))}
          </select>
          {tipo === "SEGUIMIENTO_EXPEDIENTE" && (
            <span className="text-[11px] text-svc-blue mt-1">
              Vinculá el expediente para que Expedientes pueda importar esta
              constatación.
            </span>
          )}
        </Field>
      )}

      <Field label="Título" required>
        <input
          type="text"
          name="titulo"
          required
          maxLength={200}
          placeholder='Ej: "Microbasural en esquina B° Pueyrredón"'
          className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
        />
      </Field>

      <Field label="Observaciones (opcional)">
        <textarea
          name="observaciones"
          rows={6}
          maxLength={20000}
          placeholder="Si vas a dictar audio o sumar fotos desde el detalle después de crear la inspección, podés dejar este campo vacío."
          className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy resize-y"
        />
      </Field>

      <div className="rounded-xl border border-line p-4 flex flex-col gap-3 bg-paper-2">
        <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">
          Ubicación (opcional)
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Dirección">
            <input
              type="text"
              name="direccion"
              maxLength={200}
              placeholder="Av. Polonia 1234"
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
            />
          </Field>
          <Field label="Barrio">
            <input
              type="text"
              name="barrio"
              maxLength={120}
              placeholder="Pueyrredón"
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
            />
          </Field>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={pedirGps}
            disabled={gpsLoading}
            className="px-3 py-2 rounded-lg bg-navy-2 text-white text-xs font-bold disabled:opacity-60"
          >
            {gpsLoading ? "Obteniendo…" : "📍 Usar mi ubicación actual"}
          </button>
          {coord && (
            <span className="text-xs font-mono text-navy">
              {coord.lat.toFixed(5)}, {coord.lng.toFixed(5)}
            </span>
          )}
          {gpsError && <span className="text-xs text-svc-red">{gpsError}</span>}
        </div>
        <input type="hidden" name="lat" value={coord?.lat ?? ""} readOnly />
        <input type="hidden" name="lng" value={coord?.lng ?? ""} readOnly />
        <p className="text-[11px] text-muted">
          Podés cargar dirección + barrio, usar el GPS del navegador, las dos
          cosas, o ninguna. Si no cargás ubicación ahora, la podés sumar después
          desde el detalle.
        </p>
      </div>

      <div className="rounded-xl bg-svc-blue/10 border border-svc-blue/30 p-3 text-xs text-navy leading-relaxed">
        <strong>Todas las observaciones son opcionales.</strong> Podés crear la
        inspección con solo título y servicio, y después desde el detalle sumar
        <strong> texto, audio dictado en campo, fotos desde la cámara</strong> y
        GPS de alta precisión — todo en cualquier combinación.
      </div>

      <div className="flex gap-2 items-center pt-2">
        <button
          type="submit"
          className="px-5 py-2.5 rounded-lg bg-navy text-white font-bold text-sm hover:opacity-90"
        >
          Guardar borrador
        </button>
        <Link
          href="/admin/inspecciones"
          className="px-5 py-2.5 rounded-lg border border-line-strong text-navy font-semibold text-sm"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">
        {label}
        {required && <span className="text-svc-red ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
