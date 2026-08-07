import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { esHorarioHabil, inicioDiaLocal } from "@/lib/horario";

// Mismo secreto que NextAuth: evita agregar una env var nueva solo para esto.
const SALT = process.env.AUTH_SECRET ?? "encosep-visitas";

export function hashIp(ip: string) {
  return crypto.createHash("sha256").update(`${ip}:${SALT}`).digest("hex");
}

export function ipDeRequest(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}

export async function registrarVisita(path: string, ip: string, userAgent: string | null) {
  await prisma.visita.create({
    data: { path, ipHash: hashIp(ip), userAgent: userAgent?.slice(0, 300) },
  });
}

export async function resumenVisitas() {
  const desdeHoy = inicioDiaLocal(0);
  const desde7 = inicioDiaLocal(6); // últimos 7 días incluyendo hoy
  const desde14 = inicioDiaLocal(13);

  const [hoy, hoyIps, semana, semanaIps, ultimos14] = await Promise.all([
    prisma.visita.count({ where: { createdAt: { gte: desdeHoy } } }),
    prisma.visita.findMany({
      where: { createdAt: { gte: desdeHoy } },
      distinct: ["ipHash"],
      select: { ipHash: true },
    }),
    prisma.visita.count({ where: { createdAt: { gte: desde7 } } }),
    prisma.visita.findMany({
      where: { createdAt: { gte: desde7 } },
      distinct: ["ipHash"],
      select: { ipHash: true },
    }),
    prisma.visita.findMany({
      where: { createdAt: { gte: desde14 } },
      select: { createdAt: true },
    }),
  ]);

  const serie: { fecha: string; visitas: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dia = inicioDiaLocal(i);
    const siguiente = inicioDiaLocal(i - 1);
    const visitas = ultimos14.filter(
      (v) => v.createdAt >= dia && v.createdAt < siguiente,
    ).length;
    serie.push({
      fecha: dia.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", timeZone: "America/Argentina/Buenos_Aires" }),
      visitas,
    });
  }

  const visitasHoy = ultimos14.filter((v) => v.createdAt >= desdeHoy);
  const hoyFueraDeHorario = visitasHoy.filter((v) => !esHorarioHabil(v.createdAt)).length;

  return {
    hoy,
    unicosHoy: hoyIps.length,
    hoyFueraDeHorario,
    semana,
    unicosSemana: semanaIps.length,
    serie,
  };
}
