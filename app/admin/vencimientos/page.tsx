import { prisma } from "@/lib/prisma";
import { ESTADO_VENC_META, diasHasta } from "@/lib/vencimientos";
import { TIPO_DOC_META } from "@/lib/documentos";
import { TONE_CLASS } from "@/lib/admin";
import { cambiarEstadoVencimiento, crearVencimiento } from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { EstadoVencimiento, TipoDocumento } from "@prisma/client";

export const metadata = { title: "Vencimientos · Panel ENCOSEP" };

const ESTADOS: EstadoVencimiento[] = [
  "PENDIENTE",
  "CUMPLIDO",
  "VENCIDO",
  "PRORROGADO",
  "EXCEPTUADO",
];

export default async function VencimientosPage() {
  const [vencimientos, prestadoras] = await Promise.all([
    prisma.vencimiento.findMany({
      orderBy: { fechaLimite: "asc" },
      include: { prestadora: true },
    }),
    prisma.prestadora.findMany({ where: { activa: true }, orderBy: { razonSocial: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold text-navy">Calendario de vencimientos</h1>
        <p className="text-sm text-muted mt-1">
          Presentaciones obligatorias de las prestadoras: anuales y mensuales.
          El estado se marca automáticamente como{" "}
          <strong>vencido</strong> cuando pasa la fecha sin cumplir.
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-base font-extrabold text-navy mb-3">Nuevo vencimiento</h2>
        <form action={crearVencimiento} className="grid sm:grid-cols-2 gap-3">
          <Field label="Prestadora *">
            <select name="prestadoraId" required defaultValue="" className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper">
              <option value="" disabled>Seleccionar…</option>
              {prestadoras.map((p) => (
                <option key={p.id} value={p.id}>{p.razonSocial}</option>
              ))}
            </select>
          </Field>
          <Field label="Tipo de documento *">
            <select name="tipo" required defaultValue="" className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper">
              <option value="" disabled>Seleccionar…</option>
              {(Object.keys(TIPO_DOC_META) as TipoDocumento[]).map((t) => (
                <option key={t} value={t}>{TIPO_DOC_META[t].icon} {TIPO_DOC_META[t].label}</option>
              ))}
            </select>
          </Field>
          <Field label="Período *">
            <input name="periodo" type="text" required placeholder="2026 o 2026-05" className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
          </Field>
          <Field label="Fecha límite *">
            <input name="fechaLimite" type="date" required className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
          </Field>
          <Field label="Título *" full>
            <input name="titulo" type="text" required placeholder="ej: Certificación mensual de transporte" className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
          </Field>
          <Field label="Observación" full>
            <textarea name="observacion" rows={2} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
          </Field>
          <div className="sm:col-span-2">
            <SubmitButton className="px-5 py-3 rounded-xl bg-svc-red text-white font-bold text-sm" pendingText="Creando…">
              Crear vencimiento
            </SubmitButton>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-base font-extrabold text-navy mb-3">Próximos vencimientos · {vencimientos.length}</h2>
        {vencimientos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong bg-paper-2 p-8 text-center text-muted text-sm">
            Aún no hay vencimientos cargados.
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-paper overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted bg-paper-2">
                <tr>
                  <th className="text-left font-semibold py-3 px-4">Prestadora</th>
                  <th className="text-left font-semibold py-3 px-2">Tipo · Período</th>
                  <th className="text-left font-semibold py-3 px-2">Título</th>
                  <th className="text-left font-semibold py-3 px-2">Fecha límite</th>
                  <th className="text-left font-semibold py-3 px-2">Estado</th>
                  <th className="text-left font-semibold py-3 px-4">Acción</th>
                </tr>
              </thead>
              <tbody>
                {vencimientos.map((v) => {
                  const m = ESTADO_VENC_META[v.estado];
                  const dias = diasHasta(v.fechaLimite);
                  const enRojo = v.estado === "VENCIDO" || (v.estado === "PENDIENTE" && dias < 0);
                  const enAmarillo = v.estado === "PENDIENTE" && dias >= 0 && dias <= 7;
                  return (
                    <tr key={v.id} className="border-t border-line hover:bg-paper-2">
                      <td className="py-2.5 px-4 text-navy">{v.prestadora.razonSocial}</td>
                      <td className="py-2.5 px-2 text-muted text-xs">
                        {TIPO_DOC_META[v.tipo].label} · {v.periodo}
                      </td>
                      <td className="py-2.5 px-2 text-navy">{v.titulo}</td>
                      <td className={`py-2.5 px-2 ${enRojo ? "text-svc-red font-bold" : enAmarillo ? "text-svc-orange font-semibold" : "text-navy"}`}>
                        {v.fechaLimite.toLocaleDateString("es-AR")}
                        {v.estado === "PENDIENTE" && (
                          <div className="text-[10px] font-normal">
                            {dias < 0 ? `vencido hace ${Math.abs(dias)} días` : dias === 0 ? "hoy" : `en ${dias} días`}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`inline-flex items-center uppercase tracking-wider font-bold rounded-full border text-[10px] px-2 py-0.5 ${TONE_CLASS[m.tone]}`}>
                          {m.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <form action={cambiarEstadoVencimiento} className="flex gap-1">
                          <input type="hidden" name="id" value={v.id} />
                          <select name="estado" defaultValue={v.estado} className="px-2 py-1 rounded border border-line-strong text-xs bg-paper">
                            {ESTADOS.map((e) => (
                              <option key={e} value={e}>{ESTADO_VENC_META[e].label}</option>
                            ))}
                          </select>
                          <SubmitButton className="px-2 py-1 rounded bg-navy-2 text-white text-xs font-semibold" pendingText="Guardando…">
                            Aplicar
                          </SubmitButton>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
