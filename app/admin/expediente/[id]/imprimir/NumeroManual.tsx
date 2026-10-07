"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Permite fijar a mano el número del expediente antes de imprimir / guardar PDF.
// Acepta "07/2026", "7/2026" o "EXP-2026-007". Vacío = vuelve al número del sistema.
export function NumeroManual({ actual }: { actual: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [valor, setValor] = useState(sp.get("nro") ?? "");

  function aplicar(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams(sp.toString());
    const v = valor.trim();
    if (v) q.set("nro", v);
    else q.delete("nro");
    router.push(`${pathname}?${q.toString()}`);
  }

  return (
    <form onSubmit={aplicar} className="flex items-center gap-1">
      <label className="text-xs opacity-80" htmlFor="nro-manual">
        N° expte.:
      </label>
      <input
        id="nro-manual"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={actual}
        className="w-28 text-xs px-2 py-1 rounded text-black"
      />
      <button
        type="submit"
        className="text-xs px-2 py-1 rounded bg-white text-navy font-bold"
      >
        Aplicar
      </button>
    </form>
  );
}
