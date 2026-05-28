import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { puedeExportarInformes } from "@/lib/admin";

export const metadata = { title: "Informes oficiales · Panel ENCOSEP" };

export default async function InformesPage() {
  const session = await auth();
  if (!session || !puedeExportarInformes(session.user.rol)) {
    redirect("/admin");
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-extrabold text-navy">Informes oficiales</h1>
        <p className="text-sm text-muted mt-1">
          Generación y exportación de los informes que el Directorio eleva al
          Concejo Deliberante y al Poder Ejecutivo Municipal, según la{" "}
          <strong className="text-navy">Ordenanza N° 13.189/17, art. 5°</strong>.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card
          titulo="Informe mensual"
          subtitulo="Art. 5° inciso k"
          descripcion="Informe técnico mensual por cada servicio público, con las 7 secciones obligatorias. Se elabora automáticamente con los reclamos, expedientes, inspecciones, documentación, encuestas e indicadores del mes seleccionado."
          accion="Próximamente"
        />
        <Card
          titulo="Informe anual de gestión"
          subtitulo="Al 1° de octubre de cada año"
          descripcion="Resumen anual que se somete a consideración del Concejo Deliberante y del Poder Ejecutivo Municipal. Agrega los 12 informes mensuales del período y suma bloques narrativos editables de balance, logros, desafíos y sugerencias."
          accion="Próximamente"
        />
      </div>

      <div className="rounded-2xl border border-line bg-paper-2 p-5">
        <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-2">
          Estado del módulo
        </h2>
        <p className="text-sm text-navy leading-relaxed">
          Estamos terminando de conectar las fuentes de datos del sistema
          (reclamos, expedientes, inspecciones de campo de Julieta, documentación
          revisada por Adriana, audiencias y boletines de Marcos, encuesta de
          satisfacción al cerrar reclamo y los indicadores agregados) para que el
          borrador del informe se arme solo. Una vez listo, vas a poder revisar
          cada sección, editar el lenguaje jurídico-administrativo y descargar el
          .docx con el formato Calibri 11 pt, interlineado simple, exactamente
          como elevás hoy al Directorio.
        </p>
        <p className="text-xs text-muted mt-3">
          Mientras tanto, podés seguir armando el informe mensual con el agente{" "}
          <code className="font-mono">generador-informes-encosep</code> desde
          Claude Code.{" "}
          <Link href="/admin" className="underline">
            Volver al panel
          </Link>
        </p>
      </div>
    </div>
  );
}

function Card({
  titulo,
  subtitulo,
  descripcion,
  accion,
}: {
  titulo: string;
  subtitulo: string;
  descripcion: string;
  accion: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5 flex flex-col gap-3">
      <div>
        <div className="text-[10px] uppercase tracking-wider font-bold text-muted">
          {subtitulo}
        </div>
        <h2 className="text-lg font-extrabold text-navy">{titulo}</h2>
      </div>
      <p className="text-sm text-navy leading-relaxed flex-1">{descripcion}</p>
      <div className="pt-2">
        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-paper-3 text-muted text-[11px] font-bold uppercase tracking-wider">
          {accion}
        </span>
      </div>
    </div>
  );
}
