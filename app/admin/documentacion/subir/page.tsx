import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TIPO_DOC_META } from "@/lib/documentos";
import { subirDocumento } from "../actions";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { TipoDocumento } from "@prisma/client";

export const metadata = { title: "Subir documento · Panel ENCOSEP" };

export default async function SubirDocumentoPage() {
  const session = await auth();
  if (!session) redirect("/ingresar?callbackUrl=/admin/documentacion/subir");

  const esEnte =
    session.user.rol === "GESTOR_ENTE" || session.user.rol === "SUPER_ADMIN";
  const esOperador = session.user.rol === "OPERADOR_PRESTADORA";

  if (!esEnte && !esOperador) {
    redirect("/admin");
  }

  const prestadoras = esEnte
    ? await prisma.prestadora.findMany({
        where: { activa: true },
        orderBy: { razonSocial: "asc" },
      })
    : [];
  const miPrestadora = esOperador
    ? await prisma.prestadora.findUnique({
        where: { id: session.user.prestadoraId ?? "__none__" },
      })
    : null;

  const anoActual = new Date().getFullYear();
  const mesActual = String(new Date().getMonth() + 1).padStart(2, "0");

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <Breadcrumbs
        items={[
          { label: "Panel", href: "/admin" },
          { label: "Documentación", href: "/admin/documentacion" },
          { label: "Subir" },
        ]}
      />

      <header>
        <h1 className="text-2xl font-extrabold text-navy">Subir documento</h1>
        <p className="text-sm text-muted mt-1">
          {esOperador
            ? `Cargá un documento a nombre de ${miPrestadora?.razonSocial ?? "tu empresa"}. El Ente lo va a revisar.`
            : "Cargá un documento a nombre de una prestadora controlada."}
        </p>
      </header>

      <form
        action={subirDocumento}
        className="flex flex-col gap-4 bg-paper border border-line rounded-2xl p-6"
      >
        {esEnte && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-navy uppercase tracking-wider">
              Prestadora *
            </span>
            <select
              name="prestadoraId"
              required
              defaultValue=""
              className="px-3 py-2.5 rounded-lg border border-line-strong text-sm bg-paper"
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
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-navy uppercase tracking-wider">
              Tipo *
            </span>
            <select
              name="tipo"
              required
              defaultValue=""
              className="px-3 py-2.5 rounded-lg border border-line-strong text-sm bg-paper"
            >
              <option value="" disabled>
                Seleccionar…
              </option>
              {(Object.keys(TIPO_DOC_META) as TipoDocumento[]).map((t) => (
                <option key={t} value={t}>
                  {TIPO_DOC_META[t].icon} {TIPO_DOC_META[t].label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-navy uppercase tracking-wider">
              Período *
            </span>
            <input
              type="text"
              name="periodo"
              required
              placeholder={`Ej: ${anoActual}-${mesActual} (mensual) o ${anoActual} (anual)`}
              pattern="^\d{4}(-\d{2})?$"
              title="Formato: AAAA-MM para mensual (ej: 2026-03) o AAAA para anual (ej: 2026)"
              className="px-3 py-2.5 rounded-lg border border-line-strong text-sm bg-paper"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-navy uppercase tracking-wider">
            Título *
          </span>
          <input
            type="text"
            name="titulo"
            required
            placeholder="Ej: Balance económico-financiero 2026"
            className="px-3 py-2.5 rounded-lg border border-line-strong text-sm bg-paper"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-navy uppercase tracking-wider">
            Descripción (opcional)
          </span>
          <textarea
            name="descripcion"
            rows={3}
            placeholder="Breve referencia al contenido del documento, normativa que lo respalda, etc."
            className="px-3 py-2.5 rounded-lg border border-line-strong text-sm bg-paper resize-y"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-navy uppercase tracking-wider">
            Archivos (PDF, Word, Excel, JPG/PNG) * — máx 4 MB c/u
          </span>
          <input
            type="file"
            name="archivos"
            required
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            className="px-3 py-2.5 rounded-lg border border-dashed border-line-strong text-sm bg-paper-2 cursor-pointer"
          />
          <span className="text-xs text-muted">
            Podés seleccionar varios archivos juntos — por ejemplo, todas las
            piezas de un expediente tarifario o de una audiencia. Cada uno
            queda como un documento propio, con el mismo tipo y período.
          </span>
        </label>

        <div className="flex gap-2 mt-2">
          <Link
            href="/admin/documentacion"
            className="inline-flex items-center justify-center px-4 py-3 rounded-xl border border-line-strong text-navy font-semibold text-sm"
          >
            Cancelar
          </Link>
          <SubmitButton
            className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl bg-svc-red text-white font-bold text-sm shadow-md shadow-svc-red/30"
            pendingText="Subiendo…"
          >
            Subir y enviar a revisión
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
