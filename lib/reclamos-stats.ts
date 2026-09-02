import { prisma } from "@/lib/prisma";
import type { Prisma, ReclamoEstado, ServicioKind } from "@prisma/client";
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

export type ReporteReclamoDetalle = {
  id: string;
  codigo: string;
  estado: ReclamoEstado;
  direccion: string;
  barrio: string | null;
  vecino: string;
  fecha: string; // dd/mm hh:mm
  descripcion: string;
};

export type ReporteProblematica = {
  titulo: string; // texto libre cargado por el vecino ("¿Qué pasó?") — la problemática puntual
  cantidad: number;
  reclamos: ReporteReclamoDetalle[];
};

export type ReporteTema = {
  servicioId: string;
  nombre: string;
  nombreCorto: string;
  kind: ServicioKind;
  cantidad: number;
  problematicas: ReporteProblematica[];
};

export type ReporteDiario = {
  desde: string; // dd/mm/aaaa
  hasta: string; // dd/mm/aaaa
  generadoEn: string; // dd/mm/aaaa hh:mm
  total: number;
  temas: ReporteTema[];
};

/** Reclamos del rango [desde, hasta] agrupados por servicio (tema) y, dentro
 *  de cada uno, por título (la problemática puntual que cargó el vecino) —
 *  para el botón "Reporte diario" de la Bandeja. `where` permite respetar el
 *  filtrado por rol (ej. operador de prestadora ve solo lo suyo). */
export async function reporteDiarioPorTema(
  where: Prisma.ReclamoWhereInput,
  desde: Date,
  hasta: Date,
): Promise<ReporteDiario> {
  const reclamos = await prisma.reclamo.findMany({
    where: { ...where, createdAt: { gte: desde, lte: hasta } },
    select: {
      id: true,
      codigo: true,
      estado: true,
      titulo: true,
      descripcion: true,
      direccion: true,
      barrio: true,
      createdAt: true,
      ciudadano: { select: { nombre: true, apellido: true } },
      servicio: { select: { id: true, nombre: true, nombreCorto: true, kind: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const fmtDetalle = (d: Date) =>
    d.toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const temaMap = new Map<string, ReporteTema>();
  for (const r of reclamos) {
    let tema = temaMap.get(r.servicio.id);
    if (!tema) {
      tema = {
        servicioId: r.servicio.id,
        nombre: r.servicio.nombre,
        nombreCorto: r.servicio.nombreCorto,
        kind: r.servicio.kind,
        cantidad: 0,
        problematicas: [],
      };
      temaMap.set(r.servicio.id, tema);
    }
    tema.cantidad += 1;
    const titulo = r.titulo.trim() || "Sin especificar";
    let prob = tema.problematicas.find((p) => p.titulo === titulo);
    if (!prob) {
      prob = { titulo, cantidad: 0, reclamos: [] };
      tema.problematicas.push(prob);
    }
    prob.cantidad += 1;
    prob.reclamos.push({
      id: r.id,
      codigo: r.codigo,
      estado: r.estado,
      direccion: r.direccion,
      barrio: r.barrio,
      vecino: `${r.ciudadano.nombre} ${r.ciudadano.apellido}`,
      fecha: fmtDetalle(r.createdAt),
      descripcion: r.descripcion,
    });
  }

  const temas = [...temaMap.values()]
    .map((t) => ({
      ...t,
      problematicas: t.problematicas
        .map((p) => ({ ...p, reclamos: p.reclamos.reverse() })) // más reciente primero
        .sort((a, b) => b.cantidad - a.cantidad),
    }))
    .sort((a, b) => b.cantidad - a.cantidad);

  const fmtFecha = (d: Date) =>
    d.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });

  return {
    desde: fmtFecha(desde),
    hasta: fmtFecha(hasta),
    generadoEn: new Date().toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      dateStyle: "short",
      timeStyle: "short",
    }),
    total: reclamos.length,
    temas,
  };
}
