import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { puedeGestionarTarifas } from "@/lib/admin";
import { listarCuadros } from "@/lib/tarifas-db";
import { accionCrearCuadro } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const dynamic = "force-dynamic";

export default async function NuevoCuadroPage() {
  const session = await auth();
  if (!session) redirect("/ingresar?callbackUrl=/admin/tarifas/nuevo");
  if (!puedeGestionarTarifas(session.user.rol)) redirect("/admin");

  let bases: Awaited<ReturnType<typeof listarCuadros>> = [];
  try {
    bases = await listarCuadros();
  } catch {
    bases = [];
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <Link
          href="/admin/tarifas"
          className="text-xs text-navy-2 underline underline-offset-4"
        >
          ← Volver a cuadros
        </Link>
        <h1 className="text-2xl font-extrabold text-navy mt-2">
          Nuevo cuadro / aumento
        </h1>
        <p className="text-sm text-muted mt-1">
          Para cargar un <b>aumento pedido</b>: elegí el cuadro base, poné el
          porcentaje de aumento y listo — se copian todos los valores y se les
          aplica el %. Después podés subir el PDF del pedido. Para un cuadro
          aprobado nuevo, usá el mismo flujo y ajustá el estado.
        </p>
      </div>

      <form
        action={accionCrearCuadro}
        className="rounded-2xl border border-line bg-paper p-5 flex flex-col gap-4"
      >
        <Campo label="Nombre" hint="Ej: «Aumento pedido SCPL — junio 2026».">
          <input
            name="nombre"
            required
            minLength={3}
            maxLength={160}
            className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
          />
        </Campo>

        <div className="grid sm:grid-cols-2 gap-4">
          <Campo label="Expediente">
            <input
              name="expediente"
              maxLength={120}
              placeholder="Exp. .../2026"
              className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
            />
          </Campo>
          <Campo label="Estado">
            <select
              name="estado"
              defaultValue="PEDIDO"
              className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
            >
              <option value="PEDIDO">Aumento pedido (para simular)</option>
              <option value="VIGENTE">Vigente (aprobado y en vigencia)</option>
              <option value="ANTERIOR">Anterior (histórico)</option>
              <option value="BORRADOR">Borrador</option>
            </select>
          </Campo>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Campo label="Vigente desde">
            <input
              type="date"
              name="vigenteDesde"
              className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
            />
          </Campo>
          <Campo label="Publicar en la calculadora">
            <label className="flex items-center gap-2 text-sm text-navy h-[38px]">
              <input
                type="checkbox"
                name="publicado"
                defaultChecked
                className="w-4 h-4 accent-svc-red"
              />
              Visible para el vecino
            </label>
          </Campo>
        </div>

        <div className="border-t border-line pt-4 grid sm:grid-cols-2 gap-4">
          <Campo
            label="Copiar valores de"
            hint="Se copian todas las tarifas de este cuadro."
          >
            <select
              name="baseId"
              defaultValue=""
              className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
            >
              <option value="">Cuadro feb-2026 (base del sistema)</option>
              {bases.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <Campo
            label="Aumento a aplicar (%)"
            hint="Ej: 30 para +30%. Se aplica a todos los montos (energía, agua, alumbrado, fondos). 0 = sin cambios."
          >
            <input
              type="number"
              name="pctAumento"
              defaultValue={0}
              step="0.01"
              className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
            />
          </Campo>
        </div>

        <Campo label="Fuente / observaciones">
          <input
            name="fuente"
            maxLength={400}
            placeholder="Dictamen, boletín, nota de la prestadora…"
            className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
          />
        </Campo>

        <Campo label="PDF del cuadro (opcional)">
          <input
            type="file"
            name="pdf"
            accept="application/pdf"
            className="text-sm"
          />
        </Campo>

        <div className="flex items-center gap-3 pt-2">
          <SubmitButton className="inline-flex items-center px-5 py-2.5 rounded-xl bg-svc-red text-white font-bold text-sm shadow-md shadow-svc-red/30 hover:opacity-90">
            Crear cuadro
          </SubmitButton>
          <Link
            href="/admin/tarifas"
            className="text-sm text-muted underline underline-offset-4"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

function Campo({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
      {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}
