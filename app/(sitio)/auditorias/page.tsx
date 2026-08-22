import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { MigajasSitio, VolverInicio } from "@/components/ui/MigajasSitio";

export const metadata = { title: "Auditorías · ENCOSEP" };

export default async function AuditoriasPublicoPage() {
  const auditorias = await prisma.auditoria.findMany({
    where: { publicado: true },
    orderBy: { fechaPublicacion: "desc" },
    include: { prestadora: true },
    take: 100,
  });

  return (
    <>
      <SeccionHeader
        kicker="Control externo"
        titulo="Auditorías a prestadoras"
        descripcion="Auditorías económico-financieras, de cumplimiento u operativas practicadas a las prestadoras controladas por el ENCOSEP — propias o de otros organismos con competencia sobre el servicio."
      />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <MigajasSitio items={[{ label: "Auditorías" }]} />
        {auditorias.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong bg-paper-2 p-12 text-center text-muted text-sm">
            Todavía no hay auditorías publicadas.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {auditorias.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/auditorias/${a.id}`}
                  className="block rounded-2xl border border-line bg-paper p-5 hover:shadow transition"
                >
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    {a.prestadora && (
                      <span className="uppercase tracking-wider font-bold px-2 py-0.5 rounded-full text-white bg-svc-orange">
                        {a.prestadora.razonSocial}
                      </span>
                    )}
                    {a.tipoAuditoria && <span className="text-muted">{a.tipoAuditoria}</span>}
                    {a.fechaPublicacion && (
                      <>
                        <span className="text-muted">·</span>
                        <span className="text-muted">
                          {a.fechaPublicacion.toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-lg font-extrabold text-navy mt-1">{a.titulo}</h3>
                  {a.expediente && <div className="text-xs font-mono text-muted mt-0.5">{a.expediente}</div>}
                  {a.resumen && <p className="text-sm text-navy mt-2 leading-relaxed">{a.resumen}</p>}
                  <span className="inline-block mt-2 text-xs text-navy-2 font-bold underline underline-offset-4">
                    Ver auditoría completa →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <VolverInicio />
      </main>
    </>
  );
}
