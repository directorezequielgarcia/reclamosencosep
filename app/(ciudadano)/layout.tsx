import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { BrandHeader } from "@/components/ui/BrandHeader";

export default async function CiudadanoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/ingresar");

  // Solo ciudadanos pasan al portal público. Roles institucionales van al panel.
  if (session.user.rol !== "CIUDADANO") {
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
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-line-strong text-xs font-semibold text-navy hover:bg-paper-2"
              title={`Cerrar sesión · ${nombre}`}
            >
              <span className="w-6 h-6 rounded-full bg-navy-2 text-white flex items-center justify-center text-xs font-bold">
                {inicial}
              </span>
              Salir
            </button>
          </form>
        }
      />
      {children}
    </div>
  );
}
