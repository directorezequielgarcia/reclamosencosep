import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeVerAgenda } from "@/lib/admin";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { alternarCompletado, borrarAgendaItem, crearAgendaItem } from "./actions";

export const metadata = { title: "Agenda · Panel ENCOSEP" };

export default async function AgendaPage() {
  const session = await auth();
  if (!session || !puedeVerAgenda(session.user.rol)) redirect("/admin");

  const [pendientes, completados] = await Promise.all([
    prisma.agendaItem.findMany({
      where: { completado: false },
      orderBy: [
        { fechaLimite: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      include: { autor: true },
    }),
    prisma.agendaItem.findMany({
      where: { completado: true },
      orderBy: { completadoEn: "desc" },
      take: 20,
      include: { autor: true },
    }),
  ]);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold text-navy">Agenda del equipo</h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Anotador rápido de pendientes internos (llamar a tal secretaría,
          escribirle a tal prestadora, lo que sea). Es del equipo del Ente,
          no la ve nadie de afuera.
        </p>
      </header>

      <form
        action={crearAgendaItem}
        className="flex gap-2 p-3 rounded-xl border border-line bg-paper"
      >
        <input
          name="texto"
          type="text"
          required
          autoComplete="off"
          placeholder="Anotar algo pendiente…"
          className="flex-1 px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy focus:outline-none focus:border-navy-2"
        />
        <input
          name="fechaLimite"
          type="date"
          title="Fecha límite (opcional)"
          className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy focus:outline-none focus:border-navy-2"
        />
        <SubmitButton
          className="px-4 py-2 rounded-lg bg-navy-2 text-white font-semibold text-sm whitespace-nowrap"
          pendingText="Agregando…"
        >
          Agregar
        </SubmitButton>
      </form>

      <section className="flex flex-col gap-1.5">
        {pendientes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong bg-paper-2 p-8 text-center text-muted text-sm">
            No hay nada pendiente en la agenda.
          </div>
        ) : (
          pendientes.map((it) => {
            const vencido = it.fechaLimite ? it.fechaLimite < hoy : false;
            return (
              <div
                key={it.id}
                className={`flex items-center gap-3 rounded-lg border bg-paper px-3 py-2 ${
                  vencido ? "border-svc-red/40" : "border-line"
                }`}
              >
                <form action={alternarCompletado}>
                  <input type="hidden" name="id" value={it.id} />
                  <SubmitButton
                    title="Marcar como hecho"
                    className="w-5 h-5 rounded border-2 border-line-strong hover:border-navy-2 shrink-0 block"
                    pendingText=""
                  >
                    {" "}
                  </SubmitButton>
                </form>
                <span className="flex-1 text-sm text-navy min-w-0 break-words">
                  {it.texto}
                </span>
                {it.fechaLimite && (
                  <span
                    className={`text-xs whitespace-nowrap ${
                      vencido ? "text-svc-red font-bold" : "text-muted"
                    }`}
                  >
                    {it.fechaLimite.toLocaleDateString("es-AR")}
                  </span>
                )}
                <form action={borrarAgendaItem}>
                  <input type="hidden" name="id" value={it.id} />
                  <SubmitButton
                    className="text-xs text-muted hover:text-svc-red"
                    pendingText="…"
                  >
                    ✕
                  </SubmitButton>
                </form>
              </div>
            );
          })
        )}
      </section>

      {completados.length > 0 && (
        <details className="rounded-xl border border-line bg-paper-2">
          <summary className="cursor-pointer select-none px-3 py-2 text-xs font-bold text-muted">
            Completados recientes · {completados.length}
          </summary>
          <div className="flex flex-col gap-1.5 p-3 pt-0">
            {completados.map((it) => (
              <div
                key={it.id}
                className="flex items-center gap-3 rounded-lg border border-line bg-paper px-3 py-2 opacity-60"
              >
                <form action={alternarCompletado}>
                  <input type="hidden" name="id" value={it.id} />
                  <SubmitButton
                    title="Reabrir"
                    className="w-5 h-5 rounded border-2 border-svc-green/60 bg-svc-green/15 text-svc-green text-[10px] font-bold flex items-center justify-center shrink-0"
                    pendingText=""
                  >
                    ✓
                  </SubmitButton>
                </form>
                <span className="flex-1 text-sm text-navy line-through min-w-0 break-words">
                  {it.texto}
                </span>
                <form action={borrarAgendaItem}>
                  <input type="hidden" name="id" value={it.id} />
                  <SubmitButton
                    className="text-xs text-muted hover:text-svc-red"
                    pendingText="…"
                  >
                    ✕
                  </SubmitButton>
                </form>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
