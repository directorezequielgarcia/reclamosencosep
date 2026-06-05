import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { crearExpedienteAislado } from "../actions";

export const metadata = { title: "Nuevo expediente · Panel ENCOSEP" };

export default async function NuevoExpedientePage() {
  const session = await auth();
  const esEnte =
    session!.user.rol === "GESTOR_ENTE" || session!.user.rol === "SUPER_ADMIN";
  if (!esEnte) notFound();

  const prestadoras = await prisma.prestadora.findMany({
    orderBy: { razonSocial: "asc" },
    select: { id: true, razonSocial: true },
  });

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <Breadcrumbs
        items={[
          { label: "Panel", href: "/admin" },
          { label: "Expedientes", href: "/admin/expedientes" },
          { label: "Nuevo" },
        ]}
      />

      <header>
        <h1 className="text-2xl font-extrabold text-navy">
          Abrir expediente sin reclamo
        </h1>
        <p className="text-sm text-muted mt-1">
          Para actuaciones que no nacen de un reclamo: por pedido de la Autoridad
          de Aplicación, el Concejo Deliberante, una readecuación tarifaria, de
          oficio, etc.
        </p>
      </header>

      <form
        action={crearExpedienteAislado}
        className="rounded-2xl border border-line bg-paper p-5 grid sm:grid-cols-2 gap-4"
      >
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            Tipo de expediente
          </span>
          <input
            name="tipoExpediente"
            required
            list="tipos-exp-nuevo"
            placeholder="ej: Readecuación tarifaria"
            className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
          />
          <datalist id="tipos-exp-nuevo">
            <option value="Readecuación tarifaria" />
            <option value="Cambio de cuadro tarifario" />
            <option value="Actuación de oficio" />
            <option value="Pedido institucional" />
          </datalist>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            Solicitado por
          </span>
          <input
            name="solicitadoPor"
            list="solicitado-por"
            placeholder="ej: Secretaría de Gobierno"
            className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
          />
          <datalist id="solicitado-por">
            <option value="Autoridad de Aplicación" />
            <option value="Concejo Deliberante" />
            <option value="Poder Ejecutivo Municipal" />
            <option value="Prestadora" />
            <option value="De oficio (ENCOSEP)" />
          </datalist>
        </label>

        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            Objeto
          </span>
          <input
            name="asunto"
            required
            placeholder="ej: Readecuación del cuadro tarifario del servicio de agua"
            className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            Prestadora involucrada
          </span>
          <select
            name="prestadoraId"
            required
            defaultValue=""
            className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
          >
            <option value="" disabled>
              Seleccionar…
            </option>
            {prestadoras.map((p) => (
              <option key={p.id} value={p.id}>
                {p.razonSocial}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            Intervinientes (opcional)
          </span>
          <input
            name="intervinientes"
            placeholder="ej: Secretaría de Gobierno, Prestadora, vecinos"
            className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-svc-orange text-white font-bold text-sm"
          >
            Abrir expediente
          </button>
        </div>
      </form>
    </div>
  );
}
