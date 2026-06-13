"use client";

import { useState } from "react";

// Glosario visible de las categorías que maneja la calculadora. Cada categoría
// muestra un ícono (imagen en /public/categorias si existe; si no, un emoji de
// respaldo), a quién aplica y su fundamento normativo (Ord. 6050-5/23 y cuadro
// tarifario Exp. 014/2026). Los textos describen a QUIÉN aplica; los importes y
// porcentajes concretos los muestra la calculadora al elegir la categoría.

type Cat = {
  file: string; // nombre del PNG en /public/categorias/<file>.png
  emoji: string; // respaldo si todavía no hay imagen
  nombre: string;
  ejemplo: string;
  norma: string;
};

const GRUPOS: { titulo: string; cats: Cat[] }[] = [
  {
    titulo: "Hogares (Residencial)",
    cats: [
      {
        file: "residencial",
        emoji: "🏠",
        nombre: "Residencial",
        ejemplo: "Casas y departamentos de uso familiar.",
        norma: "Ord. 6050-5/23, art. 44 (categoría Residencial).",
      },
      {
        file: "jubilados",
        emoji: "👵",
        nombre: "Jubilados",
        ejemplo:
          "Hogares de jubilados o pensionados beneficiarios. Bonificación sobre el cargo fijo y variable hasta 300 kWh.",
        norma: "Ord. 6050-5/23, art. 49 inc. a.",
      },
      {
        file: "electrodependientes",
        emoji: "🔌",
        nombre: "Electrodependientes",
        ejemplo:
          "Personas que dependen de equipos médicos eléctricos. Bonificación del 100% de la energía.",
        norma: "Ord. 6050-5/23, art. 50 (registro y autoridad de aplicación: EnCoSeP).",
      },
      {
        file: "tarifa-social",
        emoji: "🤝",
        nombre: "Tarifa social (Plan Conectados)",
        ejemplo:
          "Hogares en situación socio-económica delicada. Bonificación del 50%.",
        norma: "Ord. 6050-5/23, art. 49 inc. c.",
      },
      {
        file: "sin-gas",
        emoji: "🚫",
        nombre: "Sin acceso a gas (subsidio nacional ampliado)",
        ejemplo:
          "Hogar sin gas de red: el subsidio nacional cubre hasta 700 kWh todos los meses.",
        norma: "Subsidio nacional · remisión Ord. 6050-3/21 art. 47 (subsidios provinciales/nacionales).",
      },
      {
        file: "electrointensivo",
        emoji: "⚡",
        nombre: "Electrointensivo",
        ejemplo:
          "Hogar sin gas de red que calefacciona con electricidad. Beneficio estacional de invierno.",
        norma: "Ord. 6050-5/23, art. 49 inc. b.",
      },
    ],
  },
  {
    titulo: "Comercios, producción y entidades",
    cats: [
      {
        file: "comercial",
        emoji: "🏪",
        nombre: "Comercial",
        ejemplo: "Comercios y locales.",
        norma: "Cuadro tarifario Exp. 014/2026, Anexo II.",
      },
      {
        file: "obrador",
        emoji: "🏗️",
        nombre: "Obrador",
        ejemplo: "Instalación temporaria de una obra en construcción.",
        norma: "Cuadro tarifario Exp. 014/2026, Anexo II.",
      },
      {
        file: "pequena-industria",
        emoji: "🏭",
        nombre: "Pequeña industria",
        ejemplo: "Talleres y pymes productivas.",
        norma: "Cuadro tarifario Exp. 014/2026, Anexo III.",
      },
      {
        file: "entidad",
        emoji: "💗",
        nombre: "Entidad sin fines de lucro",
        ejemplo:
          "Clubes, ONGs y asociaciones vecinales. Se factura al valor residencial.",
        norma: "Ord. 6050-5/23, art. 49 inc. d.",
      },
      {
        file: "entes-oficiales",
        emoji: "🏛️",
        nombre: "Entes oficiales",
        ejemplo: "Reparticiones del Estado.",
        norma: "Cuadro tarifario Exp. 014/2026, Anexo II.",
      },
      {
        file: "gran-usuario",
        emoji: "🏢",
        nombre: "Gran usuario",
        ejemplo:
          "Grandes consumidores con potencia contratada (el cargo fijo se cobra por kW).",
        norma: "Cuadro tarifario Exp. 014/2026, Anexo III.",
      },
    ],
  },
];

function IconoCat({ file, emoji }: { file: string; emoji: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <span className="text-3xl leading-none" aria-hidden>
        {emoji}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={`/categorias/${file}.png`}
      alt=""
      className="w-12 h-12 object-contain"
      onError={() => setErr(true)}
    />
  );
}

export function GlosarioCategorias() {
  return (
    <details className="rounded-2xl border border-line bg-paper overflow-hidden">
      <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-navy">
          ¿Qué categorías incluye la calculadora?
        </span>
        <span className="text-xs text-muted">Ver categorías ▾</span>
      </summary>
      <div className="px-5 pb-5 flex flex-col gap-6 border-t border-line pt-4">
        <p className="text-xs text-muted leading-relaxed">
          La calculadora contempla todas las categorías y beneficios del cuadro
          tarifario vigente (Exp. 014/2026) y del Marco Regulatorio de Servicios
          Públicos (Ord. 6050/96, t.o. 6050-5/23). Elegí tu categoría arriba para
          ver el cálculo con sus importes.
        </p>
        {GRUPOS.map((g) => (
          <div key={g.titulo} className="flex flex-col gap-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
              {g.titulo}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {g.cats.map((c) => (
                <div
                  key={c.file}
                  className="flex gap-3 rounded-xl border border-line bg-paper-2 p-3"
                >
                  <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                    <IconoCat file={c.file} emoji={c.emoji} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-sm font-bold text-navy">{c.nombre}</div>
                    <div className="text-xs text-navy leading-relaxed">
                      {c.ejemplo}
                    </div>
                    <div className="text-[10px] text-muted mt-0.5">{c.norma}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
