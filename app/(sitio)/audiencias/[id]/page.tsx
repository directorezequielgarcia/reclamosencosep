import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { ESTADO_AUDIENCIA_META, MODALIDAD_META, audienciaPermiteInscripcion } from "@/lib/audiencias";
import { TONE_CLASS } from "@/lib/admin";
import { inscribirseAudiencia } from "@/app/admin/audiencias/actions";

export const metadata = { title: "Audiencia · ENCOSEP" };

export default async function AudienciaDetallePublico({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ inscripto?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const yaInscripto = sp.inscripto === "1";

  const a = await prisma.audienciaPublica.findUnique({
    where: { id },
    include: { _count: { select: { inscripciones: true } } },
  });
  if (!a) notFound();

  const m = ESTADO_AUDIENCIA_META[a.estado];
  const puede = audienciaPermiteInscripcion(a.estado);

  return (
    <>
      <SeccionHeader
        kicker="Audiencia pública"
        titulo={a.titulo}
        descripcion={a.descripcion}
      />
      <main className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-6">
        <section className="rounded-2xl border border-line bg-paper p-5">
          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            <span className={`inline-flex items-center uppercase tracking-wider font-bold rounded-full border px-2 py-0.5 ${TONE_CLASS[m.tone]}`}>
              {m.label}
            </span>
            <span className="text-muted">{MODALIDAD_META[a.modalidad].icon} {MODALIDAD_META[a.modalidad].label}</span>
          </div>
          <div className="text-base font-bold text-navy mt-2">
            {a.fecha.toLocaleString("es-AR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          {a.lugar && <div className="text-sm text-navy mt-1">📍 {a.lugar}</div>}
          {a.enlaceVirtual && (
            <div className="text-sm text-navy-2 mt-1 break-all">
              💻 <a href={a.enlaceVirtual} target="_blank" rel="noreferrer" className="underline">{a.enlaceVirtual}</a>
            </div>
          )}
          {a.capacidad && (
            <div className="text-xs text-muted mt-2">
              Inscriptos: {a._count.inscripciones} / {a.capacidad}
            </div>
          )}
        </section>

        {yaInscripto ? (
          <section className="rounded-2xl border-2 border-svc-green bg-svc-green/10 p-6 text-center">
            <div className="text-5xl mb-2">✓</div>
            <h2 className="text-xl font-extrabold text-navy">¡Inscripción registrada!</h2>
            <p className="text-sm text-navy mt-2">
              Recibirás un recordatorio en el email que ingresaste.
            </p>
          </section>
        ) : puede ? (
          <section className="rounded-2xl border border-line bg-paper p-5">
            <h2 className="text-base font-extrabold text-navy">Inscribirse</h2>
            <form action={inscribirseAudiencia} className="grid sm:grid-cols-2 gap-3 mt-3">
              <input type="hidden" name="audienciaId" value={a.id} />
              <Field label="Nombre *">
                <input name="nombre" type="text" required className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
              </Field>
              <Field label="Apellido *">
                <input name="apellido" type="text" required className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
              </Field>
              <Field label="DNI *">
                <input name="dni" type="text" inputMode="numeric" required className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
              </Field>
              <Field label="Email *">
                <input name="email" type="email" required className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
              </Field>
              <Field label="Teléfono (opcional)">
                <input name="telefono" type="tel" className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
              </Field>
              <Field label="¿Querés comentar algo? (opcional)" full>
                <textarea name="comentario" rows={2} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
              </Field>
              <div className="sm:col-span-2">
                <button type="submit" className="w-full px-5 py-3 rounded-xl bg-svc-red text-white font-bold uppercase tracking-wider text-sm">
                  Confirmar inscripción
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-line-strong bg-paper-2 p-6 text-center text-sm text-muted">
            La inscripción a esta audiencia ya no está abierta.
          </section>
        )}

        <Link href="/audiencias" className="text-center text-xs text-muted underline underline-offset-4">
          ← Ver todas las audiencias
        </Link>
      </main>
    </>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">{label}</span>
      {children}
    </label>
  );
}
