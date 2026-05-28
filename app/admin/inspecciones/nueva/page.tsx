import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeGestionarInspecciones } from "@/lib/admin";
import { TIPO_INSPECCION_META } from "@/lib/inspecciones";
import { crearInspeccion } from "../actions";
import type { TipoInspeccion } from "@prisma/client";

export const metadata = { title: "Nueva inspección · Panel ENCOSEP" };

export default async function NuevaInspeccionPage() {
  const session = await auth();
  if (!session || !puedeGestionarInspecciones(session.user.rol)) {
    redirect("/admin");
  }

  const [servicios, prestadoras] = await Promise.all([
    prisma.servicio.findMany({ orderBy: { nombreCorto: "asc" } }),
    prisma.prestadora.findMany({
      where: { activa: true },
      orderBy: { razonSocial: "asc" },
    }),
  ]);

  // Fecha y hora actual en input datetime-local
  const ahora = new Date();
  const fechaLocal = new Date(
    ahora.getTime() - ahora.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <nav className="text-xs text-muted">
        <Link href="/admin/inspecciones" className="hover:underline">
          ← Inspecciones
        </Link>
      </nav>

      <header>
        <h1 className="text-2xl font-extrabold text-navy">Nueva inspección</h1>
        <p className="text-sm text-muted mt-1">
          Carga inicial del relevamiento. Queda en{" "}
          <strong className="text-navy">borrador</strong> y después podés sumar
          fotos, audio dictado y ubicación GPS desde la pantalla de detalle.
        </p>
      </header>

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
              defaultValue="OFICIO"
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
            >
              {(Object.keys(TIPO_INSPECCION_META) as TipoInspeccion[]).map(
                (t) => (
                  <option key={t} value={t}>
                    {TIPO_INSPECCION_META[t].label}
                  </option>
                ),
              )}
            </select>
          </Field>

          <Field label="Fecha y hora" required>
            <input
              type="datetime-local"
              name="fecha"
              required
              defaultValue={fechaLocal}
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

        <Field label="Observaciones" required>
          <textarea
            name="observaciones"
            required
            rows={10}
            minLength={10}
            maxLength={20000}
            placeholder="Describí lo relevado: estado del servicio, irregularidades detectadas, antecedentes, testigos, etc. Después podés sumar audio dictado en campo y se autocompleta acá."
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy resize-y"
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
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

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Latitud (opcional, viene del GPS)">
            <input
              type="text"
              name="lat"
              inputMode="decimal"
              placeholder="-45.8654"
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy font-mono"
            />
          </Field>
          <Field label="Longitud (opcional, viene del GPS)">
            <input
              type="text"
              name="lng"
              inputMode="decimal"
              placeholder="-67.4892"
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy font-mono"
            />
          </Field>
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

      <p className="text-[12px] text-muted">
        <strong className="text-navy">Próximamente:</strong> captura de audio
        dictado, múltiples fotos desde la cámara del celular y obtención
        automática de coordenadas GPS desde el navegador. Por ahora podés copiar
        las coordenadas manualmente desde el mapa.
      </p>
    </div>
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
