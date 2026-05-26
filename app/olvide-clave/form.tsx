"use client";

import { useActionState } from "react";
import { solicitarReset, type OlvideClaveState } from "./actions";

const initial: OlvideClaveState = {};

export function FormOlvideClave() {
  const [state, action, pending] = useActionState(solicitarReset, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-navy">DNI</span>
        <input
          name="dni"
          type="text"
          inputMode="numeric"
          required
          defaultValue={state.dni ?? ""}
          placeholder="27345678"
          className="w-full px-3 py-3 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
        />
      </label>

      {state.error ? (
        <div className="text-sm text-svc-red bg-svc-red/10 border border-svc-red/30 rounded-lg px-3 py-2">
          {state.error}
        </div>
      ) : null}
      {state.ok ? (
        <div className="text-sm text-svc-green bg-svc-green/10 border border-svc-green/30 rounded-lg px-3 py-2">
          {state.ok}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl bg-svc-red text-white font-bold uppercase tracking-wider hover:opacity-90 transition shadow-md shadow-svc-red/30 disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviarme el link"}
      </button>
    </form>
  );
}
