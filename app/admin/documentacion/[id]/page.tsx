import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ESTADO_DOC_META,
  TIPO_DOC_META,
  TRANSICIONES_DOC,
  periodoLabel,
} from "@/lib/documentos";
import { TONE_CLASS } from "@/lib/admin";
import { revisarDocumento } from "../actions";
import type { EstadoDocumento } from "@prisma/client";

export const metadata = { title: "Documento · Panel ENCOSEP" };

export default async function DocumentoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const doc = await prisma.documento.findUnique({
    where: { id },
    include: {
      prestadora: true,
      subidoPor: true,
      revisor: true,
    },
  });
  if (!doc) notFound();

  // Operador prestadora solo puede ver los de SU empresa
  if (
    session!.user.rol === "OPERADOR_PRESTADORA" &&
    doc.prestadoraId !== session!.user.prestadoraId
  ) {
    notFound();
  }

  const esEnte =
    session!.user.rol === "GESTOR_ENTE" || session!.user.rol === "SUPER_ADMIN";
  const tipoMeta = TIPO_DOC_META[doc.tipo];
  const estadoMeta = ESTADO_DOC_META[doc.estado];
  const transiciones = TRANSICIONES_DOC[doc.estado];

  return (
    <div className="flex flex-col gap-5">
      <nav className="text-xs text-muted">
        <Link href="/admin/documentacion" className="hover:underline">
          ← Documentación
        </Link>
      </nav>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl">{tipoMeta.icon}</span>
            <h1 className="text-2xl font-extrabold text-navy">{doc.titulo}</h1>
            <span
              className={`inline-flex items-center gap-1 uppercase tracking-wider font-bold rounded-full border text-xs px-2.5 py-1 ${TONE_CLASS[estadoMeta.tone]}`}
            >
              {estadoMeta.label}
            </span>
          </div>
          <div className="text-sm text-muted mt-1">
            {tipoMeta.label} · {periodoLabel(doc.tipo, doc.periodo)} ·{" "}
            {doc.prestadora.razonSocial}
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="flex flex-col gap-5">
          {doc.descripcion && (
            <Card titulo="Descripción">
              <p className="text-sm text-navy whitespace-pre-wrap leading-relaxed">
                {doc.descripcion}
              </p>
            </Card>
          )}

          <Card titulo="Archivo">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-navy">
                  {doc.mimeType ?? "Documento"}{" "}
                  {doc.bytes && (
                    <span className="text-muted font-normal">
                      · {(doc.bytes / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted mt-1 break-all">
                  {doc.archivoUrl}
                </div>
              </div>
              {doc.archivoUrl && (
                <a
                  href={doc.archivoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-navy-2 text-white font-bold text-sm whitespace-nowrap"
                >
                  Abrir / Descargar
                </a>
              )}
            </div>
          </Card>

          {doc.comentarioRevision && (
            <Card titulo="Comentario de la revisión">
              <p className="text-sm text-navy whitespace-pre-wrap leading-relaxed">
                {doc.comentarioRevision}
              </p>
              {doc.revisor && (
                <div className="text-xs text-muted mt-2">
                  Por {doc.revisor.nombre} {doc.revisor.apellido} ·{" "}
                  {doc.revisadoEn?.toLocaleString("es-AR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </Card>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <Card titulo="Datos de carga">
            <div className="text-sm text-navy">
              <strong>Subido por:</strong> {doc.subidoPor.nombre}{" "}
              {doc.subidoPor.apellido}
            </div>
            <div className="text-xs text-muted mt-1">
              {doc.createdAt.toLocaleString("es-AR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </Card>

          {esEnte && transiciones.length > 0 && (
            <Card titulo="Revisar documento">
              <form action={revisarDocumento} className="flex flex-col gap-2">
                <input type="hidden" name="documentoId" value={doc.id} />
                <select
                  name="estado"
                  required
                  defaultValue=""
                  className="px-2 py-1.5 rounded-lg border border-line-strong text-sm bg-paper"
                >
                  <option value="" disabled>
                    Acción…
                  </option>
                  {transiciones.map((e) => (
                    <option key={e} value={e}>
                      {ESTADO_DOC_META[e].label}
                    </option>
                  ))}
                </select>
                <textarea
                  name="comentario"
                  rows={3}
                  placeholder="Comentario (obligatorio si observás o rechazás)…"
                  className="px-2 py-1.5 rounded-lg border border-line-strong text-sm bg-paper resize-none"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-svc-red text-white text-sm font-semibold"
                >
                  Aplicar revisión
                </button>
              </form>
            </Card>
          )}

          {esEnte && transiciones.length === 0 && (
            <Card titulo="Revisión">
              <div className="text-xs text-muted">
                Este documento está cerrado. No hay más acciones disponibles.
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function Card({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <h2 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
        {titulo}
      </h2>
      {children}
    </div>
  );
}
