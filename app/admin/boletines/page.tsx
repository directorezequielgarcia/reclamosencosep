import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TIPO_BOLETIN_META } from "@/lib/boletines";
import { alternarPublicado, borrarBoletin, crearBoletin } from "./actions";
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
            <button type="submit" className="px-5 py-3 rounded-xl bg-svc-red text-white font-bold text-sm">
              Crear boletín
            </button>
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
                <li key={b.id} className="rounded-xl border border-line bg-paper p-4 flex items-start gap-3">
                  <span className="text-2xl">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="uppercase tracking-wider font-bold text-svc-orange">{m.label}</span>
                      {b.numero && <span className="font-mono text-muted">#{b.numero}</span>}
                      <span className="text-muted">·</span>
                      <span className="text-muted">{b.fechaPublicacion.toLocaleDateString("es-AR")}</span>
                      {!b.publicado && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-paper-3 text-muted font-bold">BORRADOR</span>}
                    </div>
                    <div className="text-base font-bold text-navy mt-1">{b.titulo}</div>
                    {b.resumen && <div className="text-sm text-muted mt-1 truncate">{b.resumen}</div>}
                  </div>
                  <form action={alternarPublicado}>
                    <input type="hidden" name="id" value={b.id} />
                    <button type="submit" className="text-xs px-2 py-1 rounded border border-line-strong text-navy">
                      {b.publicado ? "Despublicar" : "Publicar"}
                    </button>
                  </form>
                  <form action={borrarBoletin}>
                    <input type="hidden" name="id" value={b.id} />
                    <button type="submit" className="text-xs px-2 py-1 rounded border border-svc-red/40 text-svc-red">
                      Borrar
                    </button>
                  </form>
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
