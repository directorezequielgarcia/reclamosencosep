import type { ServicioKind } from "@prisma/client";

const PREFIJO: Record<ServicioKind, string> = {
  AGUA: "A",
  ENERGIA: "E",
  RESIDUOS: "R",
  TRANSPORTE: "T",
};

// Genera un código corto y legible: "A-2418".
// MVP: 4 dígitos random. Si hay colisión, el caller debe reintentar.
export function generarCodigo(kind: ServicioKind): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${PREFIJO[kind]}-${n}`;
}
