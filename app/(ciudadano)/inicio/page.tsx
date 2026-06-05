import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { SVC_META, SVC_ORDER } from "@/lib/servicios";

export const metadata = { title: "Inicio · Portal de Reclamos" };

// Roles institucionales: al ingresar van directo a su tablero de consulta,
// no a la vista de carga de reclamos del vecino.
const ROLES_INSTITUCIONALES = ["PEM", "CONCEJO_DELIBERANTE", "AUTORIDAD_APLICACION"];

export default async function InicioPage() {
  const session = await auth();
  if (ROLES_INSTITUCIONALES.includes(session!.user.rol)) {
    redirect("/institucional");
  }
  const userId = session!.user.id;

  const recientes = await prisma.reclamo.findMany({
    where: { ciudadanoId: userId },
    orderBy: { createdAt: "desc" },
    take: 2,
    include: { servicio: true },
  });

  const primerNombre = (session!.user.name ?? "Vecino/a").split(" ")[0];

  return (
    <main className="flex flex-1 flex-col gap-5 py-4">
      <section>
        <h1 className="text-2xl font-extrabold leading-tight text-navy">
          Hola {primerNombre},
        </h1>
        <p className="text-sm text-muted leading-relaxed mt-1">
          Elegí el servicio sobre el que querés hacer tu reclamo.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {SVC_ORDER.map((kind) => {
          const m = SVC_META[kind];
          return (
            <Link
              key={kind}
              href={`/reclamo/nuevo?svc=${kind}`}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-line bg-paper shadow-sm hover:shadow-md transition"
            >
              <SvcIcon kind={kind} size={68} />
              <div className="text-center leading-tight">
                <div className="text-sm font-bold text-navy">{m.short}</div>
                <div className="text-[11px] text-muted">{m.sub}</div>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-navy">Mis reclamos</h2>
          <Link
            href="/mis-reclamos"
            className="text-xs text-navy-2 underline underline-offset-4"
          >
            Ver todos
          </Link>
        </div>

        {recientes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong p-4 text-center text-xs text-muted bg-paper-2">
            Todavía no cargaste ningún reclamo.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {recientes.map((r) => {
              const kind = r.servicio.kind.toLowerCase() as keyof typeof SVC_META;
              return (
                <li key={r.id}>
                  <Link
                    href={`/mis-reclamos/${r.codigo}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-line bg-paper hover:bg-paper-2"
                  >
                    <SvcIcon kind={kind} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-navy truncate">
                        #{r.codigo}{" "}
                        <span className="text-xs font-normal text-muted">
                          · {estadoLabel(r.estado)}
                        </span>
                      </div>
                      <div className="text-xs text-muted truncate">
                        {r.titulo}
                      </div>
                    </div>
                    <span className="text-muted text-lg">›</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="flex-1" />

      <Link
        href="/reclamo/nuevo"
        className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-svc-red text-white font-semibold shadow-md shadow-svc-red/30 hover:opacity-90 transition"
      >
        + Iniciar nuevo reclamo
      </Link>
    </main>
  );
}

function estadoLabel(estado: string): string {
  switch (estado) {
    case "RECIBIDO":
      return "recibido";
    case "EN_REVISION":
      return "en revisión";
    case "DERIVADO":
      return "derivado";
    case "EN_PROCESO":
      return "en proceso";
    case "RESUELTO":
      return "resuelto";
    case "CERRADO_SIN_SOLUCION":
      return "cerrado sin solución";
    case "RECHAZADO":
      return "rechazado";
    default:
      return estado.toLowerCase();
  }
}
