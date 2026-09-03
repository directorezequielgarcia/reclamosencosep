/**
 * Menú de descarga del reclamo completo: Word (A4 u Oficio, con datos,
 * mapa, fotos e historial embebidos) o la vista imprimible para "Guardar
 * como PDF" desde el navegador. `<details>` nativo — sin JS necesario.
 */
export function DescargarReclamo({
  docxHrefBase,
  imprimirHref,
}: {
  docxHrefBase: string;
  imprimirHref: string;
}) {
  return (
    <details className="relative shrink-0">
      <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-navy-2 text-white text-xs font-bold select-none">
        ⬇️ Descargar reclamo
      </summary>
      <div className="absolute right-0 mt-1 w-60 rounded-lg border border-line bg-paper shadow-lg z-20 overflow-hidden">
        <a
          href={`${docxHrefBase}?pagina=a4`}
          className="block px-3 py-2 text-sm text-navy hover:bg-paper-2"
        >
          📝 Word — A4
        </a>
        <a
          href={`${docxHrefBase}?pagina=oficio`}
          className="block px-3 py-2 text-sm text-navy hover:bg-paper-2 border-t border-line"
        >
          📝 Word — Oficio
        </a>
        <a
          href={imprimirHref}
          className="block px-3 py-2 text-sm text-navy hover:bg-paper-2 border-t border-line"
        >
          🖨️ Imprimir / Guardar PDF
        </a>
      </div>
    </details>
  );
}
