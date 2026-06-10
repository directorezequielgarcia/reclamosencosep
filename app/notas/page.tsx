import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ambitoDeRol,
  esEnteRol,
  puedeVerNotas,
  NOTA_AMBITO_LABEL,
  NOTA_ESTADO_META,
} from "@/lib/notas";
import { TONE_CLASS } from "@/lib/admin";
import { LogoEncosep } from "@/components/ui/LogoEncosep";
import { BarraSesion } from "@/components/ui/BarraSesion";

export const metadata = { title: "Notas · ENCOSEP" };

export default async function NotasPage() {
  const session = await auth();
  if (!session) redirect("/ingresar");
  if (!puedeVerNotas(session.user.rol)) redirect("/inicio");

  const esEnte = esEnteRol(session.user.rol);
  const ambito = ambitoDeRol(session.user.rol);
  const where = esEnte ? {} : { ambito: ambito ?? undefined };

  const notas = await prisma.nota.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { mensajes: true } } },
  });

  const volver =
    esEnte || session.user.rol === "OPERADOR_PRESTADORA"
      ? "/admin"
      : "/institucional";

  return (
    <main className="flex flex-1 flex-col items-center bg-paper px-6 py-8">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <BarraSesion />
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <LogoEncosep size={48} />
            <div>
              <h1 className="text-2xl font-extrabold text-navy leading-tight">
                Notas
              </h1>
              <p className="text-xs text-muted">
                {esEnte
                  ? "Comunicación del Ente con los organismos."
                  : "Comunicaciones con el ENCOSEP."}
              </p>
            </div>
          </div>
          <Link
            href="/notas/nueva"
            className="px-4 py-2 rounded-lg bg-svc-orange text-white font-bold text-sm"
          >
            + Nueva nota
          </Link>
        </header>

        {notas.length === 0 ? (
          <div className="rounded-2xl border border-line bg-paper p-10 text-center text-sm text-muted">
            No hay notas todavía. Creá la primera con{" "}
            <strong className="text-navy">+ Nueva nota</strong>.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {notas.map((n) => {
              const m = NOTA_ESTADO_META[n.estado];
              return (
                <li key={n.id}>
                  <Link
                    href={`/notas/${n.id}`}
                    className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-line bg-paper hover:shadow-md transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-svc-orange">
                          {n.numero}
                        </span>
                        <span
                          className={`text-[10px] uppercase tracking-wider font-bold rounded-full border px-2 py-0.5 ${TONE_CLASS[m.tone]}`}
                        >
                          {m.label}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-navy truncate mt-0.5">
                        {n.asunto}
                      </div>
                      <div className="text-[11px] text-muted mt-0.5">
                        {NOTA_AMBITO_LABEL[n.ambito]} · {n.destinatario} ·{" "}
                        {n._count.mensajes} mensaje
                        {n._count.mensajes === 1 ? "" : "s"}
                      </div>
                    </div>
                    <span className="text-xs text-muted whitespace-nowrap">
                      {n.updatedAt.toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <Link
          href={volver}
          className="text-center text-xs text-muted underline underline-offset-4"
        >
          ← Volver
        </Link>
      </div>
    </main>
  );
}
