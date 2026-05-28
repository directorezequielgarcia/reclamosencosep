"use client";

/**
 * Botón que pide al server una clave temporal nueva para un usuario.
 * Cuando responde, muestra la clave en un modal — visible una sola vez.
 * El admin la comunica al usuario y se descarta.
 */
import { useState, useTransition } from "react";
import { generarClaveTemporalUsuario } from "./actions";

export function BotonClaveTemporal({ usuarioId }: { usuarioId: string }) {
  const [resultado, setResultado] = useState<{ clave: string; usuario: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [pending, startTransition] = useTransition();

  function pedirClave() {
    setError(null);
    startTransition(async () => {
      try {
        const r = await generarClaveTemporalUsuario(usuarioId);
        setResultado(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error generando clave");
      }
    });
  }

  async function copiar() {
    if (!resultado) return;
    try {
      await navigator.clipboard.writeText(resultado.clave);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // si falla el clipboard (permisos), no hacemos nada — la clave igual
      // está visible en pantalla para que la lean
    }
  }

  function cerrar() {
    setResultado(null);
    setCopiado(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={pedirClave}
        disabled={pending}
        className="text-[11px] px-2.5 py-1 rounded-md border border-line-strong text-navy hover:bg-paper-3 disabled:opacity-50"
        title="Genera una clave aleatoria nueva y te la muestra una sola vez para que se la comuniques al usuario"
      >
        {pending ? "Generando…" : "Generar clave"}
      </button>

      {(resultado || error) && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
          onClick={cerrar}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-paper rounded-2xl border-2 border-line-strong p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {error ? (
              <>
                <h2 className="text-lg font-extrabold text-svc-red mb-2">
                  No se pudo generar la clave
                </h2>
                <p className="text-sm text-navy">{error}</p>
                <button
                  type="button"
                  onClick={cerrar}
                  className="mt-4 px-4 py-2 rounded-lg bg-navy text-white text-sm font-bold"
                >
                  Cerrar
                </button>
              </>
            ) : resultado ? (
              <>
                <div className="text-[10px] uppercase tracking-wider text-muted font-bold">
                  Clave temporal generada
                </div>
                <h2 className="text-lg font-extrabold text-navy mt-1">
                  {resultado.usuario}
                </h2>
                <p className="text-xs text-muted mt-2 leading-relaxed">
                  Esta clave solo se muestra <strong>una vez</strong>. Copiala
                  y comunicásela al usuario por un canal seguro. La clave
                  vieja ya quedó invalidada.
                </p>

                <div className="mt-4 rounded-xl border-2 border-dashed border-navy-2 bg-paper-2 p-4 flex items-center justify-between gap-2">
                  <code className="text-lg font-mono font-bold text-navy select-all break-all">
                    {resultado.clave}
                  </code>
                  <button
                    type="button"
                    onClick={copiar}
                    className="px-3 py-1.5 rounded-md bg-navy-2 text-white text-xs font-bold whitespace-nowrap"
                  >
                    {copiado ? "✓ Copiada" : "Copiar"}
                  </button>
                </div>

                <p className="text-[11px] text-muted mt-3 leading-relaxed">
                  Recomendalé al usuario que apenas ingrese vaya a{" "}
                  <span className="font-mono">/mi-cuenta</span> y elija una
                  clave nueva personal.
                </p>

                <button
                  type="button"
                  onClick={cerrar}
                  className="mt-4 w-full px-4 py-2 rounded-lg bg-navy text-white text-sm font-bold"
                >
                  Cerrar (ya la copié / anoté)
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
