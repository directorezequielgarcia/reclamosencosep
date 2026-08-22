import { prisma } from "@/lib/prisma";
import {
  actualizarAuditoria,
  agregarDocumentoAuditoria,
  alternarPublicadoAuditoria,
  borrarAuditoria,
  borrarDocumentoAuditoria,
  crearAuditoria,
} from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const metadata = { title: "Auditorías · Panel ENCOSEP" };

export default async function AuditoriasAdminPage() {
  const [auditorias, prestadoras] = await Promise.all([
    prisma.auditoria.findMany({
      orderBy: { createdAt: "desc" },
      include: { prestadora: true, documentos: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.prestadora.findMany({ where: { activa: true }, orderBy: { razonSocial: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold text-navy">Auditorías a prestadoras</h1>
        <p className="text-sm text-muted mt-1">
          Registro interno de auditorías (propias o de otros organismos) a las prestadoras controladas.
          Se cargan como borrador y se publican cuando el Directorio decide comunicarlas.
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-base font-extrabold text-navy mb-3">Nueva auditoría</h2>
        <form action={crearAuditoria} className="grid sm:grid-cols-2 gap-3">
          <Field label="Título *" full>
            <input name="titulo" type="text" required placeholder="ej: Auditoría Económico-Financiera SCPL" className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
          </Field>
          <Field label="Prestadora">
            <select name="prestadoraId" defaultValue="" className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper">
              <option value="">— Sin asociar —</option>
              {prestadoras.map((p) => (
                <option key={p.id} value={p.id}>{p.razonSocial}</option>
              ))}
            </select>
          </Field>
          <Field label="Expediente">
            <input name="expediente" type="text" placeholder="Expte. Municipal N° 1979-M-2024" className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
          </Field>
          <Field label="Auditor / área responsable">
            <input name="auditorResponsable" type="text" placeholder="Sec. de Economía, Finanzas y Control de Gestión (MCR)" className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
          </Field>
          <Field label="Tipo de auditoría">
            <input name="tipoAuditoria" type="text" placeholder="Auditoría de Cumplimiento (ISSAI 4100)" className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
          </Field>
          <Field label="Período auditado">
            <input name="periodoAuditado" type="text" placeholder="01/01/2021 – 31/12/2024" className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
          </Field>
          <Field label="Fecha del informe">
            <input name="fechaInforme" type="date" className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
          </Field>
          <Field label="Archivo del análisis (PDF/Word)">
            <input name="archivo" type="file" accept="application/pdf,.doc,.docx" className="text-sm" />
          </Field>
          <Field label="Resumen (teaser)" full>
            <textarea name="resumen" rows={2} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
          </Field>

          <div className="sm:col-span-2 mt-2 pt-3 border-t border-line">
            <div className="text-xs font-bold uppercase tracking-wider text-svc-orange mb-2">Contenido de la auditoría</div>
          </div>
          <Field label="¿Qué es una auditoría? (explicación general)" full>
            <textarea name="queEsAuditoria" rows={3} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
          </Field>
          <Field label="Alcance (elementos auditados y exclusiones)" full>
            <textarea name="alcance" rows={4} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
          </Field>
          <Field label="Procedimientos aplicados (metodología, evidencia, muestreo)" full>
            <textarea name="procedimientos" rows={4} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
          </Field>
          <Field label="Elementos hallados" full>
            <textarea name="hallazgos" rows={6} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
          </Field>
          <Field label="Conclusiones a las que arribaron" full>
            <textarea name="conclusiones" rows={4} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
          </Field>
          <Field label="Distancia entre la evidencia y la conclusión (razonabilidad)" full>
            <textarea name="razonabilidad" rows={6} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
          </Field>
          <Field label="Cómo corregir a futuro" full>
            <textarea name="recomendaciones" rows={4} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
          </Field>
          <Field label="Opinión del ENCOSEP — cómo debería ser" full>
            <textarea name="opinionEncosep" rows={4} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
          </Field>

          <Field label="Fecha de publicación">
            <input name="fechaPublicacion" type="date" className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
          </Field>
          <label className="flex items-center gap-2 mt-6">
            <input type="checkbox" name="publicado" />
            <span className="text-sm text-navy">Publicado (visible en el sitio público)</span>
          </label>
          <div className="sm:col-span-2 flex gap-2">
            <SubmitButton className="px-5 py-3 rounded-xl bg-svc-red text-white font-bold text-sm" pendingText="Creando…">
              Crear auditoría
            </SubmitButton>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-base font-extrabold text-navy mb-3">
          Auditorías cargadas · {auditorias.length}
        </h2>
        {auditorias.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong bg-paper-2 p-8 text-center text-muted text-sm">
            Todavía no se cargó ninguna auditoría.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {auditorias.map((a) => (
              <li key={a.id} className="rounded-xl border border-line bg-paper p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔍</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      {a.prestadora && (
                        <span className="uppercase tracking-wider font-bold text-svc-orange">{a.prestadora.razonSocial}</span>
                      )}
                      {a.expediente && <span className="font-mono text-muted">{a.expediente}</span>}
                      {a.fechaPublicacion && (
                        <>
                          <span className="text-muted">·</span>
                          <span className="text-muted">{a.fechaPublicacion.toLocaleDateString("es-AR")}</span>
                        </>
                      )}
                      {a.archivoUrl && <span title="Tiene archivo adjunto">📎</span>}
                      {!a.publicado && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-paper-3 text-muted font-bold">BORRADOR</span>}
                    </div>
                    <div className="text-base font-bold text-navy mt-1">{a.titulo}</div>
                    {a.resumen && <div className="text-sm text-muted mt-1 truncate">{a.resumen}</div>}
                  </div>
                  <form action={alternarPublicadoAuditoria}>
                    <input type="hidden" name="id" value={a.id} />
                    <SubmitButton className="text-xs px-2 py-1 rounded border border-line-strong text-navy" pendingText="Procesando…">
                      {a.publicado ? "Despublicar" : "Publicar"}
                    </SubmitButton>
                  </form>
                  <form action={borrarAuditoria}>
                    <input type="hidden" name="id" value={a.id} />
                    <SubmitButton className="text-xs px-2 py-1 rounded border border-svc-red/40 text-svc-red" pendingText="Borrando…">
                      Borrar
                    </SubmitButton>
                  </form>
                </div>

                <div className="mt-3 pt-3 border-t border-line">
                  <div className="text-xs font-bold uppercase tracking-wider text-svc-orange mb-2">
                    Documentos adjuntos · {a.documentos.length}
                  </div>
                  {a.documentos.length > 0 && (
                    <ul className="flex flex-col gap-1 mb-2">
                      {a.documentos.map((doc) => (
                        <li key={doc.id} className="flex items-center gap-2 text-sm">
                          <a href={doc.url} target="_blank" rel="noreferrer" className="text-navy-2 underline underline-offset-2 flex-1 min-w-0 truncate">
                            📎 {doc.titulo}
                          </a>
                          <form action={borrarDocumentoAuditoria}>
                            <input type="hidden" name="id" value={doc.id} />
                            <SubmitButton className="text-xs px-2 py-0.5 rounded border border-svc-red/40 text-svc-red" pendingText="Borrando…">
                              Quitar
                            </SubmitButton>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}
                  <form action={agregarDocumentoAuditoria} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="auditoriaId" value={a.id} />
                    <Field label="Título del documento">
                      <input name="titulo" type="text" placeholder="ej: Análisis de Razonabilidad" required className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
                    </Field>
                    <Field label="Archivo (PDF/Word)">
                      <input name="archivo" type="file" accept="application/pdf,.doc,.docx,.xls,.xlsx" required className="text-sm" />
                    </Field>
                    <SubmitButton className="px-4 py-2 rounded-lg bg-navy-2 text-white font-bold text-xs" pendingText="Subiendo…">
                      Subir documento
                    </SubmitButton>
                  </form>
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-bold text-navy-2">
                    Editar (todo el contenido)
                  </summary>
                  <form
                    action={actualizarAuditoria}
                    className="grid sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-line"
                  >
                    <input type="hidden" name="id" value={a.id} />
                    <Field label="Título *" full>
                      <input name="titulo" type="text" required defaultValue={a.titulo} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
                    </Field>
                    <Field label="Prestadora">
                      <select name="prestadoraId" defaultValue={a.prestadoraId ?? ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper">
                        <option value="">— Sin asociar —</option>
                        {prestadoras.map((p) => (
                          <option key={p.id} value={p.id}>{p.razonSocial}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Expediente">
                      <input name="expediente" type="text" defaultValue={a.expediente ?? ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
                    </Field>
                    <Field label="Auditor / área responsable">
                      <input name="auditorResponsable" type="text" defaultValue={a.auditorResponsable ?? ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
                    </Field>
                    <Field label="Tipo de auditoría">
                      <input name="tipoAuditoria" type="text" defaultValue={a.tipoAuditoria ?? ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
                    </Field>
                    <Field label="Período auditado">
                      <input name="periodoAuditado" type="text" defaultValue={a.periodoAuditado ?? ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
                    </Field>
                    <Field label="Fecha del informe">
                      <input name="fechaInforme" type="date" defaultValue={a.fechaInforme ? a.fechaInforme.toISOString().slice(0, 10) : ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
                    </Field>
                    <Field label={a.archivoUrl ? "Reemplazar archivo" : "Archivo del análisis (PDF/Word)"}>
                      <input name="archivo" type="file" accept="application/pdf,.doc,.docx" className="text-sm" />
                      {a.archivoUrl && (
                        <a href={a.archivoUrl} target="_blank" rel="noreferrer" className="text-xs text-navy-2 underline mt-1">
                          Ver archivo actual
                        </a>
                      )}
                    </Field>
                    <Field label="Resumen (teaser)" full>
                      <textarea name="resumen" rows={2} defaultValue={a.resumen ?? ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
                    </Field>

                    <div className="sm:col-span-2 mt-2 pt-3 border-t border-line">
                      <div className="text-xs font-bold uppercase tracking-wider text-svc-orange mb-2">Contenido de la auditoría</div>
                    </div>
                    <Field label="¿Qué es una auditoría? (explicación general)" full>
                      <textarea name="queEsAuditoria" rows={3} defaultValue={a.queEsAuditoria ?? ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
                    </Field>
                    <Field label="Alcance (elementos auditados y exclusiones)" full>
                      <textarea name="alcance" rows={4} defaultValue={a.alcance ?? ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
                    </Field>
                    <Field label="Procedimientos aplicados (metodología, evidencia, muestreo)" full>
                      <textarea name="procedimientos" rows={4} defaultValue={a.procedimientos ?? ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
                    </Field>
                    <Field label="Elementos hallados" full>
                      <textarea name="hallazgos" rows={6} defaultValue={a.hallazgos ?? ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
                    </Field>
                    <Field label="Conclusiones a las que arribaron" full>
                      <textarea name="conclusiones" rows={4} defaultValue={a.conclusiones ?? ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
                    </Field>
                    <Field label="Distancia entre la evidencia y la conclusión (razonabilidad)" full>
                      <textarea name="razonabilidad" rows={6} defaultValue={a.razonabilidad ?? ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
                    </Field>
                    <Field label="Cómo corregir a futuro" full>
                      <textarea name="recomendaciones" rows={4} defaultValue={a.recomendaciones ?? ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
                    </Field>
                    <Field label="Opinión del ENCOSEP — cómo debería ser" full>
                      <textarea name="opinionEncosep" rows={4} defaultValue={a.opinionEncosep ?? ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y" />
                    </Field>

                    <Field label="Fecha de publicación">
                      <input name="fechaPublicacion" type="date" defaultValue={a.fechaPublicacion ? a.fechaPublicacion.toISOString().slice(0, 10) : ""} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper" />
                    </Field>
                    <label className="flex items-center gap-2 mt-6">
                      <input type="checkbox" name="publicado" defaultChecked={a.publicado} />
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
            ))}
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
