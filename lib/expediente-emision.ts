/**
 * Carga común para emitir un expediente (vista imprimible/PDF y exportación a
 * Word): aplica visibilidad por rol, alcance (completo / hasta una foja / etapa
 * puntual) y el número manual de expediente.
 */
import { prisma } from "@/lib/prisma";

export type AlcanceEmision = { hasta?: string; solo?: string; nro?: string };

type SesionMin = {
  user: { rol: string; prestadoraId?: string | null };
};

// Parsea "EXP-2026-001" o "07/2026" → { nro: "001", anio: "2026" }
export function parseNumero(numero: string): { nro: string; anio: string } {
  const m = numero.match(/(\d{4})-(\d+)/);
  if (m) return { anio: m[1], nro: m[2] };
  const barra = numero.match(/^\s*(\d+)\s*\/\s*(\d{4})\s*$/);
  if (barra) return { nro: barra[1].padStart(2, "0"), anio: barra[2] };
  return { anio: String(new Date().getFullYear()), nro: numero.trim() };
}

export async function cargarEmisionExpediente(
  id: string,
  sp: AlcanceEmision,
  session: SesionMin,
) {
  const where: { id: string; prestadoraId?: string } = { id };
  if (session.user.rol === "OPERADOR_PRESTADORA") {
    where.prestadoraId = session.user.prestadoraId ?? "__none__";
  }

  const exp = await prisma.expediente.findFirst({
    where,
    include: {
      prestadora: true,
      iniciador: true,
      reclamos: {
        include: {
          ciudadano: true,
          servicio: true,
          adjuntos: { orderBy: { createdAt: "asc" } },
        },
      },
      actos: {
        include: { autor: true, adjuntos: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!exp) return null;

  const esEnte =
    session.user.rol === "GESTOR_ENTE" || session.user.rol === "SUPER_ADMIN";

  // Visibilidad: la prestadora solo imprime lo que tiene visible.
  let actos = esEnte
    ? exp.actos
    : exp.actos.filter(
        (a) => a.visiblePrestadora || a.tipo === "DESCARGO_PRESTADORA",
      );

  let subtitulo = "Expediente completo";
  if (sp.solo) {
    actos = actos.filter((a) => a.id === sp.solo);
    subtitulo = "Etapa puntual";
  } else if (sp.hasta) {
    const corte = exp.actos.find((a) => a.id === sp.hasta);
    if (corte) {
      actos = actos.filter((a) => a.createdAt <= corte.createdAt);
      subtitulo = "Hasta la foja indicada";
    }
  }

  const manual = sp.nro?.trim() || undefined;

  // Con número manual, también se reemplaza el del sistema dentro de los textos.
  if (manual) {
    const reemplazar = (t: string) => t.split(exp.numero).join(manual);
    actos = actos.map((a) => ({
      ...a,
      titulo: reemplazar(a.titulo),
      cuerpo: reemplazar(a.cuerpo),
    }));
  }

  const numeroSistema = parseNumero(exp.numero);
  const { nro, anio } = manual ? parseNumero(manual) : numeroSistema;
  const reclamante = exp.reclamos[0]?.ciudadano
    ? `${exp.reclamos[0].ciudadano.nombre} ${exp.reclamos[0].ciudadano.apellido}`
    : (exp.intervinientes ?? "—");

  return { exp, actos, subtitulo, manual, numeroSistema, nro, anio, reclamante };
}

export function ubicacionReclamo(r: {
  direccion: string;
  barrio: string | null;
}): string {
  return [r.direccion, r.barrio].filter(Boolean).join(", ");
}
