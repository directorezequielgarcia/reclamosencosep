import { redirect } from "next/navigation";

// El hub real es /institucional (ya existía, con Reportes/Fiscalización/
// Notas/Capacitación). Esta ruta bare quedó de una primera versión que
// duplicaba esa landing — ahora solo redirige para no tener dos "inicios".
export default function ConsultaIndexPage() {
  redirect("/institucional");
}
