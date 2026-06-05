import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  ambitoDeRol,
  esEnteRol,
  puedeVerNotas,
  NOTA_AMBITO_LABEL,
} from "@/lib/notas";
import { crearNota } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const metadata = { title: "Nueva nota · ENCOSEP" };

export default async function NuevaNotaPage() {
  const session = await auth();
  if (!session) redirect("/ingresar");
  if (!puedeVerNotas(session.user.rol)) redirect("/inicio");

  const esEnte = esEnteRol(session.user.rol);
  const ambitoPropio = ambitoDeRol(session.user.rol);

  return (
    <main className="flex flex-1 flex-col items-center bg-paper px-6 py-8">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-extrabold text-navy">Nueva nota</h1>
          <p className="text-sm text-muted mt-1">
            {esEnte
              ? "Comunicación formal del Ente a un organismo. Podés adjuntar documental."
              : "Comunicación formal al ENCOSEP. Podés adjuntar documental."}
          </p>
        </header>

        <form
          action={crearNota}
          encType="multipart/form-data"
          className="rounded-2xl border border-line bg-paper p-5 flex flex-col gap-4"
        >
          {esEnte ? (
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                Organismo destinatario
              </span>
              <select
                name="ambito"
                required
                defaultValue=""
                className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
              >
                <option value="" disabled>
                  Elegí un organismo…
                </option>
                <option value="AUTORIDAD_APLICACION">
                  Autoridad de Aplicación
                </option>
                <option value="CONCEJO_DELIBERANTE">Concejo Deliberante</option>
                <option value="PEM">Poder Ejecutivo Municipal</option>
                <option value="PRESTADORA">Prestadora</option>
                <option value="OTRO">Otro organismo</option>
              </select>
            </label>
          ) : (
            <div className="rounded-lg bg-paper-2 border border-line px-3 py-2 text-sm text-navy">
              Esta nota se dirige al <strong>ENCOSEP</strong> en nombre de{" "}
              <strong>
                {ambitoPropio ? NOTA_AMBITO_LABEL[ambitoPropio] : "tu organismo"}
              </strong>
              .
            </div>
          )}

          {esEnte && (
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                Destinatario (nombre / referencia, opcional)
              </span>
              <input
                name="destinatario"
                placeholder="ej: Secretaría de Gobierno"
                className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
              />
            </label>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
              Asunto
            </span>
            <input
              name="asunto"
              required
              placeholder="ej: Solicitud de informe sobre el servicio de agua"
              className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
              Texto de la nota
            </span>
            <textarea
              name="cuerpo"
              required
              rows={8}
              placeholder="Redactá la comunicación…"
              className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
              Documental adjunta (opcional)
            </span>
            <input
              type="file"
              name="archivos"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="text-xs text-navy file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-navy-2 file:text-white file:text-xs file:font-semibold"
            />
          </label>

          <div className="flex gap-2">
            <SubmitButton
              className="px-5 py-2.5 rounded-lg bg-svc-orange text-white font-bold text-sm"
              pendingText="Enviando…"
            >
              Enviar nota
            </SubmitButton>
            <Link
              href="/notas"
              className="px-5 py-2.5 rounded-lg border border-line-strong text-navy font-semibold text-sm"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
