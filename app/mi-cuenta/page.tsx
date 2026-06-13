import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BrandHeader } from "@/components/ui/BrandHeader";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormDatos, FormClave } from "./forms";

export const metadata = { title: "Mi cuenta · ENCOSEP" };

const ROL_LABEL: Record<string, string> = {
  CIUDADANO: "Vecino/a",
  GESTOR_ENTE: "Equipo del Ente",
  OPERADOR_PRESTADORA: "Operador prestadora",
  SUPER_ADMIN: "Directorio",
  AUDITOR: "Auditor",
};

export default async function MiCuentaPage() {
  const session = await auth();
  if (!session) redirect("/ingresar?callbackUrl=/mi-cuenta");

  const u = await prisma.usuario.findUnique({
    where: { id: session.user.id },
  });
  if (!u) redirect("/ingresar");

  const institucionales = ["PEM", "CONCEJO_DELIBERANTE", "AUTORIDAD_APLICACION"];
  const volverHref =
    u.rol === "CIUDADANO"
      ? "/inicio"
      : institucionales.includes(u.rol)
        ? "/institucional"
        : "/admin";

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="flex flex-1 flex-col w-full max-w-2xl mx-auto px-4 sm:px-6 pb-12">
      <BrandHeader
        right={
          <div className="flex items-center gap-2">
            <Link
              href={volverHref}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-line-strong text-xs font-semibold text-navy hover:bg-paper-2"
            >
              ← Volver
            </Link>
            <form action={logout}>
              <SubmitButton
                className="px-3 py-1 rounded-full border border-line-strong text-xs font-semibold text-navy hover:bg-paper-2"
                pendingText="Saliendo…"
              >
                Salir
              </SubmitButton>
            </form>
          </div>
        }
      />

      <main className="flex flex-col gap-6 py-4">
        <header>
          <h1 className="text-2xl font-extrabold text-navy leading-tight">
            Mi cuenta
          </h1>
          <p className="text-sm text-muted mt-1">
            Actualizá tus datos o cambiá tu clave cuando lo necesites.
          </p>
        </header>

        <section className="rounded-2xl border border-line bg-paper p-5">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="text-[10px] uppercase tracking-wider font-bold text-muted">
              DNI
            </div>
            <div className="font-mono font-bold text-navy">{u.dni}</div>
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-navy/10 text-navy">
              {ROL_LABEL[u.rol] ?? u.rol}
            </span>
          </div>
          <p className="text-[12px] text-muted">
            El DNI es tu identificador y no se puede cambiar. Si tenés un error,
            comunicate con el Ente.
          </p>
        </section>

        <section className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-4">
            Datos personales
          </h2>
          <FormDatos
            defaults={{
              nombre: u.nombre,
              apellido: u.apellido,
              email: u.email ?? "",
              telefono: u.telefono ?? "",
            }}
          />
        </section>

        <section className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-4">
            Cambiar clave
          </h2>
          <FormClave />
        </section>

        <Link
          href={volverHref}
          className="text-center text-xs text-muted underline underline-offset-4 mt-2"
        >
          ← Volver
        </Link>
      </main>
    </div>
  );
}
