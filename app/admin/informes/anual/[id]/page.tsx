import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeExportarInformes, TONE_CLASS } from "@/lib/admin";
import {
  actualizarBloquesAnual,
  publicarInformeAnual,
  regenerarBorradorAnual,
} from "../../actions";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { BloquesInformeAnual } from "@/lib/informe-anual-borrador";
import type { InformeAnualData } from "@/lib/informe-anual-data";

export const metadata = { title: "Informe anual · Panel ENCOSEP" };

const ESTADO_META = {
  BORRADOR: { label: "Borrador", tone: "warning" as const },
  PUBLICADO: { label: "Publicado", tone: "success" as const },
  ARCHIVADO: { label: "Archivado", tone: "neutral" as const },
};

export default async function InformeAnualDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || !puedeExportarInformes(session.user.rol)) {
    redirect("/admin");
  }
  const { id } = await params;
  const informe = await prisma.informeAnual.findUnique({
    where: { id },
    include: { emitidoPor: true },
  });
  if (!informe) notFound();

  const bloques = informe.bloques as unknown as BloquesInformeAnual;
  const metricas = informe.metricas as unknown as InformeAnualData;
  const meta = ESTADO_META[informe.estado];
  const editable = informe.estado === "BORRADOR";

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumbs
        items={[
          { label: "Panel", href: "/admin" },
          { label: "Informes oficiales", href: "/admin/informes" },
          { label: informe.titulo },
        ]}
      />

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold text-navy">
              {informe.titulo}
            </h1>
            <span
              className={`inline-flex items-center uppercase tracking-wider font-bold rounded-full border text-xs px-2.5 py-1 ${TONE_CLASS[meta.tone]}`}
            >
              {meta.label}
            </span>
          </div>
          <p className="text-sm text-muted mt-1">
            Art. 5° Ord. 13.189/17 · Período{" "}
            {informe.periodoDesde.toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}{" "}
            →{" "}
            {informe.periodoHasta.toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            {informe.emitidoPor && (
              <>
                {" · "}
                Emitido por {informe.emitidoPor.nombre}{" "}
                {informe.emitidoPor.apellido} el{" "}
                {informe.emitidoEn?.toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </>
            )}
          </p>
        </div>
        <a
          href={`/api/informes/anual/${informe.id}`}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-navy text-white text-sm font-bold"
        >
          📄 Descargar .docx
        </a>
      </header>

      {/* KPIs del período */}
      <section className="rounded-2xl border border-line bg-paper-2 p-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
        <Stat label="Reclamos" value={metricas.totalReclamos} />
        <Stat
          label="% Resueltos"
          value={
            metricas.totalReclamos > 0
              ? `${Math.round((metricas.totalReclamosResueltos / metricas.totalReclamos) * 100)}%`
              : "—"
          }
        />
        <Stat label="Inspecciones" value={metricas.totalInspecciones} />
        <Stat
          label="Expedientes (abr/cer)"
          value={`${metricas.totalExpedientesAbiertos} / ${metricas.totalExpedientesCerrados}`}
        />
        <Stat
          label="Audiencias"
          value={metricas.totalAudienciasRealizadas}
        />
      </section>

      {/* Serie temporal y mensuales publicados */}
      <section className="rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-3">
          Movimiento mes a mes
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted bg-paper-2">
              <tr>
                <th className="text-left font-semibold py-2 px-2">Mes</th>
                <th className="text-left font-semibold py-2 px-2">Reclamos</th>
                <th className="text-left font-semibold py-2 px-2">Inspecciones</th>
                <th className="text-left font-semibold py-2 px-2">Encuestas</th>
                <th className="text-left font-semibold py-2 px-2">
                  Informe mensual
                </th>
              </tr>
            </thead>
            <tbody>
              {metricas.serieTemporal.map((m) => (
                <tr
                  key={`${m.anio}-${m.mes}`}
                  className="border-t border-line"
                >
                  <td className="py-2 px-2 font-semibold text-navy">
                    {m.label}
                  </td>
                  <td className="py-2 px-2 text-navy">{m.reclamos}</td>
                  <td className="py-2 px-2 text-navy">{m.inspecciones}</td>
                  <td className="py-2 px-2 text-navy">{m.encuestaRespuestas}</td>
                  <td className="py-2 px-2 text-xs">
                    {m.informeMensualId ? (
                      <Link
                        href={`/admin/informes/mensual/${m.informeMensualId}`}
                        className="text-navy-2 underline"
                      >
                        {m.informeMensualEstado === "PUBLICADO"
                          ? "✓ Publicado"
                          : m.informeMensualEstado === "BORRADOR"
                            ? "Borrador"
                            : "Archivado"}
                      </Link>
                    ) : (
                      <span className="text-muted">— Sin generar</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editable && (
        <div className="flex gap-2 flex-wrap">
          <form action={regenerarBorradorAnual}>
            <input type="hidden" name="informeId" value={informe.id} />
            <SubmitButton
              className="px-3 py-2 rounded-lg border border-line-strong text-navy text-xs font-semibold hover:bg-paper-2"
              title="Recalcula los datos del período y reemplaza los textos sugeridos con un borrador nuevo. Cuidado: pierde tus ediciones."
              pendingText="Generando…"
            >
              🔄 Regenerar borrador desde datos actuales
            </SubmitButton>
          </form>
        </div>
      )}

      <form action={actualizarBloquesAnual} className="flex flex-col gap-6">
        <input type="hidden" name="informeId" value={informe.id} />

        <Section titulo="Título del informe">
          <input
            name="titulo"
            type="text"
            defaultValue={informe.titulo}
            readOnly={!editable}
            maxLength={200}
            className={`px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy text-sm ${editable ? "" : "bg-paper-2"}`}
          />
        </Section>

        <Section titulo="Balance del ejercicio">
          <TextField
            name="balance"
            defaultValue={bloques.balance}
            editable={editable}
            rows={14}
          />
        </Section>

        <Section titulo="Logros de la gestión">
          <TextField
            name="logros"
            defaultValue={bloques.logros}
            editable={editable}
            rows={8}
          />
        </Section>

        <Section titulo="Desafíos identificados">
          <TextField
            name="desafios"
            defaultValue={bloques.desafios}
            editable={editable}
            rows={8}
          />
        </Section>

        <Section titulo="Sugerencias del Directorio">
          <TextField
            name="sugerencias"
            defaultValue={bloques.sugerencias}
            editable={editable}
            rows={8}
          />
        </Section>

        {editable && (
          <div className="flex gap-3 flex-wrap sticky bottom-3 bg-paper border border-line-strong rounded-2xl p-3 shadow-lg">
            <SubmitButton
              className="px-5 py-2.5 rounded-lg bg-navy text-white font-bold text-sm"
              pendingText="Guardando…"
            >
              💾 Guardar cambios
            </SubmitButton>
            <span className="text-xs text-muted self-center">
              Para emitir oficialmente, usá el botón verde de abajo.
            </span>
          </div>
        )}
      </form>

      {editable && (
        <form
          action={publicarInformeAnual}
          className="rounded-2xl border-2 border-svc-green/40 bg-svc-green/5 p-5 flex items-center justify-between gap-3 flex-wrap"
        >
          <div>
            <h3 className="text-sm font-bold text-navy uppercase tracking-wider">
              Publicar informe anual
            </h3>
            <p className="text-xs text-muted mt-1">
              Marca el informe como oficial y registra tu nombre como emisor.
            </p>
          </div>
          <input type="hidden" name="informeId" value={informe.id} />
          <SubmitButton
            className="px-5 py-2.5 rounded-lg bg-svc-green text-white font-bold text-sm"
            pendingText="Publicando…"
          >
            ✓ Publicar informe anual
          </SubmitButton>
        </form>
      )}

      {metricas.mensualesPublicados.length > 0 && (
        <section className="rounded-2xl border border-line bg-paper-2 p-5">
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-3">
            Informes mensuales publicados en el período (
            {metricas.mensualesPublicados.length})
          </h2>
          <ul className="text-sm text-navy grid sm:grid-cols-2 gap-1">
            {metricas.mensualesPublicados.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/admin/informes/mensual/${m.id}`}
                  className="text-navy-2 underline"
                >
                  {String(m.mes).padStart(2, "0")}/{m.anio}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Section({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-paper p-5 flex flex-col gap-2">
      <h2 className="text-sm font-bold text-navy uppercase tracking-wider">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function TextField({
  name,
  defaultValue,
  editable,
  rows,
}: {
  name: string;
  defaultValue: string;
  editable: boolean;
  rows: number;
}) {
  return (
    <textarea
      name={name}
      defaultValue={defaultValue}
      readOnly={!editable}
      rows={rows}
      maxLength={80000}
      className={`px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy text-sm leading-relaxed resize-y ${editable ? "" : "bg-paper-2 cursor-default"}`}
    />
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </div>
      <div className="text-2xl font-extrabold text-navy">{value}</div>
    </div>
  );
}
