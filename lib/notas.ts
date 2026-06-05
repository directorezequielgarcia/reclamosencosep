import type { NotaAmbito, NotaEstado, Rol } from "@prisma/client";

export const NOTA_AMBITO_LABEL: Record<NotaAmbito, string> = {
  AUTORIDAD_APLICACION: "Autoridad de Aplicación",
  CONCEJO_DELIBERANTE: "Concejo Deliberante",
  PEM: "Poder Ejecutivo Municipal",
  PRESTADORA: "Prestadora",
  OTRO: "Otro organismo",
};

export const NOTA_ESTADO_META: Record<
  NotaEstado,
  { label: string; tone: "neutral" | "info" | "warning" | "success" }
> = {
  BORRADOR: { label: "Borrador", tone: "warning" },
  ENVIADA: { label: "Enviada", tone: "info" },
  RESPONDIDA: { label: "Respondida", tone: "success" },
  CERRADA: { label: "Cerrada", tone: "neutral" },
};

// Ámbito de la bandeja de entrada de cada rol. null = Team ENCOSEP / Dirección,
// que ven TODAS las notas (gestionan la comunicación con todos los organismos).
export function ambitoDeRol(rol: Rol): NotaAmbito | null {
  switch (rol) {
    case "AUTORIDAD_APLICACION":
      return "AUTORIDAD_APLICACION";
    case "CONCEJO_DELIBERANTE":
      return "CONCEJO_DELIBERANTE";
    case "PEM":
      return "PEM";
    case "OPERADOR_PRESTADORA":
      return "PRESTADORA";
    default:
      return null;
  }
}

// Roles que forman parte del Ente (lado ENCOSEP de la comunicación).
const ROLES_ENTE: Rol[] = [
  "GESTOR_ENTE",
  "DIRECTOR",
  "SUPER_ADMIN",
  "AUDITOR",
  "EXPEDIENTES",
  "COOPERATIVA_DOCS",
  "INSPECCIONES",
  "AUDIENCIAS_MEDIOS",
];

export function esEnteRol(rol: Rol): boolean {
  return ROLES_ENTE.includes(rol);
}

// Cualquier rol distinto del vecino tiene bandeja de notas.
export function puedeVerNotas(rol: Rol): boolean {
  return rol !== "CIUDADANO";
}

// Genera el número de la nota: NOTA-YYYY-NNN (incremental por año).
export function siguienteNumeroNota(yaUsados: string[]): string {
  const year = new Date().getFullYear();
  const prefix = `NOTA-${year}-`;
  const usados = yaUsados
    .filter((n) => n.startsWith(prefix))
    .map((n) => Number(n.slice(prefix.length)))
    .filter((n) => Number.isFinite(n));
  const next = (usados.length ? Math.max(...usados) : 0) + 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}
