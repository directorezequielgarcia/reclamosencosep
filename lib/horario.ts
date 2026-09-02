// Huso horario de Comodoro Rivadavia (Argentina, UTC-3 todo el año, sin
// horario de verano desde 2009). Se usa Intl en vez de un offset fijo a
// mano para no tener que mantenerlo si algún día cambia.
const TZ = "America/Argentina/Buenos_Aires";

// Horario hábil de atención de ENCOSEP: lunes a viernes de 8 a 15 hs.
const HORA_INICIO_HABIL = 8;
const HORA_FIN_HABIL = 15;

const fmtHoraDia = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hour: "numeric",
  hour12: false,
  weekday: "short",
});

/** true si `d` cae en horario hábil de ENCOSEP (lun-vie 8 a 15 hs, hora de
 *  Comodoro Rivadavia) — útil para separar la actividad ciudadana que llega
 *  cuando el Ente está atendiendo de la que llega fuera de ese horario. */
export function esHorarioHabil(d: Date): boolean {
  const partes = fmtHoraDia.formatToParts(d);
  const hora = Number(partes.find((p) => p.type === "hour")?.value ?? "0");
  const diaSemana = partes.find((p) => p.type === "weekday")?.value; // "Mon".."Sun"
  const esDiaHabil = diaSemana !== "Sat" && diaSemana !== "Sun";
  return esDiaHabil && hora >= HORA_INICIO_HABIL && hora < HORA_FIN_HABIL;
}

/** Medianoche de "hoy - diasAtras" en hora de Comodoro Rivadavia, devuelta
 *  como el instante UTC equivalente (para usar directo en un `where` de
 *  Prisma). Como Argentina no tiene horario de verano, un offset fijo de
 *  -3 hs es exacto. */
export function inicioDiaLocal(diasAtras: number): Date {
  const OFFSET_MS = -3 * 60 * 60 * 1000;
  const local = new Date(Date.now() + OFFSET_MS);
  local.setUTCHours(0, 0, 0, 0);
  local.setUTCDate(local.getUTCDate() - diasAtras);
  return new Date(local.getTime() - OFFSET_MS);
}

/** Fecha de hoy en formato local (dd/mm/aaaa), hora de Comodoro Rivadavia. */
export function fechaHoyLocal(): string {
  return new Intl.DateTimeFormat("es-AR", { timeZone: TZ }).format(new Date());
}

/** Último instante de "hoy - diasAtras" (23:59:59.999) en hora de Comodoro
 *  Rivadavia, como el instante UTC equivalente. Complemento de `inicioDiaLocal`
 *  para armar rangos [desde, hasta] de un día completo. */
export function finDiaLocal(diasAtras: number): Date {
  return new Date(inicioDiaLocal(diasAtras - 1).getTime() - 1);
}
