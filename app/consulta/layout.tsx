import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { ROL_LABEL, puedeVerConsulta } from "@/lib/admin";
import { SubmitButton } from "@/components/ui/SubmitButton";

// Panel de solo lectura para roles institucionales externos al Ente (hoy:
// Autoridad de Aplicación). Deliberadamente separado de /admin — ese panel
// tiene navegación y datos (bandeja completa, WhatsApp, documentación) que
// no corresponde exponer fuera del equipo del Ente.
export default async function ConsultaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/ingresar?callbackUrl=/consulta");
  if (!puedeVerConsulta(session.user.rol)) redirect("/inicio");

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  const nombre = session.user.name ?? "Usuario";
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <div className="flex flex-1 flex-col w-full min-h-screen bg-paper-2">
      <header className="bg-navy text-white print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
          <Link href="/consulta" className="flex items-center gap-3">
            <div className="text-[10px] font-bold tracking-widest opacity-70 uppercase leading-tight">
              ENCOSEP
            </div>
            <div className="text-base font-bold leading-tight">
              Panel de consulta
            </div>
          </Link>

          <nav className="flex items-center gap-1 ml-4 flex-wrap">
            <NavLink href="/consulta">Inicio</NavLink>
            <NavLink href="/consulta/indicadores">Indicadores</NavLink>
            <NavLink href="/consulta/encuesta">Encuesta de satisfacción</NavLink>
            <NavLink href="/consulta/reclamos">Reclamos ingresados</NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="text-right leading-tight hidden sm:block">
              <div className="text-sm font-semibold">{nombre}</div>
              <div className="text-[11px] opacity-70">
                {ROL_LABEL[session.user.rol]}
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-white text-navy flex items-center justify-center font-bold">
              {inicial}
            </div>
            <form action={logout}>
              <SubmitButton
                className="text-xs underline underline-offset-4 opacity-80 hover:opacity-100"
                pendingText="Saliendo…"
              >
                Salir
              </SubmitButton>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 flex flex-col gap-6">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-lg text-sm font-medium opacity-85 hover:opacity-100 hover:bg-white/10 transition"
    >
      {children}
    </Link>
  );
}
