"use client";

import { useActionState } from "react";
import {
  actualizarDatos,
  cambiarClave,
  type MiCuentaState,
} from "./actions";

const initial: MiCuentaState = {};

export function FormDatos({
  defaults,
}: {
  defaults: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
  };
}) {
  const [state, action, pending] = useActionState(actualizarDatos, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-navy">Nombre</span>
          <input
            name="nombre"
            type="text"
            required
            defaultValue={defaults.nombre}
            className="w-full px-3 py-2.5 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-navy">Apellido</span>
          <input
            name="apellido"
            type="text"
            required
            defaultValue={defaults.apellido}
            className="w-full px-3 py-2.5 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-navy">Email</span>
        <input
          name="email"
          type="email"
          required
          defaultValue={defaults.email}
          className="w-full px-3 py-2.5 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-navy">
          Teléfono <span className="text-muted font-normal">(opcional)</span>
        </span>
        <input
          name="telefono"
          type="tel"
          defaultValue={defaults.telefono}
          placeholder="297-4123456"
          className="w-full px-3 py-2.5 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
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
        className="self-start inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-navy text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar datos"}
      </button>
    </form>
  );
}

export function FormClave() {
  const [state, action, pending] = useActionState(cambiarClave, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-navy">Clave actual</span>
        <input
          name="actual"
          type="password"
          autoComplete="current-password"
          required
          className="w-full px-3 py-2.5 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-navy">Nueva clave</span>
          <input
            name="nueva"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            className="w-full px-3 py-2.5 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-navy">Repetir nueva</span>
          <input
            name="confirmar"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            className="w-full px-3 py-2.5 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
          />
        </label>
      </div>

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
        className="self-start inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-navy text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
      >
        {pending ? "Cambiando..." : "Cambiar clave"}
      </button>
    </form>
  );
}
