import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { svcFromKind } from "@/lib/servicios";
import { ZorritoTour } from "@/components/tour/ZorritoTour";

export const metadata = { title: "Mis reclamos · ENCOSEP" };

const ESTADO_LABEL: Record<string, string> = {
  RECIBIDO: "recibido",
  EN_REVISION: "en revisión",
  DERIVADO: "derivado",
  EN_PROCESO: "en proceso",
  RESUELTO: "resuelto",
  CERRADO_SIN_SOLUCION: "cerrado sin solución",
  RECHAZADO: "rechazado",
};

const ESTADO_COLOR: Record<string, string> = {
  RECIBIDO: "bg-paper-3 text-navy",
  EN_REVISION: "bg-svc-yellow/20 text-navy",
  DERIVADO: "bg-svc-blue/20 text-navy",
  EN_PROCESO: "bg-svc-blue/20 text-navy",
  RESUELTO: "bg-svc-green/20 text-navy",
  CERRADO_SIN_SOLUCION: "bg-paper-3 text-muted",
  RECHAZADO: "bg-svc-red/20 text-navy",
};

export default async function MisReclamosPage() {
  const session = await auth();
  const reclamos = await prisma.reclamo.findMany({
    where: { ciudadanoId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: { servicio: true, prestadora: true },
  });

  // Eventos recientes (últimas 24hs) para cada reclamo — suple notificaciones por email mientras tanto
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const eventosRecientes = await prisma.reclamoEvento.groupBy({
    by: ["reclamoId"],
    where: {
      reclamoId: { in: reclamos.map((r) => r.id) },
      createdAt: { gte: desde },
      // No contamos el evento CREACION (no es novedad para el vecino que lo cargó)
      tipo: { not: "CREACION" },
    },
    _count: { _all: true },
  });
  const novedadesPorReclamo = new Map(
    eventosRecientes.map((e) => [e.reclamoId, e._count._all]),
  );
  const totalNovedades = Array.from(novedadesPorReclamo.values()).reduce(
    (a, b) => a + b,
    0,
  );

  return (
    <main className="flex flex-1 flex-col gap-4 py-4">
      <header id="mis-reclamos-header">
        <h1 className="text-2xl font-extrabold text-navy leading-tight">
          Mis reclamos
        </h1>
        <p className="text-sm text-muted mt-1">
          {reclamos.length === 0
            ? "Todavía no registraste ningún reclamo."
            : `${reclamos.length} ${reclamos.length === 1 ? "reclamo" : "reclamos"} en total.`}
        </p>
        {totalNovedades > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-svc-orange/15 border border-svc-orange/40 text-navy text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-svc-orange animate-pulse" />
            {totalNovedades === 1
              ? "1 novedad en las últimas 24hs"
              : `${totalNovedades} novedades en las últimas 24hs`}
          </div>
        )}
      </header>

      {reclamos.length === 0 ? (
        <Link
          href="/reclamo/nuevo"
          className="mt-4 inline-flex items-center justify-center px-5 py-3 rounded-xl bg-svc-red text-white font-semibold shadow-md shadow-svc-red/30"
        >
          + Registrar el primero
        </Link>
      ) : (
        <ul id="mis-reclamos-lista" className="flex flex-col gap-2">
          {reclamos.map((r) => {
            const svc = svcFromKind(r.servicio.kind);
            const fecha = r.createdAt.toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "short",
            });
            const novedades = novedadesPorReclamo.get(r.id) ?? 0;
            return (
              <li key={r.id}>
                <Link
                  href={`/mis-reclamos/${r.codigo}`}
                  className={`relative flex items-start gap-3 p-3 rounded-xl border bg-paper hover:bg-paper-2 transition ${
                    novedades > 0
                      ? "border-svc-orange/60 shadow-sm shadow-svc-orange/15"
                      : "border-line"
                  }`}
                >
                  <SvcIcon kind={svc} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-navy text-sm">
                        #{r.codigo}
                      </span>
                      <span
                        className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${ESTADO_COLOR[r.estado]}`}
                      >
                        {ESTADO_LABEL[r.estado]}
                      </span>
                      {novedades > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-svc-orange text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          {novedades === 1 ? "novedad" : `${novedades} novedades`}
                        </span>
                      )}
                      <span className="text-[11px] text-muted ml-auto">
                        {fecha}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-navy mt-0.5 truncate">
                      {r.titulo}
                    </div>
                    <div className="text-xs text-muted truncate">
                      {r.direccion}
                      {r.barrio ? ` · ${r.barrio}` : ""}
                    </div>
                    {r.prestadora && (
                      <div className="text-[11px] text-muted mt-1">
                        Derivado a {r.prestadora.razonSocial}
                      </div>
                    )}
                  </div>
                  <span className="text-muted text-lg self-center">›</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex-1" />

      {reclamos.length > 0 && (
        <Link
          href="/reclamo/nuevo"
          className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-svc-red text-white font-semibold shadow-md shadow-svc-red/30"
        >
          + Nuevo reclamo
        </Link>
      )}

      <ZorritoTour
        storageKey="zorrito-tour-mis-reclamos-v1"
        pasos={[
          {
            pose: "parado",
            texto:
              "¡Hola de nuevo! Soy el Zorrito 🦊. Acá vas a ver el estado de todos tus reclamos.",
          },
          {
            targetId: "mis-reclamos-header",
            pose: "parado",
            texto:
              "Cuando haya novedades en algún reclamo te lo voy a marcar con este aviso naranja.",
          },
          ...(reclamos.length > 0
            ? [
                {
                  targetId: "mis-reclamos-lista",
                  pose: "agachado" as const,
                  texto:
                    "Tocá cualquier reclamo para ver el detalle: en qué estado está y qué pasos siguen.",
                },
              ]
            : []),
        ]}
      />
    </main>
  );
}
