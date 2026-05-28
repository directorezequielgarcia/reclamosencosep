import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { puedeGestionarInspecciones } from "@/lib/admin";

export const metadata = { title: "Inspecciones de campo · Panel ENCOSEP" };

export default async function InspeccionesPage() {
  const session = await auth();
  if (!session || !puedeGestionarInspecciones(session.user.rol)) {
    redirect("/admin");
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-extrabold text-navy">
          Inspecciones de campo
        </h1>
        <p className="text-sm text-muted mt-1">
          Carga de inspecciones realizadas por el equipo del Ente sobre los
          servicios públicos bajo control, con captura de audio, fotos y
          ubicación geográfica desde el celular.
        </p>
      </header>

      <div className="rounded-2xl border border-line bg-paper-2 p-5">
        <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-2">
          En construcción
        </h2>
        <p className="text-sm text-navy leading-relaxed">
          El módulo de inspecciones se está armando. Va a incluir:
        </p>
        <ul className="text-sm text-navy leading-relaxed mt-2 list-disc pl-5 space-y-1">
          <li>
            App PWA para celular: graba audio dictado en campo + fotos + GPS
            automático.
          </li>
          <li>
            Bandeja de inspecciones con filtros por servicio, zona, fecha,
            inspector.
          </li>
          <li>
            <strong>Acta de inspección</strong> exportable como .docx con datos,
            mapa, fotos embebidas, transcripción del audio, firma del inspector
            y sello del Ente.
          </li>
          <li>
            <strong>Informe mensual de inspecciones</strong> exportable como
            .docx, agrupando todas las inspecciones del mes por servicio y zona,
            con totalizadores y mapa de calor.
          </li>
          <li>
            Alimenta automáticamente la sección 2 (irregularidades) y 3
            (alteraciones) del informe mensual oficial del Directorio.
          </li>
        </ul>
        <p className="text-xs text-muted mt-3">
          <Link href="/admin" className="underline">
            Volver al panel
          </Link>
        </p>
      </div>
    </div>
  );
}
