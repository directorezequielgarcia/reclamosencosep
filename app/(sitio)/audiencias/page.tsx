import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { ESTADO_AUDIENCIA_META, MODALIDAD_META, audienciaPermiteInscripcion } from "@/lib/audiencias";
import { TONE_CLASS } from "@/lib/admin";

export const metadata = { title: "Audiencias Públicas · ENCOSEP" };

export default async function AudienciasPublicasPage() {
  const audiencias = await prisma.audienciaPublica.findMany({
    where: { estado: { not: "CANCELADA" } },
    orderBy: { fecha: "desc" },
    include: { _count: { select: { inscripciones: true } } },
  });

  return (
    <>
      <SeccionHeader
        kicker="Participación ciudadana"
        titulo="Audiencias Públicas"
        descripcion="El Ente convoca audiencias públicas para escuchar a los vecinos sobre temas vinculados a los servicios públicos. Inscribite gratis y participá."
      />
      <main className="max-w-5xl mx-auto px-6 py-10">
        {audiencias.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong bg-paper-2 p-12 text-center text-muted text-sm">
            Próximamente nuevas audiencias.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {audiencias.map((a) => {
              const m = ESTADO_AUDIENCIA_META[a.estado];
              const puede = audienciaPermiteInscripcion(a.estado);
              return (
                <li
                  key={a.id}
                  className="rounded-2xl border border-line bg-paper p-5 hover:shadow transition"
                >
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className={`inline-flex items-center uppercase tracking-wider font-bold rounded-full border px-2 py-0.5 ${TONE_CLASS[m.tone]}`}>
                      {m.label}
                    </span>
                    <span className="text-muted">{MODALIDAD_META[a.modalidad].icon} {MODALIDAD_META[a.modalidad].label}</span>
                    <span className="text-muted">·</span>
                    <span className="text-muted">{a.fecha.toLocaleString("es-AR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-navy mt-1">{a.titulo}</h3>
                  <p className="text-sm text-navy mt-1 leading-relaxed">{a.descripcion}</p>
                  <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                    <span className="text-xs text-muted">
                      {a._count.inscripciones} inscripto{a._count.inscripciones === 1 ? "" : "s"}
                      {a.capacidad ? ` · cupo ${a.capacidad}` : ""}
                    </span>
                    <Link
                      href={`/audiencias/${a.id}`}
                      className={`inline-flex items-center justify-center px-4 py-2 rounded-lg font-bold text-sm ${puede ? "bg-svc-red text-white" : "border border-line-strong text-navy"}`}
                    >
                      {puede ? "Inscribirme" : "Ver detalle"} →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
