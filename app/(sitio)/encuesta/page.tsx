import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { enviarEncuesta } from "./actions";

export const metadata = { title: "Encuesta de servicios · ENCOSEP" };

const SERVICIOS = [
  { name: "puntajeAgua", label: "Agua y Saneamiento", color: "var(--c-blue-l)" },
  { name: "puntajeEnergia", label: "Energía Eléctrica y Alumbrado", color: "var(--c-yellow)" },
  { name: "puntajeResiduos", label: "Gestión de Residuos", color: "var(--c-green)" },
  { name: "puntajeTransporte", label: "Transporte Público", color: "#7e57c2" },
];

export default async function EncuestaPage({
  searchParams,
}: {
  searchParams: Promise<{ gracias?: string }>;
}) {
  const sp = await searchParams;
  const gracias = sp.gracias === "1";

  return (
    <>
      <SeccionHeader
        kicker="Tu opinión cuenta"
        titulo="¿Cómo evaluás los servicios públicos?"
        descripcion="Esta encuesta es anónima y alimenta los indicadores públicos del Ente. Calificá del 1 (muy mal) al 5 (muy bien) cada servicio del que quieras opinar."
        variante="naranja"
      />

      <main className="max-w-3xl mx-auto px-6 py-10">
        {gracias ? (
          <div className="rounded-2xl border-2 border-svc-green bg-svc-green/10 p-8 text-center">
            <div className="text-5xl mb-2">✓</div>
            <h2 className="text-2xl font-extrabold text-navy">
              ¡Gracias por tu respuesta!
            </h2>
            <p className="text-sm text-navy mt-2">
              Tu opinión se sumó al promedio público de satisfacción de los
              servicios.
            </p>
            <div className="flex gap-3 justify-center mt-5">
              <a
                href="/indicadores"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-navy-2 text-white font-bold text-sm"
              >
                Ver indicadores públicos
              </a>
              <a
                href="/"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-line-strong text-navy font-bold text-sm"
              >
                Volver al inicio
              </a>
            </div>
          </div>
        ) : (
          <form
            action={enviarEncuesta}
            className="flex flex-col gap-6 rounded-2xl border border-line bg-paper p-6"
          >
            <div>
              <h2 className="text-xl font-extrabold text-navy">
                Calificá cada servicio
              </h2>
              <p className="text-sm text-muted mt-1">
                Podés saltar el servicio del que no quieras opinar.
              </p>
            </div>

            {SERVICIOS.map((s) => (
              <fieldset key={s.name} className="border-t border-line pt-4">
                <legend className="text-sm font-bold text-navy">{s.label}</legend>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <label
                      key={n}
                      className="flex-1 cursor-pointer"
                      title={n === 1 ? "Muy mal" : n === 5 ? "Muy bien" : `${n}`}
                    >
                      <input
                        type="radio"
                        name={s.name}
                        value={n}
                        className="peer sr-only"
                      />
                      <div
                        className="text-center py-3 rounded-lg border-2 border-line-strong bg-paper-2 text-navy font-bold text-lg peer-checked:bg-navy-2 peer-checked:text-white peer-checked:border-navy-2 transition"
                      >
                        {n}
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted mt-1 uppercase tracking-wider">
                  <span>Muy mal</span>
                  <span>Muy bien</span>
                </div>
              </fieldset>
            ))}

            <fieldset className="border-t border-line pt-4 flex flex-col gap-3">
              <legend className="text-sm font-bold text-navy">
                Comentarios (opcional)
              </legend>
              <textarea
                name="comentario"
                rows={3}
                placeholder="¿Querés agregar algo? Falla recurrente, idea de mejora, agradecimiento, etc."
                className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y"
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">
                    Barrio (opcional)
                  </span>
                  <input
                    name="barrio"
                    type="text"
                    placeholder="ej: Pueyrredón"
                    className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">
                    DNI (opcional, no se muestra)
                  </span>
                  <input
                    name="dni"
                    type="text"
                    inputMode="numeric"
                    placeholder="solo para evitar respuestas múltiples"
                    className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper"
                  />
                </label>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Tu DNI se almacena hasheado (no se ve nunca). Solo sirve para
                evitar que la misma persona responda muchas veces.
              </p>
            </fieldset>

            <SubmitButton
              className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl bg-svc-red text-white font-bold uppercase tracking-wider shadow-md shadow-svc-red/30"
              pendingText="Enviando…"
            >
              Enviar mi opinión
            </SubmitButton>
          </form>
        )}
      </main>
    </>
  );
}
