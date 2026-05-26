import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BrandStripe } from "@/components/ui/BrandStripe";
import { LogoEncosep } from "@/components/ui/LogoEncosep";
import { FormReset } from "./form";

export const metadata = { title: "Restablecer clave · ENCOSEP" };

export default async function RestablecerClavePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const u = await prisma.usuario.findUnique({
    where: { passwordResetToken: token },
    select: {
      nombre: true,
      apellido: true,
      passwordResetExpires: true,
    },
  });

  const valido =
    !!u && !!u.passwordResetExpires && u.passwordResetExpires > new Date();

  return (
    <main className="flex flex-1 items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex justify-center">
          <LogoEncosep size={88} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-bold tracking-widest text-muted uppercase text-center">
            ENCOSEP · Comodoro Rivadavia
          </div>
          <h1 className="text-2xl font-extrabold leading-tight text-navy text-center">
            Restablecer clave
          </h1>
          <BrandStripe className="mx-auto" />
        </div>

        {!valido ? (
          <>
            <div className="rounded-xl border border-svc-red/40 bg-svc-red/10 px-4 py-4 text-sm text-navy leading-relaxed">
              <p className="font-bold text-svc-red mb-1">Link inválido o vencido</p>
              <p>
                El link que abriste ya no es válido. Pedí uno nuevo desde
                &quot;Olvidé mi clave&quot;.
              </p>
            </div>
            <Link
              href="/olvide-clave"
              className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl bg-svc-red text-white font-bold uppercase tracking-wider hover:opacity-90 transition shadow-md shadow-svc-red/30"
            >
              Pedir un nuevo link
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-muted text-center">
              Hola <span className="font-semibold text-navy">{u.nombre}</span>,
              elegí una nueva clave para tu cuenta.
            </p>
            <FormReset token={token} />
          </>
        )}

        <Link
          href="/ingresar"
          className="text-center text-xs text-muted underline underline-offset-4"
        >
          ← Volver a ingresar
        </Link>
      </div>
    </main>
  );
}
