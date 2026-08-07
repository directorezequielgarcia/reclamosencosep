// Vercel corre las funciones Node en UTC y no permite fijar el env var TZ
// desde el dashboard (nombre reservado). Todo el código formatea fechas con
// toLocaleString("es-AR", ...) sin pasar timeZone explícito, así que depende
// de esta variable para mostrar la hora de Argentina en vez de UTC.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.env.TZ = "America/Argentina/Buenos_Aires";
  }
}
