"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { POSES, type PoseZorrito } from "./zorrito-poses";

export type AvisoZorrito = {
  /** Id único del aviso — cambiarlo para que un aviso nuevo se muestre de nuevo. */
  id: string;
  pose?: PoseZorrito;
  etiqueta?: string;
  titulo: string;
  texto: string;
  cta?: { texto: string; href: string };
};

const claveVista = (id: string) => `zorrito-noticia-${id}-vista`;

/**
 * Cola de burbujas de noticia temporal del Zorrito. A diferencia de
 * ZorritoTour (guía permanente de navegación), cada aviso es puntual: se
 * auto-abre una vez por `id` y, al cerrarlo, no vuelve a aparecer
 * (localStorage). Si hay varios avisos sin ver, se muestran de a uno, en
 * el orden del array — borrar cada aviso del array cuando deje de ser noticia.
 *
 * Aparece primero como una pastilla chica ("Apretá para ver novedades") y
 * solo se expande al contenido completo cuando el usuario la toca — no
 * interrumpe con el texto entero apenas entra al sitio.
 */
export function ZorritoNoticias({ avisos }: { avisos: AvisoZorrito[] }) {
  const [pendientes, setPendientes] = useState<AvisoZorrito[] | null>(null);
  const [visible, setVisible] = useState(false);
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    setPendientes(
      avisos.filter((a) => !window.localStorage.getItem(claveVista(a.id))),
    );
    // Solo se calcula una vez, al montar — el array de avisos es estático.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pendientes || pendientes.length === 0 || visible) return;
    const t = setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(t);
  }, [pendientes, visible]);

  function cerrar() {
    const actual = pendientes?.[0];
    if (actual) window.localStorage.setItem(claveVista(actual.id), "1");
    setVisible(false);
    setTimeout(() => {
      setExpandido(false);
      setPendientes((p) => (p ?? []).slice(1));
    }, 300);
  }

  if (!pendientes || pendientes.length === 0) return null;
  const aviso = pendientes[0];

  if (!expandido) {
    return (
      <div
        className={`fixed bottom-24 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 flex justify-center transition-all duration-300 ${
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setExpandido(true)}
            className="flex items-center gap-2 rounded-full border-2 border-[#7e57c2]/60 bg-paper shadow-xl shadow-[#7e57c2]/20 pl-1.5 pr-4 py-1.5 hover:scale-105 transition"
          >
            <span className="w-9 h-9 shrink-0 rounded-full overflow-hidden border-2 border-[#7e57c2]/50 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={POSES[aviso.pose ?? "parado"]}
                alt=""
                className="w-full h-full object-cover object-top"
              />
            </span>
            <span className="text-xs font-bold text-navy whitespace-nowrap">
              Apretá para ver novedades
            </span>
          </button>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar noticia"
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-paper border border-line-strong flex items-center justify-center text-[10px] text-muted hover:bg-paper-2 transition"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      className={`fixed bottom-24 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-96 z-40 transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <div className="relative rounded-2xl border-2 border-[#7e57c2]/60 bg-paper shadow-2xl shadow-[#7e57c2]/20 p-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 shrink-0 rounded-full overflow-hidden border-2 border-[#7e57c2]/50 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={POSES[aviso.pose ?? "parado"]}
              alt=""
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="flex-1 min-w-0">
            {aviso.etiqueta && (
              <span className="inline-block mb-1 px-2 py-0.5 rounded-full bg-[#7e57c2] text-white text-[10px] font-bold uppercase tracking-wider">
                {aviso.etiqueta}
              </span>
            )}
            <p className="text-sm font-bold text-navy leading-snug">
              {aviso.titulo}
            </p>
            <p className="text-xs text-muted leading-snug mt-1">
              {aviso.texto}
            </p>
            {aviso.cta && (
              <Link
                href={aviso.cta.href}
                onClick={cerrar}
                className="inline-block mt-2 text-xs font-bold text-[#7e57c2] underline underline-offset-4"
              >
                {aviso.cta.texto} ›
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar noticia"
            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-muted hover:bg-paper-2 transition"
          >
            ✕
          </button>
        </div>
        {/* Colita de la burbuja, apunta al botón del Zorrito */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-paper border-b-2 border-r-2 border-[#7e57c2]/60" />
      </div>
    </div>
  );
}
