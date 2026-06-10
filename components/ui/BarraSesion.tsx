import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { ROL_LABEL } from "@/lib/admin";

/**
 * Barra de sesión reutilizable para las pantallas que NO viven dentro de un
 * layout con encabezado propio (institucional, notas, capacitación, etc.).
 *
 * Muestra quién está logueado y deja siempre a mano "Mi cuenta" y "Salir".
 * El logout es una server action propia, así que funciona en cualquier
 * pantalla sin depender del layout de ciudadano o de admin.
 */
export async function BarraSesion({ volver }: { volver?: string }) {
  const session = await auth();
  if (!session) return null;

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  const nombre = session.user.name ?? "Usuario";
  const inicial = nombre.charAt(0).toUpperCase();
  const rol = session.user.rol;

  return (
    <div className="flex items-center gap-2 py-2 border-b border-line mb-1">
      {volver ? (
        <Link
          href={volver}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-line-strong text-xs font-semibold text-navy hover:bg-paper-2"
        >
          ← Volver
        </Link>
      ) : null}

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/mi-cuenta"
          className="flex items-center gap-2 rounded-full border border-line pl-1 pr-3 py-1 hover:bg-paper-2"
          title="Mi cuenta"
        >
          <span className="w-7 h-7 rounded-full bg-navy-2 text-white flex items-center justify-center text-xs font-bold">
            {inicial}
          </span>
          <span className="hidden sm:flex flex-col leading-tight text-left">
            <span className="text-xs font-semibold text-navy truncate max-w-[160px]">
              {nombre}
            </span>
            <span className="text-[10px] text-muted">{ROL_LABEL[rol]}</span>
          </span>
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-full border border-line-strong text-xs font-semibold text-navy hover:bg-paper-2"
          >
            Salir
          </button>
        </form>
      </div>
    </div>
  );
}
