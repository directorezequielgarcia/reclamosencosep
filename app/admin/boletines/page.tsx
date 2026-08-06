import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TIPO_BOLETIN_META } from "@/lib/boletines";
import {
  actualizarBoletin,
  alternarPublicado,
  borrarBoletin,
  crearBoletin,
} from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { TipoBoletin } from "@prisma/client";

export const metadata = { title: "Boletines · Panel ENCOSEP" };

export default async function BoletinesAdminPage() {
  const boletines = await prisma.boletin.findMany({
    orderBy: { fechaPublicacion: "desc" },
    include: { autor: true },
  });

  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold text-navy">Boletines y comunicaciones</h1>
        <p className="text-sm text-muted mt-1">
          Publicaciones oficiales del Ente: boletines, comunicados, notas de prensa y menciones en medios.
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-base font-extrabold text-navy mb-3">Nuevo boletín</h2>
        <form action={crearBoletin} className="grid sm:grid-cols-2 gap-3">
          <Field label="Tipo *">
            <select name="tipo" required defaultValue="" className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper">
              <option value="" disabled>Seleccionar…</option>
              {(Object.keys(TIPO_BOLETIN_META) as TipoBoletin[]).map((t) => (
                <option key={t} value={t}>{TIPO_BOLETIN_META[t].icon} {TIPO_BOLETIN_META[t].label}</option>
              ))}
            </select>
          </Field>
          <Field label="Número (opcional)">
            <input name="numero" type="text" placeholder="ej: 023/2026" className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
          </Field>
          <Field label="Título *" full>
            <input name="titulo" type="text" required className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
          </Field>
          <Field label="Resumen" full>
            <textarea name="resumen" rows={2} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
          </Field>
          <Field label="Cuerpo (opcional)" full>
            <textarea name="cuerpo" rows={5} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
          </Field>
          <Field label="Foto (opcional)">
            <input name="foto" type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="text-sm" />
          </Field>
          <Field label="Video (opcional, link YouTube/Vimeo o archivo)">
            <input name="videoUrl" type="url" placeholder="https://youtube.com/watch?v=…" className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
          </Field>
          <Field label="Fuente (para clippings)">
            <input name="fuente" type="text" placeholder="ej: Diario Crónica" className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
          </Field>
          <Field label="Enlace externo">
            <input name="enlaceExterno" type="url" placeholder="https://…" className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
          </Field>
          <Field label="Fecha de publicación *">
            <input name="fechaPublicacion" type="date" required defaultValue={hoy} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
          </Field>
          <label className="flex items-center gap-2 mt-6">
            <input type="checkbox" name="publicado" defaultChecked />
            <span className="text-sm text-navy">Publicado (visible en el sitio público)</span>
          </label>
          <div className="sm:col-span-2 flex gap-2">
            <SubmitButton className="px-5 py-3 rounded-xl bg-svc-red text-white font-bold text-sm" pendingText="Creando…">
              Crear boletín
            </SubmitButton>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-base font-extrabold text-navy mb-3">
          Publicaciones · {boletines.length}
        </h2>
        {boletines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong bg-paper-2 p-8 text-center text-muted text-sm">
            Todavía no se cargó ningún boletín.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {boletines.map((b) => {
              const m = TIPO_BOLETIN_META[b.tipo];
              return (
                <li key={b.id} className="rounded-xl border border-line bg-paper p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap text-[11px]">
                        <span className="uppercase tracking-wider font-bold text-svc-orange">{m.label}</span>
                        {b.numero && <span className="font-mono text-muted">#{b.numero}</span>}
                        <span className="text-muted">·</span>
                        <span className="text-muted">{b.fechaPublicacion.toLocaleDateString("es-AR")}</span>
                        {b.fotoUrl && <span title="Tiene foto">📷</span>}
                        {b.videoUrl && <span title="Tiene video">🎥</span>}
                        {!b.publicado && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-paper-3 text-muted font-bold">BORRADOR</span>}
                      </div>
                      <div className="text-base font-bold text-navy mt-1">{b.titulo}</div>
                      {b.resumen && <div className="text-sm text-muted mt-1 truncate">{b.resumen}</div>}
                    </div>
                    <form action={alternarPublicado}>
                      <input type="hidden" name="id" value={b.id} />
                      <SubmitButton className="text-xs px-2 py-1 rounded border border-line-strong text-navy" pendingText="Procesando…">
                        {b.publicado ? "Despublicar" : "Publicar"}
                      </SubmitButton>
                    </form>
                    <form action={borrarBoletin}>
                      <input type="hidden" name="id" value={b.id} />
                      <SubmitButton className="text-xs px-2 py-1 rounded border border-svc-red/40 text-svc-red" pendingText="Borrando…">
                        Borrar
                      </SubmitButton>
                    </form>
                  </div>

                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-bold text-navy-2">
                      Editar (foto, video, texto…)
                    </summary>
                    <form
                      action={actualizarBoletin}
                      className="grid sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-line"
                    >
                      <input type="hidden" name="id" value={b.id} />
                      <Field label="Tipo *">
                        <select name="tipo" required defaultValue={b.tipo} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper">
                          {(Object.keys(TIPO_BOLETIN_META) as TipoBoletin[]).map((t) => (
                            <option key={t} value={t}>{TIPO_BOLETIN_META[t].icon} {TIPO_BOLETIN_META[t].label}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Número (opcional)">
                        <input name="numero" type="text" defaultValue={b.numero ?? ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
                      </Field>
                      <Field label="Título *" full>
                        <input name="titulo" type="text" required defaultValue={b.titulo} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
                      </Field>
                      <Field label="Resumen" full>
                        <textarea name="resumen" rows={2} defaultValue={b.resumen ?? ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
                      </Field>
                      <Field label="Cuerpo (opcional)" full>
                        <textarea name="cuerpo" rows={5} defaultValue={b.cuerpo ?? ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
                      </Field>
                      <Field label={b.fotoUrl ? "Reemplazar foto" : "Foto (opcional)"}>
                        <input name="foto" type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="text-sm" />
                        {b.fotoUrl && (
                          <a href={b.fotoUrl} target="_blank" rel="noreferrer" className="text-xs text-navy-2 underline mt-1">
                            Ver foto actual
                          </a>
                        )}
                      </Field>
                      <Field label="Video (opcional, link YouTube/Vimeo o archivo)">
                        <input name="videoUrl" type="url" defaultValue={b.videoUrl ?? ""} placeholder="https://youtube.com/watch?v=…" className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
                      </Field>
                      <Field label="Fuente (para clippings)">
                        <input name="fuente" type="text" defaultValue={b.fuente ?? ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
                      </Field>
                      <Field label="Enlace externo">
                        <input name="enlaceExterno" type="url" defaultValue={b.enlaceExterno ?? ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
                      </Field>
                      <Field label="Fecha de publicación *">
                        <input name="fechaPublicacion" type="date" required defaultValue={b.fechaPublicacion.toISOString().slice(0, 10)} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
                      </Field>
                      <label className="flex items-center gap-2 mt-6">
                        <input type="checkbox" name="publicado" defaultChecked={b.publicado} />
                        <span className="text-sm text-navy">Publicado (visible en el sitio público)</span>
                      </label>
                      <div className="sm:col-span-2">
                        <SubmitButton className="px-5 py-2.5 rounded-xl bg-navy-2 text-white font-bold text-sm" pendingText="Guardando…">
                          Guardar cambios
                        </SubmitButton>
                      </div>
                    </form>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
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
