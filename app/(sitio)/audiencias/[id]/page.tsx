import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import {
  ESTADO_AUDIENCIA_META,
  MODALIDAD_META,
  audienciaPermiteInscripcion,
} from "@/lib/audiencias";
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
  const yaSeRealizo =
    a.estado === "REALIZADA" ||
    new Date(a.fecha).getTime() < Date.now() - 1000 * 60 * 60 * 24;

  return (
    <>
      <SeccionHeader
        kicker={a.expedienteNumero ?? "Audiencia pública"}
        titulo={a.titulo}
        descripcion={a.descripcion}
      />

      <main className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-6">
        {/* DATOS CLAVE */}
        <section className="rounded-2xl border border-line bg-paper p-5">
          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            <span
              className={`inline-flex items-center uppercase tracking-wider font-bold rounded-full border px-2 py-0.5 ${TONE_CLASS[m.tone]}`}
            >
              {m.label}
            </span>
            <span className="text-muted">
              {MODALIDAD_META[a.modalidad].icon} {MODALIDAD_META[a.modalidad].label}
            </span>
            {a.expedienteNumero && (
              <>
                <span className="text-muted">·</span>
                <span className="text-muted font-mono">{a.expedienteNumero}</span>
              </>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
            <DatoClave label="Fecha y hora">
              {a.fecha.toLocaleString("es-AR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              hs
            </DatoClave>
            {a.lugar && <DatoClave label="Lugar">📍 {a.lugar}</DatoClave>}
            {a.enlaceVirtual && (
              <DatoClave label="Enlace virtual">
                <a
                  href={a.enlaceVirtual}
                  target="_blank"
                  rel="noreferrer"
                  className="text-navy-2 underline break-all"
                >
                  {a.enlaceVirtual}
                </a>
              </DatoClave>
            )}
            {a.inscripcionCierra && puede && (
              <DatoClave label="Cierre de inscripción">
                {a.inscripcionCierra.toLocaleString("es-AR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                hs
              </DatoClave>
            )}
            <DatoClave label="Inscriptos">
              {a._count.inscripciones}
              {a.capacidad ? ` / ${a.capacidad}` : ""}
            </DatoClave>
            {a.convocatoriaPublicadaEn && (
              <DatoClave label="Convocatoria publicada">
                {a.convocatoriaPublicadaEn.toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </DatoClave>
            )}
          </div>
        </section>

        {/* ARCHIVOS OFICIALES */}
        {(a.expedienteUrl || a.ordenDiaUrl) && (
          <section className="rounded-2xl border border-line bg-paper-2 p-5">
            <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-3">
              Documentación oficial
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {a.expedienteUrl && (
                <a
                  href={a.expedienteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-line bg-paper p-3 hover:border-navy-2 transition"
                >
                  <span className="text-3xl">📄</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-svc-orange uppercase tracking-wider">
                      Expediente {a.expedienteNumero}
                    </div>
                    <div className="text-sm font-semibold text-navy mt-0.5">
                      {a.expedienteTitulo ?? "Expediente completo (PDF)"}
                    </div>
                    <div className="text-[11px] text-muted mt-0.5">
                      Tomar vista del expediente
                    </div>
                  </div>
                </a>
              )}
              {a.ordenDiaUrl && (
                <a
                  href={a.ordenDiaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-line bg-paper p-3 hover:border-navy-2 transition"
                >
                  <span className="text-3xl">📋</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-navy-2 uppercase tracking-wider">
                      Orden del día
                    </div>
                    <div className="text-sm font-semibold text-navy mt-0.5">
                      Orden del día de la audiencia (PDF)
                    </div>
                    <div className="text-[11px] text-muted mt-0.5">
                      Temario y participantes confirmados
                    </div>
                  </div>
                </a>
              )}
            </div>
          </section>
        )}

        {/* MATERIAL POST-AUDIENCIA — solo cuando ya se realizó */}
        {yaSeRealizo &&
          (a.videoUrl ||
            a.transcripcionTaquigraficaUrl ||
            a.transcripcionTaquigraficaTexto ||
            a.dictamenTexto ||
            a.dictamenUrl ||
            a.actaUrl ||
            a.actaTexto) && (
            <section className="rounded-2xl border-2 border-svc-green/40 bg-svc-green/5 p-5">
              <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-3">
                Material de la audiencia realizada
              </h2>
              {/* Reproductor embebido del video si es YouTube/Vimeo/archivo */}
              {a.videoUrl && <VideoEmbed url={a.videoUrl} />}

              <div className="grid sm:grid-cols-2 gap-3">
                {a.videoUrl && (
                  <a
                    href={a.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-line bg-paper p-3 hover:border-navy-2 transition"
                  >
                    <span className="text-3xl">🎥</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-svc-red uppercase tracking-wider">
                        Video de la audiencia
                      </div>
                      <div className="text-sm font-semibold text-navy mt-0.5 truncate">
                        Ver grabación en su origen
                      </div>
                    </div>
                  </a>
                )}
                {a.transcripcionTaquigraficaUrl && (
                  <a
                    href={a.transcripcionTaquigraficaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-line bg-paper p-3 hover:border-navy-2 transition"
                  >
                    <span className="text-3xl">📜</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-navy-2 uppercase tracking-wider">
                        Transcripción taquigráfica
                      </div>
                      <div className="text-sm font-semibold text-navy mt-0.5 truncate">
                        Descargar versión textual
                      </div>
                    </div>
                  </a>
                )}
                {a.dictamenUrl && (
                  <a
                    href={a.dictamenUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-line bg-paper p-3 hover:border-navy-2 transition"
                  >
                    <span className="text-3xl">⚖️</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-svc-green uppercase tracking-wider">
                        Dictamen del ENCOSEP
                      </div>
                      <div className="text-sm font-semibold text-navy mt-0.5 truncate">
                        Descargar dictamen institucional
                      </div>
                    </div>
                  </a>
                )}
                {a.actaUrl && (
                  <a
                    href={a.actaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-line bg-paper p-3 hover:border-navy-2 transition"
                  >
                    <span className="text-3xl">🗒️</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-svc-orange uppercase tracking-wider">
                        Acta de la audiencia
                      </div>
                      <div className="text-sm font-semibold text-navy mt-0.5 truncate">
                        Descargar acta firmada
                      </div>
                    </div>
                  </a>
                )}
              </div>

              {a.dictamenTexto && (
                <div className="mt-4 rounded-xl bg-paper p-4">
                  <h3 className="text-xs font-bold text-navy uppercase tracking-wider mb-2">
                    Dictamen del ENCOSEP (texto)
                  </h3>
                  <p className="text-sm text-navy whitespace-pre-wrap leading-relaxed">
                    {a.dictamenTexto}
                  </p>
                </div>
              )}

              {a.transcripcionTaquigraficaTexto && (
                <details className="mt-4 rounded-xl bg-paper p-4">
                  <summary className="cursor-pointer text-xs font-bold text-navy uppercase tracking-wider">
                    Transcripción taquigráfica (texto completo)
                  </summary>
                  <div className="text-sm text-navy whitespace-pre-wrap leading-relaxed mt-3">
                    {a.transcripcionTaquigraficaTexto}
                  </div>
                </details>
              )}
            </section>
          )}

        {/* CONVOCATORIA */}
        {a.convocatoriaTexto && (
          <section className="rounded-2xl border border-line bg-paper p-5">
            <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-3">
              Convocatoria oficial
            </h2>
            <div className="text-sm text-navy whitespace-pre-wrap leading-relaxed">
              {a.convocatoriaTexto}
            </div>
          </section>
        )}

        {/* INSCRIPCIÓN */}
        {yaInscripto ? (
          <section className="rounded-2xl border-2 border-svc-green bg-svc-green/10 p-6 text-center">
            <div className="text-5xl mb-2">✓</div>
            <h2 className="text-xl font-extrabold text-navy">
              ¡Inscripción registrada!
            </h2>
            <p className="text-sm text-navy mt-2">
              Recibirás un recordatorio en el email que ingresaste.
            </p>
          </section>
        ) : puede ? (
          <section className="rounded-2xl border-2 border-svc-red/40 bg-svc-red/5 p-5">
            <h2 className="text-base font-extrabold text-svc-red uppercase tracking-wider">
              Inscripción a la audiencia
            </h2>
            <p className="text-sm text-navy mt-2">
              La participación es <strong>libre y gratuita</strong>. Completá tus datos para anotarte.
            </p>
            <form action={inscribirseAudiencia} className="grid sm:grid-cols-2 gap-3 mt-4">
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
              <Field label="¿Querés hacer uso de la palabra?" full>
                <textarea
                  name="comentario"
                  rows={2}
                  placeholder="Si querés exponer en la audiencia, contanos brevemente el tema (opcional)."
                  className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y"
                />
              </Field>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full px-5 py-3 rounded-xl bg-svc-red text-white font-bold uppercase tracking-wider text-sm shadow-md shadow-svc-red/30"
                >
                  Confirmar inscripción
                </button>
              </div>
            </form>
            <p className="text-[11px] text-muted mt-3 leading-relaxed">
              También podés inscribirte presencialmente en Pasaje Valdivia N°
              435 (08:00–15:00), por mail a{" "}
              <a className="underline" href="mailto:infoencosep@gmail.com">
                infoencosep@gmail.com
              </a>{" "}
              o por WhatsApp al{" "}
              <a className="underline" href="https://wa.me/5492974303051">
                2974303051
              </a>
              .
            </p>
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-line-strong bg-paper-2 p-6 text-center text-sm text-muted">
            {yaSeRealizo
              ? "La inscripción a esta audiencia ya cerró."
              : "La inscripción aún no está abierta."}
          </section>
        )}

        {/* RESULTADO / ACTA POST-AUDIENCIA */}
        {(a.actaTexto || a.actaUrl || a.estado === "REALIZADA") && (
          <section className="rounded-2xl border-2 border-svc-green/40 bg-svc-green/5 p-5">
            <h2 className="text-base font-extrabold text-svc-green uppercase tracking-wider mb-3">
              Resultado de la audiencia
            </h2>
            {a.realizadaEn && (
              <div className="text-xs text-muted mb-3">
                Realizada el{" "}
                {a.realizadaEn.toLocaleString("es-AR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            )}
            {a.actaTexto && (
              <div className="text-sm text-navy whitespace-pre-wrap leading-relaxed">
                {a.actaTexto}
              </div>
            )}
            {a.actaUrl && (
              <a
                href={a.actaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-3 text-sm text-navy-2 font-bold underline underline-offset-4"
              >
                Descargar acta completa (PDF) →
              </a>
            )}
            {!a.actaTexto && !a.actaUrl && (
              <p className="text-sm text-muted">
                Próximamente publicaremos el acta y las conclusiones de la
                audiencia.
              </p>
            )}
          </section>
        )}

        <Link
          href="/audiencias"
          className="text-center text-xs text-muted underline underline-offset-4"
        >
          ← Ver todas las audiencias
        </Link>
      </main>
    </>
  );
}

function DatoClave({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
        {label}
      </div>
      <div className="text-navy mt-0.5">{children}</div>
    </div>
  );
}

/**
 * Reproductor compacto del video de la audiencia. Detecta YouTube, Vimeo o
 * un archivo directo y lo embebe responsivo (16:9). Si no reconoce la fuente,
 * no renderiza nada y se queda con el link tradicional de la tarjeta.
 */
function VideoEmbed({ url }: { url: string }) {
  // YouTube: youtu.be/<id> o youtube.com/watch?v=<id>
  const ytMatch =
    url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([A-Za-z0-9_-]{6,})/) ||
    url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/);
  if (ytMatch) {
    const id = ytMatch[1];
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-line bg-black mb-3">
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          title="Video de la audiencia"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    const id = vimeoMatch[1];
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-line bg-black mb-3">
        <iframe
          src={`https://player.vimeo.com/video/${id}`}
          title="Video de la audiencia"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }
  // Archivo directo (mp4/webm/ogg)
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
    return (
      <div className="rounded-xl overflow-hidden border border-line bg-black mb-3">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video controls src={url} className="w-full h-auto block">
          Tu navegador no puede reproducir este video.
        </video>
      </div>
    );
  }
  // Fuente desconocida: no embebemos, dejamos el link tradicional
  return null;
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </span>
      {children}
    </label>
  );
}
