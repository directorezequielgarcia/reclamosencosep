import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { puedeGestionarFormulaTransporte } from "@/lib/admin";
import { accionCrearFormula } from "../actions";
import { CamposFormula } from "../CamposFormula";
import { datosFormulaVacios } from "@/lib/formula-transporte";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const dynamic = "force-dynamic";

function mesActualISO(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}`;
}

export default async function NuevaFormulaPage() {
  const session = await auth();
  if (!session)
    redirect("/ingresar?callbackUrl=/admin/formula-transporte/nuevo");
  if (!puedeGestionarFormulaTransporte(session.user.rol)) redirect("/admin");

  const vacios = datosFormulaVacios(mesActualISO());

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <Link
          href="/admin/formula-transporte"
          className="text-xs text-navy-2 underline underline-offset-4"
        >
          ← Volver
        </Link>
        <h1 className="text-2xl font-extrabold text-navy mt-2">
          Cargar período — Fórmula Transporte
        </h1>
        <p className="text-sm text-muted mt-1">
          Cargá los precios de mercado y el kilometraje del mes. El Costo/Km
          y el Costo del Servicio se calculan solos al guardar.
        </p>
      </div>

      <form
        action={accionCrearFormula}
        className="rounded-2xl border border-line bg-paper p-5 flex flex-col gap-6"
      >
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Período
            </span>
            <input
              type="month"
              name="periodo"
              required
              defaultValue={vacios.periodo}
              className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Estado
            </span>
            <select
              name="estado"
              defaultValue="BORRADOR"
              className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
            >
              <option value="BORRADOR">Borrador</option>
              <option value="CERTIFICADO">
                Certificado (según Autoridad de Aplicación)
              </option>
              <option value="PUBLICADO">Publicado</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Fuente
            </span>
            <input
              name="fuente"
              maxLength={400}
              placeholder="Certificado N°… — Autoridad de Aplicación"
              className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
            />
          </label>
        </div>

        <CamposFormula d={vacios} />

        <div className="flex items-center gap-3 pt-2 border-t border-line">
          <SubmitButton className="inline-flex items-center px-5 py-2.5 rounded-xl bg-svc-red text-white font-bold text-sm shadow-md shadow-svc-red/30 hover:opacity-90">
            Guardar y calcular
          </SubmitButton>
          <Link
            href="/admin/formula-transporte"
            className="text-sm text-muted underline underline-offset-4"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
