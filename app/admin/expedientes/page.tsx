import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EXPEDIENTE_ESTADO_META } from "@/lib/expedientes";
import { TONE_CLASS } from "@/lib/admin";

export const metadata = { title: "Expedientes · Panel ENCOSEP" };

export default async function ExpedientesPage() {
  const session = await auth();

  // Operador de prestadora ve solo los expedientes contra su empresa.
  // Resto del ente, super_admin y auditor ven todo.
  const where =
    session!.user.rol === "OPERADOR_PRESTADORA"
      ? { prestadoraId: session!.user.prestadoraId ?? "__none__" }
      : {};

  const expedientes = await prisma.expediente.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      prestadora: true,
      _count: { select: { reclamos: true, actos: true } },
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Expedientes</h1>
          <p className="text-sm text-muted mt-1">
            {expedientes.length}{" "}
            {expedientes.length === 1
              ? "expediente abierto"
              : "expedientes en total"}
            .
          </p>
        </div>
      </header>

      <div className="rounded-2xl border border-line bg-paper overflow-hidden">
        {expedientes.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm">
            Todavía no hay expedientes abiertos. Para abrir uno, entrá al
            detalle de un reclamo y usá la acción{" "}
            <strong className="text-navy">Elevar a expediente</strong>.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted bg-paper-2">
              <tr>
                <th className="text-left font-semibold py-3 px-4">Número</th>
                <th className="text-left font-semibold py-3 px-2">Carátula</th>
                <th className="text-left font-semibold py-3 px-2">
                  Prestadora
                </th>
                <th className="text-left font-semibold py-3 px-2">Reclamos</th>
                <th className="text-left font-semibold py-3 px-2">Actos</th>
                <th className="text-left font-semibold py-3 px-2">Estado</th>
                <th className="text-left font-semibold py-3 px-4">Abierto</th>
              </tr>
            </thead>
            <tbody>
              {expedientes.map((e) => {
                const m = EXPEDIENTE_ESTADO_META[e.estado];
                const fecha = e.createdAt.toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "short",
                  year: "2-digit",
                });
                return (
                  <tr
                    key={e.id}
                    className="border-t border-line hover:bg-paper-2"
                  >
                    <td className="py-2.5 px-4">
                      <Link
                        href={`/admin/expediente/${e.id}`}
                        className="font-mono font-bold text-svc-orange hover:underline"
                      >
                        {e.numero}
                      </Link>
                    </td>
                    <td className="py-2.5 px-2 text-navy max-w-[280px] truncate">
                      {e.caratula}
                    </td>
                    <td className="py-2.5 px-2 text-navy">
                      {e.prestadora.razonSocial}
                    </td>
                    <td className="py-2.5 px-2 text-navy text-center">
                      {e._count.reclamos}
                    </td>
                    <td className="py-2.5 px-2 text-navy text-center">
                      {e._count.actos}
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`inline-flex items-center gap-1 uppercase tracking-wider font-bold rounded-full border text-[10px] px-2 py-0.5 ${TONE_CLASS[m.tone]}`}
                      >
                        {m.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-muted whitespace-nowrap">
                      {fecha}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
