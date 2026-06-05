import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { puedeGestionarCapacitacion } from "@/lib/capacitacion";
import { crearCapacitacion } from "../actions";

export const metadata = { title: "Subir capacitación · ENCOSEP" };

export default async function NuevaCapacitacionPage() {
  const session = await auth();
  if (!session) redirect("/ingresar");
  if (!puedeGestionarCapacitacion(session.user.rol)) redirect("/capacitacion");

  return (
    <main className="flex flex-1 flex-col items-center bg-paper px-6 py-8">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-extrabold text-navy">
            Subir capacitación
          </h1>
          <p className="text-sm text-muted mt-1">
            Sumá un video (link de YouTube o Drive), un instructivo gráfico o una
            guía paso a paso, dirigido a un tipo de usuario.
          </p>
        </header>

        <form
          action={crearCapacitacion}
          className="rounded-2xl border border-line bg-paper p-5 flex flex-col gap-4"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                Tipo
              </span>
              <select
                name="tipo"
                required
                defaultValue="VIDEO"
                className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
              >
                <option value="VIDEO">🎬 Video (YouTube / Drive)</option>
                <option value="IMAGEN">🖼️ Imagen / instructivo gráfico</option>
                <option value="GUIA">📋 Guía paso a paso</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                Dirigido a
              </span>
              <select
                name="audiencia"
                required
                defaultValue="TODOS"
                className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
              >
                <option value="TODOS">Para todos</option>
                <option value="TEAM_ENCOSEP">Team ENCOSEP</option>
                <option value="AUTORIDAD_APLICACION">
                  Autoridad de Aplicación
                </option>
                <option value="CONCEJO_DELIBERANTE">Concejo Deliberante</option>
                <option value="PEM">Poder Ejecutivo Municipal</option>
                <option value="PRESTADORAS">Prestadoras</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
              Título
            </span>
            <input
              name="titulo"
              required
              placeholder="ej: Cómo cargar un reclamo paso a paso"
              className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
              Descripción
            </span>
            <textarea
              name="descripcion"
              required
              rows={3}
              placeholder="Breve resumen de qué enseña este material."
              className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y"
            />
          </label>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                Módulo (opcional)
              </span>
              <input
                name="modulo"
                placeholder="ej: Expedientes"
                className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                Orden (opcional)
              </span>
              <input
                name="orden"
                type="number"
                min={0}
                defaultValue={0}
                className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
              Enlace del video o imagen (para Video / Imagen)
            </span>
            <input
              name="url"
              placeholder="https://www.youtube.com/watch?v=… o link de Drive"
              className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
              Contenido de la guía (solo para Guía paso a paso)
            </span>
            <textarea
              name="contenido"
              rows={6}
              placeholder={"1. Entrá a…\n2. Apretá…\n3. Completá…"}
              className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-svc-orange text-white font-bold text-sm"
            >
              Guardar
            </button>
            <Link
              href="/capacitacion"
              className="px-5 py-2.5 rounded-lg border border-line-strong text-navy font-semibold text-sm"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
