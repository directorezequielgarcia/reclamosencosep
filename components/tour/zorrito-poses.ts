import type { ServicioKind } from "@prisma/client";
import type { SvcKey } from "@/lib/servicios";

export type PoseZorrito =
  | "parado"
  | "agachado"
  | "colectivo"
  | "agua"
  | "residuos"
  | "energia";

export const POSES: Record<PoseZorrito, string> = {
  parado: "/imagenes/zorrito/zorrito-parado.png",
  agachado: "/imagenes/zorrito/zorrito-agachado.png",
  // Zorrito vestido de colectivero — también es el "Zorrito Transporte".
  colectivo: "/imagenes/zorrito/zorrito-colectivo.png",
  agua: "/imagenes/zorrito/zorrito-agua.jpg",
  residuos: "/imagenes/zorrito/zorrito-residuos.jpg",
  energia: "/imagenes/zorrito/zorrito-energia.jpg",
};

// El Zorrito vestido para cada servicio (uniforme/herramientas), para usar
// en pantallas donde ya se sabe con qué servicio está el vecino (wizard de
// reclamo tras elegir categoría, área fiscalizada de ese servicio, etc).
export const POSE_POR_SVC: Record<SvcKey, PoseZorrito> = {
  residuos: "residuos",
  energia: "energia",
  agua: "agua",
  transporte: "colectivo",
};

// Igual que POSE_POR_SVC pero indexado por el enum de Prisma (ServicioKind),
// para pantallas que leen el servicio directo de la base (ej: el campo
// `servicio` opcional de Boletin, usado por las novedades del home).
export const POSE_POR_SERVICIO_KIND: Record<ServicioKind, PoseZorrito> = {
  RESIDUOS: "residuos",
  ENERGIA: "energia",
  AGUA: "agua",
  TRANSPORTE: "colectivo",
};
