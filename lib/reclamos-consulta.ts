/**
 * Query compartida de "Reclamos ingresados" (panel /consulta) — usada tanto
 * por la página como por el export a Excel, para no duplicar el where ni el
 * `select` restringido (sin datos personales del vecino).
 */
import { prisma } from "@/lib/prisma";
import { ESTADO_META, whereReclamosByRol } from "@/lib/admin";
import { SVC_META } from "@/lib/servicios";
import { parseLineaTransporte } from "@/lib/xlsx-reporte-reclamos";
import type { Prisma, ReclamoEstado, Rol, ServicioKind } from "@prisma/client";

export type FiltroReclamosConsulta = {
  estado?: string;
  svc?: string;
  q?: string;
  desde?: string;
  hasta?: string;
};

export type ReclamoConsultaFila = {
  id: string;
  codigo: string;
  titulo: string;
  barrio: string | null;
  estado: ReclamoEstado;
  createdAt: Date;
  linea: string;
  servicioKind: ServicioKind;
  servicioNombreCorto: string;
};

function construirWhere(sp: FiltroReclamosConsulta, rol: Rol, prestadoraId: string | null) {
  const where: Prisma.ReclamoWhereInput = { ...whereReclamosByRol(rol, prestadoraId) };
  if (sp.estado && sp.estado in ESTADO_META) {
    where.estado = sp.estado as ReclamoEstado;
  }
  if (sp.svc && sp.svc in SVC_META) {
    where.servicio = { kind: SVC_META[sp.svc as keyof typeof SVC_META].kind };
  }
  if (sp.q && sp.q.trim()) {
    const q = sp.q.trim();
    where.OR = [{ codigo: { contains: q } }, { titulo: { contains: q } }];
  }
  if (sp.desde || sp.hasta) {
    where.createdAt = {};
    if (sp.desde) where.createdAt.gte = new Date(`${sp.desde}T00:00:00`);
    if (sp.hasta) where.createdAt.lte = new Date(`${sp.hasta}T23:59:59`);
  }
  return where;
}

/**
 * `take`: la pantalla se limita a 100 (vista "a grosso modo"); el export a
 * Excel pasa un límite alto para traer todo el período filtrado.
 */
export async function obtenerReclamosConsulta(
  sp: FiltroReclamosConsulta,
  rol: Rol,
  prestadoraId: string | null,
  take = 100,
): Promise<ReclamoConsultaFila[]> {
  const where = construirWhere(sp, rol, prestadoraId);
  const reclamos = await prisma.reclamo.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take,
    select: {
      id: true,
      codigo: true,
      titulo: true,
      barrio: true,
      estado: true,
      createdAt: true,
      descripcion: true,
      servicio: { select: { kind: true, nombreCorto: true } },
    },
  });

  return reclamos.map((r) => {
    const { linea } = parseLineaTransporte(r.descripcion);
    return {
      id: r.id,
      codigo: r.codigo,
      titulo: r.titulo,
      barrio: r.barrio,
      estado: r.estado,
      createdAt: r.createdAt,
      linea: r.servicio.kind === "TRANSPORTE" ? linea : "",
      servicioKind: r.servicio.kind,
      servicioNombreCorto: r.servicio.nombreCorto,
    };
  });
}
