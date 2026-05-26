"use client";

import { useActionState } from "react";
import { fijarNuevaClave, type ResetState } from "./actions";

const initial: ResetState = {};

export function FormReset({ token }: { token: string }) {
  const [state, action, pending] = useActionState(fijarNuevaClave, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-navy">Nueva clave</span>
        <input
          name="nueva"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="mín. 6 caracteres"
          className="w-full px-3 py-3 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-navy">Repetir clave</span>
        <input
          name="confirmar"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="••••••"
          className="w-full px-3 py-3 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
        />
      </label>

      {state.error ? (
        <div className="text-sm text-svc-red bg-svc-red/10 border border-svc-red/30 rounded-lg px-3 py-2">
          {state.error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl bg-svc-red text-white font-bold uppercase tracking-wider hover:opacity-90 transition shadow-md shadow-svc-red/30 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Fijar nueva clave"}
      </button>
    </form>
  );
}
