import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { esHorarioHabil, inicioDiaLocal, fechaHoyLocal } from "@/lib/horario";

export type ReclamoPorTipo = {
  nombre: string;
  nombreCorto: string;
  cantidad: number;
};

export type ResumenReclamos = {
  fecha: string; // dd/mm/aaaa, hoy en hora local
  hoy: number;
  hoyFueraDeHorario: number;
  porTipoHoy: ReclamoPorTipo[];
  semana: number;
};

/** Reclamos de hoy (con desglose por tipo y cuántos llegaron fuera del
 *  horario hábil de atención) + total de la semana. `where` permite filtrar
 *  por rol (ej. operador de prestadora), igual que el resto del dashboard. */
export async function resumenReclamos(
  where: Prisma.ReclamoWhereInput = {},
): Promise<ResumenReclamos> {
  const desdeHoy = inicioDiaLocal(0);
  const desde7 = inicioDiaLocal(6);

  const [reclamosHoy, semana] = await Promise.all([
    prisma.reclamo.findMany({
      where: { ...where, createdAt: { gte: desdeHoy } },
      select: {
        createdAt: true,
        servicio: { select: { nombre: true, nombreCorto: true } },
      },
    }),
    prisma.reclamo.count({ where: { ...where, createdAt: { gte: desde7 } } }),
  ]);

  const hoyFueraDeHorario = reclamosHoy.filter((r) => !esHorarioHabil(r.createdAt)).length;

  const porTipoMap = new Map<string, ReclamoPorTipo>();
  for (const r of reclamosHoy) {
    const actual = porTipoMap.get(r.servicio.nombre);
    if (actual) actual.cantidad += 1;
    else
      porTipoMap.set(r.servicio.nombre, {
        nombre: r.servicio.nombre,
        nombreCorto: r.servicio.nombreCorto,
        cantidad: 1,
      });
  }
  const porTipoHoy = [...porTipoMap.values()].sort((a, b) => b.cantidad - a.cantidad);

  return {
    fecha: fechaHoyLocal(),
    hoy: reclamosHoy.length,
    hoyFueraDeHorario,
    porTipoHoy,
    semana,
  };
}
