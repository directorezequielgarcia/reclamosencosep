"use client";

import { useFormStatus } from "react-dom";

// Botón de envío que se bloquea mientras el servidor procesa, para evitar
// dobles clics que crean registros duplicados.
export function SubmitButton({
  children,
  className,
  pendingText = "Enviando…",
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className ?? ""} disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {pending ? pendingText : children}
    </button>
  );
}
