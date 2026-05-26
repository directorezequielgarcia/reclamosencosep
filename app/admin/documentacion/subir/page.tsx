import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TIPO_DOC_META } from "@/lib/documentos";
import { subirDocumento } from "../actions";
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
      <nav className="text-xs text-muted">
        <Link href="/admin/documentacion" className="hover:underline">
          ← Documentación
        </Link>
      </nav>

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
              placeholder={`Ej: ${anoActual} (anual) o ${anoActual}-${mesActual} (mensual)`}
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
            Archivo (PDF, Word, Excel, JPG/PNG) * — máx 25 MB
          </span>
          <input
            type="file"
            name="archivo"
            required
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png"
            className="px-3 py-2.5 rounded-lg border border-dashed border-line-strong text-sm bg-paper-2 cursor-pointer"
          />
        </label>

        <div className="flex gap-2 mt-2">
          <Link
            href="/admin/documentacion"
            className="inline-flex items-center justify-center px-4 py-3 rounded-xl border border-line-strong text-navy font-semibold text-sm"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl bg-svc-red text-white font-bold text-sm shadow-md shadow-svc-red/30"
          >
            Subir y enviar a revisión
          </button>
        </div>
      </form>
    </div>
  );
}
