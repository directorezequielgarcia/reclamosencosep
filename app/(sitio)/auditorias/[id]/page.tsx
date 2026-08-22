import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { MigajasSitio, VolverInicio } from "@/components/ui/MigajasSitio";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await prisma.auditoria.findUnique({ where: { id } });
  return { title: a ? `${a.titulo} · Auditorías · ENCOSEP` : "Auditoría · ENCOSEP" };
}

export default async function AuditoriaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auditoria = await prisma.auditoria.findUnique({
    where: { id },
    include: { prestadora: true, documentos: { orderBy: { createdAt: "asc" } } },
  });

  if (!auditoria || !auditoria.publicado) notFound();

  const secciones: { titulo: string; texto: string | null }[] = [
    { titulo: "¿Qué es una auditoría?", texto: auditoria.queEsAuditoria },
    { titulo: "Alcance", texto: auditoria.alcance },
    { titulo: "Procedimientos aplicados", texto: auditoria.procedimientos },
    { titulo: "Elementos hallados", texto: auditoria.hallazgos },
    { titulo: "Conclusiones", texto: auditoria.conclusiones },
    { titulo: "Distancia entre la evidencia y la conclusión", texto: auditoria.razonabilidad },
    { titulo: "Cómo corregir a futuro", texto: auditoria.recomendaciones },
    { titulo: "Opinión del ENCOSEP", texto: auditoria.opinionEncosep },
  ].filter((s) => s.texto && s.texto.trim().length > 0);

  return (
    <>
      <SeccionHeader
        kicker={auditoria.prestadora?.razonSocial ?? "Auditorías"}
        titulo={auditoria.titulo}
        descripcion={auditoria.resumen ?? undefined}
      />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <MigajasSitio
          items={[
            { label: "Auditorías", href: "/auditorias" },
            { label: auditoria.titulo },
          ]}
        />

        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm rounded-2xl border border-line bg-paper p-5 mb-8">
          {auditoria.expediente && (
            <Dato label="Expediente" valor={auditoria.expediente} mono />
          )}
          {auditoria.tipoAuditoria && (
            <Dato label="Tipo de auditoría" valor={auditoria.tipoAuditoria} />
          )}
          {auditoria.auditorResponsable && (
            <Dato label="Auditor / área responsable" valor={auditoria.auditorResponsable} />
          )}
          {auditoria.periodoAuditado && (
            <Dato label="Período auditado" valor={auditoria.periodoAuditado} />
          )}
          {auditoria.fechaInforme && (
            <Dato
              label="Fecha del informe"
              valor={auditoria.fechaInforme.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
            />
          )}
          {auditoria.prestadora && (
            <Dato label="Prestadora" valor={auditoria.prestadora.razonSocial} />
          )}
        </dl>

        {(auditoria.documentos.length > 0 || auditoria.archivoUrl) && (
          <div className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Documentos</h2>
            <ul className="flex flex-wrap gap-2">
              {auditoria.archivoUrl && (
                <li>
                  <a
                    href={auditoria.archivoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-2 text-white font-bold text-sm"
                  >
                    📎 Informe completo
                  </a>
                </li>
              )}
              {auditoria.documentos.map((doc) => (
                <li key={doc.id}>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line-strong text-navy font-bold text-sm hover:bg-paper-2"
                  >
                    📎 {doc.titulo}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-8">
          {secciones.map((s) => (
            <section key={s.titulo}>
              <h2 className="text-lg font-extrabold text-navy border-b border-line pb-2 mb-3">
                {s.titulo}
              </h2>
              <div className="text-sm text-navy whitespace-pre-wrap leading-relaxed">
                {s.texto}
              </div>
            </section>
          ))}
        </div>

        <VolverInicio volverA={{ label: "Auditorías", href: "/auditorias" }} />
      </main>
    </>
  );
}

function Dato({ label, valor, mono }: { label: string; valor: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted font-semibold">{label}</dt>
      <dd className={`text-navy font-medium ${mono ? "font-mono text-xs mt-0.5" : ""}`}>{valor}</dd>
    </div>
  );
}
