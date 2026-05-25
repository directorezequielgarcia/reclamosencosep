import type { ReclamoEstado, Rol } from "@prisma/client";

export const ESTADO_META: Record<
  ReclamoEstado,
  { label: string; tone: "neutral" | "info" | "warning" | "success" | "danger" }
> = {
  RECIBIDO: { label: "Recibido", tone: "neutral" },
  EN_REVISION: { label: "En revisión", tone: "warning" },
  DERIVADO: { label: "Derivado", tone: "info" },
  EN_PROCESO: { label: "En proceso", tone: "info" },
  RESUELTO: { label: "Resuelto", tone: "success" },
  CERRADO_SIN_SOLUCION: { label: "Cerrado sin solución", tone: "neutral" },
  RECHAZADO: { label: "Rechazado", tone: "danger" },
};

export const TONE_CLASS: Record<string, string> = {
  neutral: "bg-paper-3 text-navy border-line-strong",
  info: "bg-svc-blue/15 text-navy border-svc-blue/40",
  warning: "bg-svc-yellow/20 text-navy border-svc-yellow/60",
  success: "bg-svc-green/15 text-navy border-svc-green/50",
  danger: "bg-svc-red/15 text-navy border-svc-red/40",
};

export const ROL_LABEL: Record<Rol, string> = {
  CIUDADANO: "Vecino",
  GESTOR_ENTE: "Gestor del Ente",
  OPERADOR_PRESTADORA: "Operador prestadora",
  SUPER_ADMIN: "Super admin",
  AUDITOR: "Auditor",
};

// Roles que tienen acceso al panel admin
export const ROLES_ADMIN: Rol[] = [
  "GESTOR_ENTE",
  "OPERADOR_PRESTADORA",
  "SUPER_ADMIN",
  "AUDITOR",
];

// Roles que pueden modificar reclamos (no solo leer)
export const ROLES_EDIT: Rol[] = [
  "GESTOR_ENTE",
  "OPERADOR_PRESTADORA",
  "SUPER_ADMIN",
];

// Filtro WHERE para Prisma según el rol del usuario.
// El operador de prestadora solo ve los reclamos asignados a su prestadora.
export function whereReclamosByRol(rol: Rol, prestadoraId: string | null) {
  if (rol === "OPERADOR_PRESTADORA") {
    return { prestadoraId: prestadoraId ?? "__none__" };
  }
  return {};
}

// Transiciones de estado permitidas según el estado actual.
export const TRANSICIONES: Record<ReclamoEstado, ReclamoEstado[]> = {
  RECIBIDO: ["EN_REVISION", "DERIVADO", "RECHAZADO"],
  EN_REVISION: ["DERIVADO", "EN_PROCESO", "RESUELTO", "RECHAZADO"],
  DERIVADO: ["EN_PROCESO", "RESUELTO", "CERRADO_SIN_SOLUCION"],
  EN_PROCESO: ["RESUELTO", "CERRADO_SIN_SOLUCION"],
  RESUELTO: [],
  CERRADO_SIN_SOLUCION: [],
  RECHAZADO: [],
};
