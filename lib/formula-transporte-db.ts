import "server-only";
import { prisma } from "./prisma";
import { datosFormulaVacios, type DatosFormula } from "./formula-transporte";
import type {
  FormulaTransporte as DbFormula,
  FormulaTransporteEstado,
} from "@prisma/client";

export type FormulaRow = DbFormula;

function rowToDatos(row: DbFormula): DatosFormula {
  const d = row.datos as unknown as DatosFormula;
  return { ...datosFormulaVacios(row.periodo), ...d };
}

export async function listarFormulas(): Promise<DbFormula[]> {
  return prisma.formulaTransporte.findMany({
    orderBy: [{ periodo: "desc" }],
  });
}

export async function getFormulaRow(id: string): Promise<DbFormula | null> {
  return prisma.formulaTransporte.findUnique({ where: { id } });
}

export async function getFormulaPorPeriodo(
  periodo: string,
): Promise<DbFormula | null> {
  return prisma.formulaTransporte.findUnique({ where: { periodo } });
}

export async function getDatos(id: string): Promise<DatosFormula | null> {
  const row = await getFormulaRow(id);
  return row ? rowToDatos(row) : null;
}

export type CrearFormulaInput = {
  periodo: string;
  estado: FormulaTransporteEstado;
  fuente?: string | null;
  datos: DatosFormula;
  creadoPorId?: string | null;
  creadoPorNombre?: string | null;
};

export async function crearFormula(
  input: CrearFormulaInput,
): Promise<DbFormula> {
  return prisma.formulaTransporte.create({
    data: {
      periodo: input.periodo,
      estado: input.estado,
      fuente: input.fuente ?? null,
      datos: input.datos as object,
      creadoPorId: input.creadoPorId ?? null,
      creadoPorNombre: input.creadoPorNombre ?? null,
    },
  });
}

export type ActualizarFormulaInput = Partial<
  Omit<CrearFormulaInput, "creadoPorId" | "creadoPorNombre" | "periodo">
>;

export async function actualizarFormula(
  id: string,
  input: ActualizarFormulaInput,
): Promise<DbFormula> {
  return prisma.formulaTransporte.update({
    where: { id },
    data: {
      ...(input.estado !== undefined ? { estado: input.estado } : {}),
      ...(input.fuente !== undefined ? { fuente: input.fuente ?? null } : {}),
      ...(input.datos !== undefined ? { datos: input.datos as object } : {}),
    },
  });
}

export async function eliminarFormula(id: string): Promise<void> {
  await prisma.formulaTransporte.delete({ where: { id } });
}
