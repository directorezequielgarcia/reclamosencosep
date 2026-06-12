import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { puedeGestionarTarifas } from "@/lib/admin";
import { listarCuadros } from "@/lib/tarifas-db";
import {
  accionEliminar,
  accionSeedInicial,
  accionTogglePublicado,
} from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { CuadroEstado } from "@prisma/client";

export const dynamic = "force-dynamic";

const ESTADO_BADGE: Record<CuadroEstado, string> = {
  VIGENTE: "bg-svc-green/15 text-navy border-svc-green/50",
  PEDIDO: "bg-svc-yellow/20 text-navy border-svc-yellow/60",
  ANTERIOR: "bg-paper-3 text-navy border-line-strong",
  BORRADOR: "bg-paper-3 text-muted border-line-strong",
};

const ESTADO_LABEL: Record<CuadroEstado, string> = {
  VIGENTE: "Vigente",
  PEDIDO: "Aumento pedido",
  ANTERIOR: "Anterior",
  BORRADOR: "Borrador",
};

export default async function AdminTarifasPage() {
  const session = await auth();
  if (!session) redirect("/ingresar?callbackUrl=/admin/tarifas");
  if (!puedeGestionarTarifas(session.user.rol)) redirect("/admin");

  let cuadros: Awaited<ReturnType<typeof listarCuadros>> = [];
  let tablaFalta = false;
  try {
    cuadros = await listarCuadros();
  } catch {
    tablaFalta = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">
            Cuadros tarifarios
          </h1>
          <p className="text-sm text-muted mt-1 max-w-2xl">
            Cargá el cuadro vigente y los aumentos pedidos por las prestadoras.
            Lo que publiques acá alimenta la{" "}
            <Link
              href="/tarifas"
              className="underline underline-offset-2 text-navy-2"
            >
              Calculadora ENCOSEP
            </Link>{" "}
            que ve el vecino.
          </p>
        </div>
        <Link
          href="/admin/tarifas/nuevo"
          className="inline-flex items-center px-4 py-2 rounded-xl bg-svc-red text-white font-bold text-sm shadow-md shadow-svc-red/30 hover:opacity-90"
        >
          + Nuevo cuadro / aumento
        </Link>
      </div>

      {tablaFalta ? (
        <div className="rounded-xl border border-svc-red/40 bg-svc-red/10 p-4 text-sm text-navy">
          La tabla de cuadros todavía no existe en la base. Falta aplicar la
          migración de Prisma (<code>cuadros_tarifarios</code>). La calculadora
          pública sigue funcionando con el cuadro feb-2026 cargado en el código.
        </div>
      ) : cuadros.length === 0 ? (
        <div className="rounded-xl border border-line bg-paper p-6 flex flex-col items-start gap-3">
          <div className="text-sm text-navy">
            Todavía no hay cuadros cargados en la base. Podés cargar el cuadro
            inicial feb-2026 (Exp. 014/2026) con un clic.
          </div>
          <form action={accionSeedInicial}>
            <SubmitButton className="inline-flex items-center px-4 py-2 rounded-lg bg-navy text-white font-semibold text-sm hover:opacity-90">
              Cargar cuadro inicial feb-2026
            </SubmitButton>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-paper overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-paper-2 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Cuadro</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Vigente desde</th>
                <th className="px-4 py-3">Público</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {cuadros.map((c) => (
                <tr key={c.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-navy">{c.nombre}</div>
                    <div className="text-xs text-muted">
                      {c.expediente ?? "—"}
                      {c.pdfUrl ? (
                        <>
                          {" · "}
                          <a
                            href={c.pdfUrl}
                            target="_blank"
                            rel="noopener"
                            className="underline underline-offset-2 text-navy-2"
                          >
                            PDF
                          </a>
                        </>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold ${ESTADO_BADGE[c.estado]}`}
                    >
                      {ESTADO_LABEL[c.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy">
                    {c.vigenteDesde
                      ? new Date(c.vigenteDesde).toLocaleDateString("es-AR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <form action={accionTogglePublicado}>
                      <input type="hidden" name="id" value={c.id} />
                      <input
                        type="hidden"
                        name="publicado"
                        value={(!c.publicado).toString()}
                      />
                      <SubmitButton
                        className={
                          "px-2.5 py-1 rounded-lg text-xs font-semibold border " +
                          (c.publicado
                            ? "border-svc-green/50 bg-svc-green/15 text-navy"
                            : "border-line-strong text-muted")
                        }
                      >
                        {c.publicado ? "Publicado" : "Oculto"}
                      </SubmitButton>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/tarifas/${c.id}`}
                        className="px-3 py-1.5 rounded-lg border border-line-strong text-navy font-semibold text-xs hover:bg-paper-2"
                      >
                        Editar
                      </Link>
                      <form action={accionEliminar}>
                        <input type="hidden" name="id" value={c.id} />
                        <SubmitButton className="px-3 py-1.5 rounded-lg border border-svc-red/40 text-svc-red font-semibold text-xs hover:bg-svc-red/10">
                          Eliminar
                        </SubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
