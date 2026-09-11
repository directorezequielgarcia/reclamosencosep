"use client";

import { useFormStatus } from "react-dom";

// Botón de envío que se bloquea mientras el servidor procesa, para evitar
// dobles clics que crean registros duplicados.
export function SubmitButton({
  children,
  className,
  pendingText = "Enviando…",
  disabled = false,
  title,
  formAction,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  // Para bloquear el botón por una condición propia (ej: falta un vínculo),
  // además del bloqueo automático mientras el server action está en vuelo.
  disabled?: boolean;
  title?: string;
  // Para botones secundarios en el mismo <form> que disparan otra action
  // (ej: "Descartar" junto a "Convertir en reclamo").
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending || disabled}
      title={title}
      className={`${className ?? ""} disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {pending ? pendingText : children}
    </button>
  );
}
