import Link from "next/link";

export default function Landing() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <div className="text-xs font-semibold tracking-widest text-muted uppercase">
            Ente de Control de Servicios Públicos · Comodoro Rivadavia
          </div>
          <h1 className="text-3xl font-extrabold leading-tight text-navy">
            Portal de Reclamos
          </h1>
          <div className="brand-stripe max-w-[180px]">
            <span className="bg-svc-green" />
            <span className="bg-svc-yellow" />
            <span className="bg-svc-blue" />
            <span className="bg-svc-red" />
          </div>
          <p className="text-sm text-muted leading-relaxed mt-2">
            Registrá y seguí reclamos sobre los servicios públicos bajo control
            del Ente: residuos, electricidad, agua y transporte.
          </p>
        </header>

        <div className="flex flex-col gap-3">
          <Link
            href="/ingresar"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-navy-2 text-white font-semibold hover:bg-navy transition"
          >
            Ingresar con DNI
          </Link>
          <Link
            href="/mapa"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-line-strong text-navy font-semibold hover:bg-paper-2 transition"
          >
            Ver mapa público
          </Link>
          <Link
            href="/admin"
            className="text-center text-xs text-muted underline underline-offset-4 mt-2"
          >
            Acceso institucional (Ente y prestadoras)
          </Link>
        </div>

        <footer className="mt-8 pt-4 border-t border-line text-xs text-muted">
          Versión preliminar · MVP — los datos cargados pueden borrarse durante
          el desarrollo.
        </footer>
      </div>
    </main>
  );
}
