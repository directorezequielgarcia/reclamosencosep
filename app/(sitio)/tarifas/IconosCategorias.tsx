// Set de íconos vectoriales propios (sin librerías externas) para las categorías
// de la calculadora. Estilo único: trazo azul marino ENCOSEP + acento naranja,
// viewBox 0 0 48 48. Gratis, nítidos a cualquier tamaño y coherentes entre sí.

import type { ReactNode } from "react";

const NAVY = "#1a2b4a";
const OR = "#e8772e";

const PATHS: Record<string, ReactNode> = {
  // 🏠 Casa familiar
  residencial: (
    <>
      <path d="M9 23 L24 11 L39 23" />
      <path d="M13 22 V38 H35 V22" />
      <rect x="21" y="29" width="7" height="9" fill={OR} stroke="none" />
      <rect x="15.5" y="26" width="4.5" height="4.5" fill={OR} stroke="none" />
    </>
  ),
  // 👵 Adulto mayor con bastón
  jubilados: (
    <>
      <circle cx="19" cy="13" r="4.2" />
      <path d="M11 39 V28 a8 8 0 0 1 16 0 V39" />
      <path d="M31 39 V25 a3.5 3.5 0 0 1 7 0 V28" stroke={OR} />
    </>
  ),
  // ❤️ Corazón + pulso eléctrico (equipos médicos)
  electrodependientes: (
    <>
      <path
        d="M24 33s-9-5.4-9-12c0-3.6 5.4-5 9-1 3.6-4 9-2.6 9 1 0 6.6-9 12-9 12Z"
        fill={OR}
        stroke="none"
      />
      <path d="M13 24 h6 l2-3 2.5 7 2-4 1.5 0 H35" stroke={NAVY} />
    </>
  ),
  // 🤝 Mano con moneda y flecha hacia abajo (ayuda / descuento social)
  "tarifa-social": (
    <>
      <path d="M12 38 c0-6 5-9 12-9 s12 3 12 9" />
      <circle cx="24" cy="17" r="5.2" fill={OR} stroke="none" />
      <path d="M24 14 v6 M21.5 17.5 l2.5 2.5 2.5-2.5" stroke="#fff" strokeWidth={1.6} />
    </>
  ),
  // 🚫 Llama de gas tachada (sin gas de red)
  "sin-gas": (
    <>
      <path
        d="M24 13c4 4.5 6.5 7.5 6.5 12a6.5 6.5 0 0 1-13 0c0-2.6 1.5-4.8 3.2-6.5 1 1.6 1.8 2.3 2.6 2.3 0-2.6-.2-5.3.7-7.8Z"
        fill={OR}
        stroke="none"
      />
      <line x1="13" y1="12" x2="35" y2="36" stroke="#dc2626" strokeWidth={3} />
    </>
  ),
  // ⚡ Casa con rayo (sin gas, calefacción eléctrica)
  electrointensivo: (
    <>
      <path d="M9 23 L24 11 L39 23" />
      <path d="M13 22 V38 H35 V22" />
      <path d="M26 24 l-6 8 h4 l-2 6 7-9 h-4 z" fill={OR} stroke="none" />
    </>
  ),
  // 🏪 Local comercial con toldo
  comercial: (
    <>
      <path d="M12 19 V38 H36 V19" />
      <path
        d="M10 19 V13 H38 V19 q-3.5 4-7 0 q-3.5 4-7 0 q-3.5 4-7 0Z"
        fill={OR}
        stroke="none"
      />
      <rect x="20" y="29" width="8" height="9" />
    </>
  ),
  // 🏗️ Casco de obra (obrador = obra en construcción)
  obrador: (
    <>
      <path d="M11 31 a13 13 0 0 1 26 0" fill={OR} stroke="none" />
      <path d="M11 31 a13 13 0 0 1 26 0" />
      <path d="M22 20 h4 v5 h-4 z" fill={OR} stroke="none" />
      <line x1="8" y1="31" x2="40" y2="31" />
    </>
  ),
  // 🏭 Fábrica chica
  "pequena-industria": (
    <>
      <path d="M10 38 V25 l7 4 V25 l7 4 V21 h10 v17 z" />
      <path d="M31 21 V15 h3 v6" />
      <rect x="14" y="31" width="3.5" height="4" fill={OR} stroke="none" />
      <rect x="22" y="31" width="3.5" height="4" fill={OR} stroke="none" />
      <rect x="30" y="31" width="3.5" height="4" fill={OR} stroke="none" />
    </>
  ),
  // 👪 Grupo de personas (entidad / comunidad sin fines de lucro)
  entidad: (
    <>
      <circle cx="24" cy="13" r="4" fill={OR} stroke="none" />
      <path d="M17 28 a7 7 0 0 1 14 0" />
      <circle cx="13" cy="17" r="3.2" />
      <path d="M8 30 a5 5 0 0 1 10 0" />
      <circle cx="35" cy="17" r="3.2" />
      <path d="M30 30 a5 5 0 0 1 10 0" />
    </>
  ),
  // 🏛️ Edificio público con bandera
  "entes-oficiales": (
    <>
      <path d="M10 21 L24 12 L38 21 Z" fill={OR} stroke="none" />
      <path d="M13 21 V34 M19 21 V34 M25 21 V34 M31 21 V34" />
      <path d="M9 34 H39 M8 38 H40" />
      <path d="M24 12 V6 h6 v3.5 h-6" stroke={OR} />
    </>
  ),
  // 🗼 Torre de alta tensión con flecha (gran usuario)
  "gran-usuario": (
    <>
      <path d="M16 38 L24 9 L32 38" />
      <path d="M12 17 H36" />
      <path d="M20 24 H28 M18 31 H30" />
      <path d="M38 38 V25 m-3 3 3-3 3 3" stroke={OR} />
    </>
  ),
};

export function IconoCategoria({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      stroke={NAVY}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-hidden
    >
      {PATHS[id] ?? null}
    </svg>
  );
}
