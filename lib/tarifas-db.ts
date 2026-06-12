import "server-only";
import { prisma } from "./prisma";
import {
  CUADRO_FEB_2026,
  cuadroSerializable,
  datosDeCuadro,
  type CuadroEstado,
  type CuadroTarifario,
  type DatosCuadro,
} from "./tarifas";
import type { CuadroTarifario as DbCuadro } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────
// Mapeo DB ⇄ objeto del motor de cálculo
// ─────────────────────────────────────────────────────────────────────────

function rowToCuadro(row: DbCuadro): CuadroTarifario {
  const d = row.datos as unknown as DatosCuadro;
  return {
    id: row.id,
    nombre: row.nombre,
    expediente: row.expediente ?? "",
    estado: row.estado as CuadroEstado,
    vigenteDesde: row.vigenteDesde
      ? row.vigenteDesde.toISOString().slice(0, 10)
      : "",
    pdfUrl: row.pdfUrl ?? undefined,
    fuente: row.fuente ?? "",
    ...d,
  };
}

export type CuadroRow = DbCuadro;

// ─────────────────────────────────────────────────────────────────────────
// Lectura pública (calculadora)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Cuadros visibles en la calculadora pública. Si la tabla no existe todavía
 * (migración sin aplicar) o está vacía, cae al cuadro feb-2026 del código,
 * de modo que la calculadora nunca queda sin datos.
 */
export async function cuadrosPublicados(): Promise<CuadroTarifario[]> {
  try {
    const rows = await prisma.cuadroTarifario.findMany({
      where: { publicado: true },
      orderBy: [{ vigenteDesde: "desc" }],
    });
    if (!rows.length) return [cuadroSerializable(CUADRO_FEB_2026)];
    // Vigentes primero, después pedidos/otros.
    const orden: Record<string, number> = {
      VIGENTE: 0,
      ANTERIOR: 1,
      PEDIDO: 2,
      BORRADOR: 3,
    };
    return rows
      .map(rowToCuadro)
      .sort((a, b) => (orden[a.estado ?? ""] ?? 9) - (orden[b.estado ?? ""] ?? 9));
  } catch {
    return [cuadroSerializable(CUADRO_FEB_2026)];
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Administración
// ─────────────────────────────────────────────────────────────────────────

export async function listarCuadros(): Promise<DbCuadro[]> {
  return prisma.cuadroTarifario.findMany({
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function getCuadroRow(id: string): Promise<DbCuadro | null> {
  return prisma.cuadroTarifario.findUnique({ where: { id } });
}

export async function getCuadro(id: string): Promise<CuadroTarifario | null> {
  const row = await getCuadroRow(id);
  return row ? rowToCuadro(row) : null;
}

export type CrearCuadroInput = {
  nombre: string;
  expediente?: string | null;
  estado: CuadroEstado;
  vigenteDesde?: Date | null;
  fuente?: string | null;
  pdfUrl?: string | null;
  datos: DatosCuadro;
  publicado: boolean;
  creadoPorId?: string | null;
  creadoPorNombre?: string | null;
};

export async function crearCuadro(input: CrearCuadroInput): Promise<DbCuadro> {
  return prisma.cuadroTarifario.create({
    data: {
      nombre: input.nombre,
      expediente: input.expediente ?? null,
      estado: input.estado,
      vigenteDesde: input.vigenteDesde ?? null,
      fuente: input.fuente ?? null,
      pdfUrl: input.pdfUrl ?? null,
      datos: input.datos as object,
      publicado: input.publicado,
      creadoPorId: input.creadoPorId ?? null,
      creadoPorNombre: input.creadoPorNombre ?? null,
    },
  });
}

export type ActualizarCuadroInput = Partial<
  Omit<CrearCuadroInput, "creadoPorId" | "creadoPorNombre">
>;

export async function actualizarCuadro(
  id: string,
  input: ActualizarCuadroInput,
): Promise<DbCuadro> {
  return prisma.cuadroTarifario.update({
    where: { id },
    data: {
      ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
      ...(input.expediente !== undefined
        ? { expediente: input.expediente ?? null }
        : {}),
      ...(input.estado !== undefined ? { estado: input.estado } : {}),
      ...(input.vigenteDesde !== undefined
        ? { vigenteDesde: input.vigenteDesde ?? null }
        : {}),
      ...(input.fuente !== undefined ? { fuente: input.fuente ?? null } : {}),
      ...(input.pdfUrl !== undefined ? { pdfUrl: input.pdfUrl ?? null } : {}),
      ...(input.datos !== undefined ? { datos: input.datos as object } : {}),
      ...(input.publicado !== undefined ? { publicado: input.publicado } : {}),
    },
  });
}

export async function eliminarCuadro(id: string): Promise<void> {
  await prisma.cuadroTarifario.delete({ where: { id } });
}

/**
 * Inserta el cuadro feb-2026 (del código) en la base si la tabla está vacía.
 * Idempotente: no hace nada si ya hay cuadros cargados.
 */
export async function seedCuadroInicial(): Promise<DbCuadro | null> {
  const n = await prisma.cuadroTarifario.count();
  if (n > 0) return null;
  return crearCuadro({
    nombre: CUADRO_FEB_2026.nombre,
    expediente: CUADRO_FEB_2026.expediente,
    estado: "VIGENTE",
    vigenteDesde: new Date(CUADRO_FEB_2026.vigenteDesde + "T00:00:00"),
    fuente: CUADRO_FEB_2026.fuente,
    pdfUrl: CUADRO_FEB_2026.pdfUrl ?? null,
    datos: datosDeCuadro(CUADRO_FEB_2026),
    publicado: true,
    creadoPorNombre: "Carga inicial (sistema)",
  });
}
