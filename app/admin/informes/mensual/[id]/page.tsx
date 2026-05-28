import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeExportarInformes, TONE_CLASS } from "@/lib/admin";
import {
  actualizarBloques,
  publicarInforme,
  regenerarBorrador,
} from "../../actions";
import type { BloquesInforme } from "@/lib/informe-mensual-borrador";
import type { InformeMensualData } from "@/lib/informe-mensual-data";

export const metadata = { title: "Informe mensual · Panel ENCOSEP" };

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const ESTADO_META: Record<
  "BORRADOR" | "PUBLICADO" | "ARCHIVADO",
  { label: string; tone: "warning" | "success" | "neutral" }
> = {
  BORRADOR: { label: "Borrador", tone: "warning" },
  PUBLICADO: { label: "Publicado", tone: "success" },
  ARCHIVADO: { label: "Archivado", tone: "neutral" },
};

const NOMBRE_SECCION: Record<string, string> = {
  seccion1: "1. Situación general de la prestación",
  seccion2: "2. Detalle de las irregularidades detectadas",
  seccion3:
    "3. Alteraciones que afectan a la comunidad y/o usuarios con indicación geográfica",
  seccion4: "4. Repeticiones del mes (puntos 2 y 3)",
  seccion5:
    "5. Información cursada y recibida del prestador y cumplimiento de medidas",
  seccion6: "6. Evaluación de la conducta del concesionario o prestador",
  seccion7: "7. Registros de los hechos relevados y avance de remediación",
};

export default async function InformeMensualDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || !puedeExportarInformes(session.user.rol)) {
    redirect("/admin");
  }
  const { id } = await params;

  const informe = await prisma.informeMensual.findUnique({
    where: { id },
    include: { emitidoPor: true },
  });
  if (!informe) notFound();

  const bloques = informe.bloques as unknown as BloquesInforme;
  const metricas = informe.metricas as unknown as InformeMensualData;
  const meta = ESTADO_META[informe.estado];
  const editable = informe.estado === "BORRADOR";

  // Lista ordenada de servicios para mantener consistencia visual
  const serviciosKinds = Object.keys(bloques.seccion1.porServicio);

  return (
    <div className="flex flex-col gap-5">
      <nav className="text-xs text-muted">
        <Link href="/admin/informes" className="hover:underline">
          ← Informes oficiales
        </Link>
      </nav>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold text-navy">
              Informe Mensual — {MESES[informe.mes - 1]} {informe.anio}
            </h1>
            <span
              className={`inline-flex items-center uppercase tracking-wider font-bold rounded-full border text-xs px-2.5 py-1 ${TONE_CLASS[meta.tone]}`}
            >
              {meta.label}
            </span>
          </div>
          <p className="text-sm text-muted mt-1">
            Art. 5° inc. k Ord. 13.189/17 · 7 secciones obligatorias
            {informe.emitidoPor && (
              <>
                {" · "}Emitido por {informe.emitidoPor.nombre}{" "}
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
      </header>

      <section className="rounded-2xl border border-line bg-paper-2 p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Stat label="Reclamos del mes" value={metricas.generales.totalReclamosMes} />
        <Stat
          label="Inspecciones publicadas"
          value={metricas.generales.totalInspeccionesMes}
        />
        <Stat
          label="Expedientes movidos"
          value={metricas.generales.totalExpedientesMovidos}
        />
        <Stat
          label="Audiencias realizadas"
          value={metricas.generales.audienciasRealizadas}
        />
      </section>

      {editable && (
        <div className="flex gap-2 flex-wrap">
          <form action={regenerarBorrador}>
            <input type="hidden" name="informeId" value={informe.id} />
            <button
              type="submit"
              className="px-3 py-2 rounded-lg border border-line-strong text-navy text-xs font-semibold hover:bg-paper-2"
              title="Recalcula los datos del mes y reemplaza los textos sugeridos con un borrador nuevo. Cuidado: pierde tus ediciones."
            >
              🔄 Regenerar borrador desde datos actuales
            </button>
          </form>
        </div>
      )}

      <form action={actualizarBloques} className="flex flex-col gap-6">
        <input type="hidden" name="informeId" value={informe.id} />

        {/* Sección 1 */}
        <Section titulo={NOMBRE_SECCION.seccion1}>
          <TextField
            label="Introducción general"
            name="seccion1.intro"
            defaultValue={bloques.seccion1.intro}
            editable={editable}
            rows={3}
          />
          {serviciosKinds.map((k) => (
            <TextField
              key={`s1-${k}`}
              label={`Por servicio: ${k}`}
              name={`seccion1.porServicio.${k}`}
              defaultValue={bloques.seccion1.porServicio[k] ?? ""}
              editable={editable}
              rows={8}
            />
          ))}
        </Section>

        {/* Sección 2 */}
        <Section titulo={NOMBRE_SECCION.seccion2}>
          {serviciosKinds.map((k) => (
            <TextField
              key={`s2-${k}`}
              label={`Por servicio: ${k}`}
              name={`seccion2.porServicio.${k}`}
              defaultValue={bloques.seccion2.porServicio[k] ?? ""}
              editable={editable}
              rows={6}
            />
          ))}
        </Section>

        {/* Sección 3 */}
        <Section titulo={NOMBRE_SECCION.seccion3}>
          {serviciosKinds.map((k) => (
            <TextField
              key={`s3-${k}`}
              label={`Por servicio: ${k}`}
              name={`seccion3.porServicio.${k}`}
              defaultValue={bloques.seccion3.porServicio[k] ?? ""}
              editable={editable}
              rows={6}
            />
          ))}
        </Section>

        {/* Secciones 4 a 7 (texto plano) */}
        {(["seccion4", "seccion5", "seccion6", "seccion7"] as const).map((k) => (
          <Section key={k} titulo={NOMBRE_SECCION[k]}>
            <TextField
              label="Texto"
              name={k}
              defaultValue={bloques[k]}
              editable={editable}
              rows={8}
            />
          </Section>
        ))}

        {editable && (
          <div className="flex gap-3 flex-wrap sticky bottom-3 bg-paper border border-line-strong rounded-2xl p-3 shadow-lg">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-navy text-white font-bold text-sm"
            >
              💾 Guardar cambios
            </button>
            <span className="text-xs text-muted self-center">
              Los cambios se guardan sin publicar. Para emitir el informe oficial
              usá el botón "Publicar".
            </span>
          </div>
        )}
      </form>

      {editable && (
        <form
          action={publicarInforme}
          className="rounded-2xl border-2 border-svc-green/40 bg-svc-green/5 p-5 flex items-center justify-between gap-3 flex-wrap"
        >
          <div>
            <h3 className="text-sm font-bold text-navy uppercase tracking-wider">
              Publicar informe
            </h3>
            <p className="text-xs text-muted mt-1">
              Marca el informe como oficial y registra tu nombre como emisor.
              Acordate de guardar los cambios antes de publicar.
            </p>
          </div>
          <input type="hidden" name="informeId" value={informe.id} />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-svc-green text-white font-bold text-sm"
          >
            ✓ Publicar informe oficial
          </button>
        </form>
      )}

      <div className="rounded-2xl border border-line bg-paper-2 p-5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-navy uppercase tracking-wider">
            Descargar .docx
          </h3>
          <p className="text-xs text-muted mt-1">
            La exportación con plantilla institucional (Calibri 11 pt,
            interlineado simple, encabezado del Ente) se habilita en el próximo
            deploy. Por ahora podés copiar los bloques de arriba a Word.
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-paper-3 text-muted text-[11px] font-bold uppercase tracking-wider">
          Próximamente
        </span>
      </div>
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
    <section className="rounded-2xl border border-line bg-paper p-5 flex flex-col gap-4">
      <h2 className="text-sm font-bold text-navy uppercase tracking-wider">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  editable,
  rows,
}: {
  label: string;
  name: string;
  defaultValue: string;
  editable: boolean;
  rows: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        readOnly={!editable}
        rows={rows}
        maxLength={40000}
        className={`px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy text-sm leading-relaxed resize-y ${editable ? "" : "bg-paper-2 cursor-default"}`}
      />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </div>
      <div className="text-2xl font-extrabold text-navy">{value}</div>
    </div>
  );
}
