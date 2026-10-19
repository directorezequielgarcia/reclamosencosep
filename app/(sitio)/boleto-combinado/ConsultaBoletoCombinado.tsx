"use client";

import Link from "next/link";
import { useState } from "react";
import {
  LINEAS_COMBINADO,
  MAX_VENTANA_MIN,
  MIN_ESPERA_MIN,
  combinablesCon,
  combinan,
  parDudoso,
} from "@/lib/boleto-combinado";

const campo =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-navy";

export function ConsultaBoletoCombinado() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  const la = a ? Number(a) : null;
  const lb = b ? Number(b) : null;
  const listo = la !== null && lb !== null;
  const mismaLinea = listo && la === lb;
  const dudoso = listo && !mismaLinea && parDudoso(la, lb);
  const comb = listo && !mismaLinea && !dudoso && combinan(la, lb);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-base font-bold text-navy mb-4">Tu viaje</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-navy">Primera línea</span>
            <select className={campo} value={a} onChange={(e) => setA(e.target.value)}>
              <option value="">Elegí…</option>
              {LINEAS_COMBINADO.map((l) => (
                <option key={l} value={l}>Línea {l}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-navy">Segunda línea</span>
            <select className={campo} value={b} onChange={(e) => setB(e.target.value)}>
              <option value="">Elegí…</option>
              {LINEAS_COMBINADO.map((l) => (
                <option key={l} value={l}>Línea {l}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4">
          <div className="text-sm font-bold text-navy">Recordá</div>
          <p className="text-sm text-navy mt-1 leading-relaxed">
            Tenés que esperar al menos {MIN_ESPERA_MIN} minutos desde que validaste la primera línea, y tenés
            hasta {MAX_VENTANA_MIN / 60} horas para subir a la segunda. El descuento se hace solo en tu
            tarjeta SUBE.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-paper p-5" aria-live="polite">
        <h2 className="text-base font-bold text-navy mb-4">Resultado</h2>
        {!listo && (
          <p className="text-sm text-muted">Elegí las dos líneas que usaste para ver si combinan.</p>
        )}
        {mismaLinea && (
          <Caja tono="aviso" titulo="Elegiste la misma línea dos veces">
            El combinado es para pasar de una línea a otra distinta.
          </Caja>
        )}
        {dudoso && (
          <Caja tono="aviso" titulo="Esta combinación no está confirmada">
            Nuestra planilla tiene dudas sobre este par. Consultá a la Municipalidad y, si te cobraron los dos
            viajes, hacé el reclamo para que lo verifiquemos.
          </Caja>
        )}
        {listo && !mismaLinea && !dudoso && !comb && (
          <Caja tono="no" titulo={`Las líneas ${la} y ${lb} no combinan`}>
            Según la planilla que maneja el ENCOSEP, ese par no tiene boleto combinado y se cobra cada viaje.
            Mirá abajo con qué líneas sí combina la {la}.
          </Caja>
        )}
        {comb && (
          <>
            <Caja tono="si" titulo={`Las líneas ${la} y ${lb} combinan`}>
              Si hacés el transbordo dentro del tiempo que figura en el recordatorio, el segundo viaje te
              tendría que salir gratis.
            </Caja>
            <Link
              href="/reclamo/nuevo?svc=transporte"
              className="mt-4 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-navy-2 text-white font-bold text-sm"
            >
              Me lo cobraron: hacer el reclamo
            </Link>
          </>
        )}
        {la !== null && !mismaLinea && (
          <div className="mt-5">
            <div className="text-xs font-bold text-navy mb-2">Líneas que combinan con la {la}</div>
            <div className="flex flex-wrap gap-1.5">
              {combinablesCon(la).map((l) => (
                <span key={l} className="px-2.5 py-1 rounded-full bg-navy-2 text-white text-xs font-bold">
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Caja({
  tono,
  titulo,
  children,
}: {
  tono: "si" | "no" | "aviso";
  titulo: string;
  children: React.ReactNode;
}) {
  const color =
    tono === "si"
      ? "border-green-600 bg-green-50"
      : tono === "no"
        ? "border-red-600 bg-red-50"
        : "border-amber-500 bg-amber-50";
  return (
    <div className={`rounded-xl border-l-4 p-4 ${color}`}>
      <div className="text-sm font-bold text-navy">{titulo}</div>
      <p className="text-sm text-navy mt-1 leading-relaxed">{children}</p>
    </div>
  );
}
