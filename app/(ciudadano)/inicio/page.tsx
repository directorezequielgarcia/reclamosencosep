import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { SVC_META, SVC_ORDER } from "@/lib/servicios";
import { ZorritoTour } from "@/components/tour/ZorritoTour";
import { RedesSociales } from "@/components/ui/RedesSociales";

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

  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { email: true, telefono: true },
  });
  const faltaContacto = !usuario?.email || !usuario?.telefono;

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

      {faltaContacto && (
        <Link
          href="/mi-cuenta"
          className="flex items-start gap-3 rounded-2xl border border-svc-orange/40 bg-svc-orange/5 p-3 hover:bg-svc-orange/10 transition"
        >
          <span className="text-xl leading-none" aria-hidden>
            📞
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-navy">
              Completá tu {!usuario?.email && !usuario?.telefono
                ? "email y teléfono"
                : !usuario?.email
                  ? "email"
                  : "teléfono"}
            </span>
            <span className="block text-xs text-muted leading-snug mt-0.5">
              Así el Ente puede contactarte más rápido sobre tus reclamos.
            </span>
          </span>
          <span className="text-svc-orange text-lg shrink-0">›</span>
        </Link>
      )}

      <section id="inicio-servicios" className="grid grid-cols-2 gap-3">
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

      <section id="inicio-mis-reclamos" className="mt-2">
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

      <Link
        href="/encuesta"
        className="flex items-start gap-3 rounded-2xl border border-svc-yellow/50 bg-svc-yellow/10 p-3 hover:bg-svc-yellow/20 transition"
      >
        <span className="text-xl leading-none" aria-hidden>
          ⭐
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-navy">
            Completá la encuesta de satisfacción
          </span>
          <span className="block text-xs text-muted leading-snug mt-0.5">
            Calificá cómo te parece que están los servicios públicos.
          </span>
        </span>
        <span className="text-svc-yellow text-lg shrink-0">›</span>
      </Link>

      <Link
        href="/"
        className="flex items-center gap-3 rounded-2xl border border-[#7e57c2]/40 bg-[#7e57c2]/5 p-3 hover:bg-[#7e57c2]/10 transition"
      >
        <div className="w-14 h-14 shrink-0 rounded-full overflow-hidden border-2 border-[#7e57c2]/50 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/imagenes/zorrito/zorrito-parado.png"
            alt=""
            className="w-full h-full object-cover object-top"
          />
        </div>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-navy">
            Volvé a la app principal
          </span>
          <span className="block text-xs text-muted leading-snug mt-0.5">
            Noticias, tarifas y todo lo del ENCOSEP.
          </span>
        </span>
        <span className="text-[#7e57c2] text-lg shrink-0">›</span>
      </Link>

      <div className="w-full flex items-center justify-center gap-2 text-sm text-navy">
        <span className="font-semibold">Seguinos en nuestras redes:</span>
        <RedesSociales />
      </div>

      <div className="flex-1" />

      <Link
        id="inicio-nuevo-reclamo"
        href="/reclamo/nuevo"
        className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-svc-red text-white font-semibold shadow-md shadow-svc-red/30 hover:opacity-90 transition"
      >
        + Iniciar nuevo reclamo
      </Link>

      <ZorritoTour
        storageKey="zorrito-tour-inicio-v1"
        pasos={[
          {
            pose: "parado",
            texto: `¡Hola ${primerNombre}! Soy el Zorrito de ENCOSEP 🦊. Te cuento rápido qué podés hacer en esta pantalla.`,
          },
          {
            targetId: "inicio-servicios",
            pose: "parado",
            texto:
              "Elegí el servicio sobre el que querés hacer tu reclamo: Residuos, Electricidad, Agua y Saneamiento o Transporte.",
          },
          {
            targetId: "inicio-mis-reclamos",
            pose: "agachado",
            texto:
              "Acá vas a ver tus últimos reclamos. Tocá 'Ver todos' para revisar el estado de todos los que hiciste.",
          },
          {
            targetId: "inicio-nuevo-reclamo",
            pose: "parado",
            texto:
              "O si ya sabés qué te pasa, tocá este botón para arrancar tu reclamo directo.",
          },
        ]}
      />
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
