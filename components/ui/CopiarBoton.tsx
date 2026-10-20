"use client";

import { useState } from "react";

// Botón que copia un texto al portapapeles. Si `urlRelativa` viene, copia el
// enlace completo al portal (window.location.origin + la ruta), y si no copia
// `texto` tal cual. Muestra "¡Copiado!" un momento.
export function CopiarBoton({
  texto,
  urlRelativa,
  children,
  className,
}: {
  texto?: string;
  urlRelativa?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    const valor = urlRelativa !== undefined ? window.location.origin + urlRelativa : (texto ?? "");
    try {
      await navigator.clipboard.writeText(valor);
    } catch {
      // Navegadores sin permiso de portapapeles: copia con un textarea temporal
      const ta = document.createElement("textarea");
      ta.value = valor;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className={
        className ??
        "inline-flex items-center justify-center px-3 py-2 rounded-lg border border-line-strong text-sm text-navy font-semibold"
      }
    >
      {copiado ? "¡Copiado!" : children}
    </button>
  );
}
