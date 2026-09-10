/**
 * Botón de descarga de los documentos (PDF) que el vecino adjuntó al
 * reclamo. Mismo patrón visual que `DescargarReclamo`: un `<details>`
 * nativo con un menú de links, cada uno forzando la descarga vía
 * `?download=1` (Vercel Blob).
 */
export function DescargarDocumentosAdjuntos({
  documentos,
}: {
  documentos: { id: string; url: string }[];
}) {
  return (
    <details className="relative shrink-0">
      <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-navy-2 text-white text-xs font-bold select-none">
        ⬇️ Descargar archivos agregados por el usuario
      </summary>
      <div className="absolute right-0 mt-1 w-64 rounded-lg border border-line bg-paper shadow-lg z-20 overflow-hidden">
        {documentos.map((d, i) => (
          <a
            key={d.id}
            href={`${d.url}?download=1`}
            className={`block px-3 py-2 text-sm text-navy hover:bg-paper-2 ${
              i > 0 ? "border-t border-line" : ""
            }`}
          >
            📄 Documento {i + 1} (PDF)
          </a>
        ))}
      </div>
    </details>
  );
}
