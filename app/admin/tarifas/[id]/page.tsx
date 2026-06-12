import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { puedeGestionarTarifas } from "@/lib/admin";
import { getCuadroRow } from "@/lib/tarifas-db";
import { accionActualizarCuadro } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const dynamic = "force-dynamic";

export default async function EditarCuadroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect(`/ingresar?callbackUrl=/admin/tarifas/${id}`);
  if (!puedeGestionarTarifas(session.user.rol)) redirect("/admin");

  const c = await getCuadroRow(id);
  if (!c) notFound();

  const fechaIso = c.vigenteDesde
    ? c.vigenteDesde.toISOString().slice(0, 10)
    : "";

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <Link
          href="/admin/tarifas"
          className="text-xs text-navy-2 underline underline-offset-4"
        >
          ← Volver a cuadros
        </Link>
        <h1 className="text-2xl font-extrabold text-navy mt-2">Editar cuadro</h1>
        <p className="text-sm text-muted mt-1">
          Editás los datos del cuadro y, si querés, reemplazás el PDF. Los
          valores de las tarifas se cargan al crear el cuadro (copiando de un
          base + %). Para cambiarlos, creá uno nuevo desde el base correcto.
        </p>
      </div>

      <form
        action={accionActualizarCuadro}
        className="rounded-2xl border border-line bg-paper p-5 flex flex-col gap-4"
      >
        <input type="hidden" name="id" value={c.id} />

        <Campo label="Nombre">
          <input
            name="nombre"
            required
            minLength={3}
            maxLength={160}
            defaultValue={c.nombre}
            className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
          />
        </Campo>

        <div className="grid sm:grid-cols-2 gap-4">
          <Campo label="Expediente">
            <input
              name="expediente"
              maxLength={120}
              defaultValue={c.expediente ?? ""}
              className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
            />
          </Campo>
          <Campo label="Estado">
            <select
              name="estado"
              defaultValue={c.estado}
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
              defaultValue={fechaIso}
              className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
            />
          </Campo>
          <Campo label="Publicar en la calculadora">
            <label className="flex items-center gap-2 text-sm text-navy h-[38px]">
              <input
                type="checkbox"
                name="publicado"
                defaultChecked={c.publicado}
                className="w-4 h-4 accent-svc-red"
              />
              Visible para el vecino
            </label>
          </Campo>
        </div>

        <Campo label="Fuente / observaciones">
          <input
            name="fuente"
            maxLength={400}
            defaultValue={c.fuente ?? ""}
            className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
          />
        </Campo>

        <Campo
          label="Reemplazar PDF (opcional)"
          hint={
            c.pdfUrl ? "Ya hay un PDF cargado. Subir uno nuevo lo reemplaza." : undefined
          }
        >
          <input
            type="file"
            name="pdf"
            accept="application/pdf"
            className="text-sm"
          />
        </Campo>

        {c.pdfUrl ? (
          <a
            href={c.pdfUrl}
            target="_blank"
            rel="noopener"
            className="text-xs text-navy-2 underline underline-offset-4 -mt-2"
          >
            Ver PDF actual
          </a>
        ) : null}

        <div className="flex items-center gap-3 pt-2">
          <SubmitButton className="inline-flex items-center px-5 py-2.5 rounded-xl bg-svc-red text-white font-bold text-sm shadow-md shadow-svc-red/30 hover:opacity-90">
            Guardar cambios
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
