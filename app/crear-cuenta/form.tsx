"use client";

import { useActionState } from "react";
import { crearCuenta, type CrearCuentaState } from "./actions";

const initial: CrearCuentaState = {};

export function FormCrearCuenta() {
  const [state, action, pending] = useActionState(crearCuenta, initial);
  const c = state.campos ?? {};

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-navy">DNI</span>
        <input
          name="dni"
          type="text"
          inputMode="numeric"
          autoComplete="username"
          required
          defaultValue={c.dni ?? ""}
          placeholder="27345678"
          className="w-full px-3 py-3 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-navy">Nombre</span>
          <input
            name="nombre"
            type="text"
            autoComplete="given-name"
            required
            defaultValue={c.nombre ?? ""}
            placeholder="María"
            className="w-full px-3 py-3 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-navy">Apellido</span>
          <input
            name="apellido"
            type="text"
            autoComplete="family-name"
            required
            defaultValue={c.apellido ?? ""}
            placeholder="González"
            className="w-full px-3 py-3 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
          />
        </label>
      </div>

      <div className="rounded-xl border border-line bg-paper-2 p-3 text-[13px] text-navy leading-snug">
        Tu <strong>clave para entrar va a ser tu DNI</strong>. Cuando ingreses,
        podés cambiarla y te pediremos un teléfono o email para avisarte cómo
        avanza tu reclamo.
      </div>

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
        {pending ? "Creando..." : "Crear mi cuenta"}
      </button>
    </form>
  );
}
