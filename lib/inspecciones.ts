import type { EstadoInspeccion, Prisma, Rol, TipoInspeccion } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { esDireccion } from "@/lib/admin";

export const TIPO_INSPECCION_META: Record<
  TipoInspeccion,
  { label: string; descripcion: string }
> = {
  OFICIO: {
    label: "De oficio",
    descripcion: "Inspección de rutina o seguimiento general del servicio.",
  },
  DENUNCIA_VECINO: {
    label: "Por denuncia",
    descripcion: "Disparada por una denuncia o reclamo concreto de un vecino.",
  },
  SEGUIMIENTO_EXPEDIENTE: {
    label: "Seguimiento de expediente",
    descripcion: "Verifica el cumplimiento o avance de un expediente abierto.",
  },
  EVENTO_PUNTUAL: {
    label: "Evento puntual",
    descripcion:
      "Contingencia o evento extraordinario (corte masivo, deslizamiento, etc.).",
  },
};

export const ESTADO_INSPECCION_META: Record<
  EstadoInspeccion,
  { label: string; tone: "neutral" | "info" | "warning" | "success" | "danger" }
> = {
  BORRADOR: { label: "Borrador", tone: "warning" },
  PUBLICADA: { label: "Publicada", tone: "success" },
  ARCHIVADA: { label: "Archivada", tone: "neutral" },
};

/**
 * Filtro WHERE para Prisma según el rol y usuario actual.
 *
 * Modelo de visibilidad (definido por el usuario):
 * - BORRADOR: solo el inspector que la creó.
 * - PUBLICADA / ARCHIVADA: visible según rol.
 *   - DIRECTOR / SUPER_ADMIN / AUDITOR: todas.
 *   - INSPECCIONES (Julieta) / GESTOR_ENTE: todas las publicadas/archivadas
 *     + sus propios borradores.
 *   - EXPEDIENTES (Yanina): solo las que tienen vínculo con expediente o
 *     algún reclamo asociado. Necesita ver las que aterrizan en su flujo.
 */
export function whereInspeccionesByRol(
  rol: Rol,
  userId: string,
): Prisma.InspeccionWhereInput {
  if (esDireccion(rol) || rol === "AUDITOR") return {};

  if (rol === "INSPECCIONES" || rol === "GESTOR_ENTE") {
    return {
      OR: [
        { estado: { in: ["PUBLICADA", "ARCHIVADA"] } },
        { estado: "BORRADOR", inspectorId: userId },
      ],
    };
  }

  if (rol === "EXPEDIENTES") {
    return {
      estado: { in: ["PUBLICADA", "ARCHIVADA"] },
      OR: [
        { expedienteId: { not: null } },
        { reclamos: { some: {} } },
        { reclamosOriginados: { some: {} } },
      ],
    };
  }

  // Cualquier otro rol no debería ver inspecciones — devolvemos un WHERE
  // que no matchea nada como defensa adicional.
  return { id: "__NONE__" };
}

/**
 * Versión específica para chequear si un usuario puede VER una inspección
 * puntual (detalle, .docx, etc.). Devuelve true si la inspección cae dentro
 * del WHERE del rol.
 */
export async function puedeVerInspeccion(
  inspeccionId: string,
  rol: Rol,
  userId: string,
): Promise<boolean> {
  const where = whereInspeccionesByRol(rol, userId);
  const ok = await prisma.inspeccion.findFirst({
    where: { AND: [{ id: inspeccionId }, where] },
    select: { id: true },
  });
  return !!ok;
}

/**
 * Genera el próximo código correlativo de inspección para el año dado.
 * Formato: INS-YYYY-NNN (ej: INS-2026-001). Es robusto frente a borrados:
 * usa el máximo `codigo` existente del año, no `count`.
 */
export async function siguienteCodigoInspeccion(anio: number): Promise<string> {
  const prefijo = `INS-${anio}-`;
  const ultima = await prisma.inspeccion.findFirst({
    where: { codigo: { startsWith: prefijo } },
    orderBy: { codigo: "desc" },
    select: { codigo: true },
  });
  let n = 1;
  if (ultima?.codigo) {
    const parte = ultima.codigo.slice(prefijo.length);
    const parsed = parseInt(parte, 10);
    if (Number.isFinite(parsed)) n = parsed + 1;
  }
  return `${prefijo}${String(n).padStart(3, "0")}`;
}
