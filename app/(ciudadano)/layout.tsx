import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { BrandHeader } from "@/components/ui/BrandHeader";
import { FabAsistenciaWsp } from "@/components/ui/FabAsistenciaWsp";

export default async function CiudadanoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/ingresar");

  // Solo el vecino usa el portal público. Cada otro rol va a SU panel:
  //  - roles institucionales (PEM, Concejo, Autoridad de Aplicación) → tablero
  //  - resto (Team ENCOSEP, prestadora, etc.) → panel administrativo
  // Importante: NO mandar a /admin a quien no es admin, porque /admin lo rebota
  // a /inicio y se genera un loop de redirección.
  if (session.user.rol !== "CIUDADANO") {
    const institucionales = ["PEM", "CONCEJO_DELIBERANTE", "AUTORIDAD_APLICACION"];
    if (institucionales.includes(session.user.rol)) {
      redirect("/institucional");
    }
    redirect("/admin");
  }

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  const nombre = session.user.name ?? "Vecino/a";
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <div className="flex flex-1 flex-col w-full max-w-md mx-auto px-4 sm:px-6">
      <BrandHeader
        right={
          <div className="flex items-center gap-2">
            <Link
              href="/mi-cuenta"
              className="w-7 h-7 rounded-full bg-navy-2 text-white flex items-center justify-center text-xs font-bold hover:opacity-90"
              title={`Mi cuenta · ${nombre}`}
            >
              {inicial}
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="px-2 py-1 rounded-full border border-line-strong text-xs font-semibold text-navy hover:bg-paper-2"
              >
                Salir
              </button>
            </form>
          </div>
        }
      />
      {children}
      <FabAsistenciaWsp />
    </div>
  );
}
