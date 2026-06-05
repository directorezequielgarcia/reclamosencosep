import type { AudienciaCapacitacion, Rol } from "@prisma/client";

export const AUDIENCIA_LABEL: Record<AudienciaCapacitacion, string> = {
  TODOS: "Para todos",
  TEAM_ENCOSEP: "Team ENCOSEP",
  AUTORIDAD_APLICACION: "Autoridad de Aplicación",
  CONCEJO_DELIBERANTE: "Concejo Deliberante",
  PEM: "Poder Ejecutivo Municipal",
  PRESTADORAS: "Prestadoras",
};

// Orden de las secciones en el catálogo.
export const AUDIENCIA_ORDEN: AudienciaCapacitacion[] = [
  "TODOS",
  "TEAM_ENCOSEP",
  "AUTORIDAD_APLICACION",
  "CONCEJO_DELIBERANTE",
  "PEM",
  "PRESTADORAS",
];

// Qué audiencia le corresponde a cada rol (para resaltar lo suyo).
export function audienciaDeRol(rol: Rol): AudienciaCapacitacion {
  switch (rol) {
    case "AUTORIDAD_APLICACION":
      return "AUTORIDAD_APLICACION";
    case "CONCEJO_DELIBERANTE":
      return "CONCEJO_DELIBERANTE";
    case "PEM":
      return "PEM";
    case "OPERADOR_PRESTADORA":
      return "PRESTADORAS";
    default:
      return "TEAM_ENCOSEP";
  }
}

// Roles del Ente: pueden gestionar (subir / borrar) capacitaciones.
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

export function puedeGestionarCapacitacion(rol: Rol): boolean {
  return ROLES_ENTE.includes(rol);
}

// Convierte una URL de YouTube a su forma embebible. Si no reconoce el
// formato, devuelve null (se muestra como enlace).
export function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
    return null;
  } catch {
    return null;
  }
}
