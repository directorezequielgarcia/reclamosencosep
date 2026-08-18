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
  SUPER_ADMIN: "Director técnico",
  AUDITOR: "Auditor",
  DIRECTOR: "Director del Ente",
  COOPERATIVA_DOCS: "Documentación de prestadoras",
  EXPEDIENTES: "Expedientes",
  INSPECCIONES: "Inspecciones de campo",
  AUDIENCIAS_MEDIOS: "Audiencias y medios",
  PEM: "Poder Ejecutivo Municipal",
  CONCEJO_DELIBERANTE: "Concejo Deliberante",
  AUTORIDAD_APLICACION: "Autoridad de Aplicación",
};

// Roles que tienen acceso al panel admin
export const ROLES_ADMIN: Rol[] = [
  "GESTOR_ENTE",
  "OPERADOR_PRESTADORA",
  "SUPER_ADMIN",
  "AUDITOR",
  "DIRECTOR",
  "COOPERATIVA_DOCS",
  "EXPEDIENTES",
  "INSPECCIONES",
  "AUDIENCIAS_MEDIOS",
];

// Roles que pueden modificar reclamos (no solo leer)
export const ROLES_EDIT: Rol[] = [
  "GESTOR_ENTE",
  "OPERADOR_PRESTADORA",
  "SUPER_ADMIN",
  "DIRECTOR",
];

// ─────────────────────────────────────────────
// Helpers de permisos por dominio
// Modelo: los DIRECTOR y SUPER_ADMIN ven y hacen todo dentro del Ente.
// Los roles funcionales (COOPERATIVA_DOCS, EXPEDIENTES, etc.) solo acceden
// a su slice. GESTOR_ENTE es el rol legacy general (compatibilidad).
// ─────────────────────────────────────────────

/** Director del Ente o Super admin técnico — ven y operan TODO. */
export function esDireccion(rol: Rol): boolean {
  return rol === "DIRECTOR" || rol === "SUPER_ADMIN";
}

/** Único que puede exportar el informe oficial (mensual art. 5 inc. k, anual de gestión). */
export function puedeExportarInformes(rol: Rol): boolean {
  return esDireccion(rol);
}

/** Puede revisar / cambiar estado a la documentación de prestadoras. */
export function puedeRevisarDocumentos(rol: Rol): boolean {
  return esDireccion(rol) || rol === "COOPERATIVA_DOCS" || rol === "GESTOR_ENTE";
}

/** Puede ver/cargar documentos (incluye la propia prestadora). */
export function puedeVerDocumentos(rol: Rol): boolean {
  return puedeRevisarDocumentos(rol) || rol === "OPERADOR_PRESTADORA" || rol === "AUDITOR";
}

/** Puede gestionar expedientes administrativos. */
export function puedeGestionarExpedientes(rol: Rol): boolean {
  return esDireccion(rol) || rol === "EXPEDIENTES" || rol === "GESTOR_ENTE";
}

/** Puede ver expedientes (incluye auditor). */
export function puedeVerExpedientes(rol: Rol): boolean {
  return puedeGestionarExpedientes(rol) || rol === "AUDITOR";
}

/** Puede cargar/gestionar inspecciones de campo (crear, editar, publicar). */
export function puedeGestionarInspecciones(rol: Rol): boolean {
  return esDireccion(rol) || rol === "INSPECCIONES" || rol === "GESTOR_ENTE";
}

/** Puede VER inspecciones, posiblemente con filtro por vínculos. La
 *  función whereInspeccionesByRol determina cuáles efectivamente ve. */
export function puedeVerInspecciones(rol: Rol): boolean {
  return (
    puedeGestionarInspecciones(rol) ||
    rol === "EXPEDIENTES" ||
    rol === "AUDITOR"
  );
}

/** Puede gestionar audiencias públicas y boletines/clipping de medios. */
export function puedeGestionarAudienciasMedios(rol: Rol): boolean {
  return esDireccion(rol) || rol === "AUDIENCIAS_MEDIOS" || rol === "GESTOR_ENTE";
}

/** Puede gestionar usuarios (alta, reset clave, bloqueo). */
export function puedeGestionarUsuarios(rol: Rol): boolean {
  return esDireccion(rol) || rol === "GESTOR_ENTE";
}

/** Puede manejar la bandeja de reclamos (asignar, cambiar estado). */
export function puedeGestionarReclamos(rol: Rol): boolean {
  return esDireccion(rol) || rol === "GESTOR_ENTE" || rol === "EXPEDIENTES";
}

/** Puede gestionar vencimientos de documentación. */
export function puedeGestionarVencimientos(rol: Rol): boolean {
  return esDireccion(rol) || rol === "COOPERATIVA_DOCS" || rol === "GESTOR_ENTE";
}

/** Puede gestionar los cuadros tarifarios de la Calculadora ENCOSEP. */
export function puedeGestionarTarifas(rol: Rol): boolean {
  return esDireccion(rol) || rol === "GESTOR_ENTE";
}

/** Puede gestionar la fórmula de costo/km del contrato de Transporte (Grupo MR). */
export function puedeGestionarFormulaTransporte(rol: Rol): boolean {
  return esDireccion(rol) || rol === "GESTOR_ENTE" || rol === "EXPEDIENTES";
}

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
