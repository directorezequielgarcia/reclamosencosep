import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { BrandStripe } from "@/components/ui/BrandStripe";

export const metadata = { title: "Ingresar · ENCOSEP" };

export default async function IngresarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/inicio");

  const sp = await searchParams;
  const error = sp.error;
  const callbackUrl = sp.callbackUrl ?? "/inicio";

  async function login(formData: FormData) {
    "use server";
    const dni = String(formData.get("dni") ?? "").replace(/[.\s]/g, "");
    const password = String(formData.get("password") ?? "");
    await signIn("credentials", {
      dni,
      password,
      redirectTo: "/inicio",
    });
  }

  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-10">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-bold tracking-widest text-muted uppercase">
            ENCOSEP · Comodoro Rivadavia
          </div>
          <h1 className="text-2xl font-extrabold leading-tight text-navy">
            Ingresá con tu DNI
          </h1>
          <BrandStripe />
          <p className="text-sm text-muted leading-relaxed mt-1">
            Necesitamos identificarte para registrar y darle seguimiento a tu
            reclamo.
          </p>
        </div>

        <form action={login} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-navy">
              DNI{" "}
              <span className="text-muted font-normal">
                (o CUIT, si sos prestadora)
              </span>
            </span>
            <input
              name="dni"
              type="text"
              inputMode="numeric"
              autoComplete="username"
              required
              placeholder="27345678 · ó 30528775409"
              className="w-full px-3 py-3 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-navy">Clave</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full px-3 py-3 rounded-xl border border-line-strong bg-paper text-navy text-base focus:outline-none focus:border-navy-2 focus:ring-2 focus:ring-navy-2/20"
            />
          </label>

          {error ? (
            <div className="text-sm text-svc-red bg-svc-red/10 border border-svc-red/30 rounded-lg px-3 py-2">
              No pudimos validarte. Revisá DNI y clave.
            </div>
          ) : null}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl bg-navy-2 text-white font-semibold hover:bg-navy transition"
          >
            Ingresar
          </button>
        </form>

        <div className="text-xs text-muted text-center pt-2 border-t border-line">
          <div className="font-semibold text-navy mb-1">Usuarios de prueba</div>
          <div>
            DNI <span className="font-mono">40555666</span> · clave{" "}
            <span className="font-mono">demo1234</span> (vecino)
          </div>
        </div>

        <Link
          href="/"
          className="text-center text-xs text-muted underline underline-offset-4"
        >
          Volver
        </Link>
        {/* hidden callback url for potential future use */}
        <input type="hidden" value={callbackUrl} readOnly hidden />
      </div>
    </main>
  );
}
