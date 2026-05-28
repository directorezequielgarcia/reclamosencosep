/**
 * Botón flotante de asistencia por WhatsApp.
 * Visible en las páginas públicas y del ciudadano. Se posiciona en la esquina
 * inferior izquierda para no superponerse con el FAB de Reclamos (derecha).
 */
const WSP_NUMERO = "5492974303051"; // +54 9 2974 30-3051
const WSP_TEXTO =
  "Hola, necesito ayuda para cargar mi reclamo en el portal del ENCOSEP.";

export function FabAsistenciaWsp() {
  const href = `https://wa.me/${WSP_NUMERO}?text=${encodeURIComponent(WSP_TEXTO)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Pedir asistencia por WhatsApp"
      title="Asistencia por WhatsApp"
      className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-svc-green text-white text-sm font-bold shadow-2xl shadow-svc-green/40 hover:scale-105 transition"
    >
      <svg
        viewBox="0 0 32 32"
        width="22"
        height="22"
        aria-hidden
        className="fill-current"
      >
        <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 01-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 01-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.521-1.318.13-.27.13-.527.13-.802-.001-.66-1.49-.99-1.637-.99zM16.06 4C9.91 4 4.96 8.95 4.96 15.09c0 1.973.515 3.916 1.504 5.617L4.038 28 11.5 25.69c1.633.847 3.465 1.275 5.297 1.275 6.142 0 11.092-4.95 11.092-11.09 0-2.974-1.16-5.77-3.256-7.864A11.08 11.08 0 0016.06 4zm0 20.318a9.18 9.18 0 01-4.566-1.218l-.33-.187-3.5 1.18 1.166-3.36-.215-.359a9.226 9.226 0 01-1.418-4.892c0-5.094 4.144-9.238 9.243-9.238 2.466 0 4.78.962 6.523 2.706a9.187 9.187 0 012.706 6.532c0 5.099-4.145 9.236-9.61 9.236z" />
      </svg>
      <span className="hidden sm:inline">Ayuda</span>
    </a>
  );
}
