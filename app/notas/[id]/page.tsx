import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ambitoDeRol,
  esEnteRol,
  puedeVerNotas,
  NOTA_AMBITO_LABEL,
  NOTA_ESTADO_META,
} from "@/lib/notas";
import { TONE_CLASS } from "@/lib/admin";
import { responderNota, cambiarEstadoNota } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { BarraSesion } from "@/components/ui/BarraSesion";

export const metadata = { title: "Nota · ENCOSEP" };

function iconoAdjunto(tipo: string): string {
  if (tipo === "FOTO") return "🖼️";
  if (tipo === "VIDEO") return "🎬";
  if (tipo === "AUDIO") return "🔊";
  return "📎";
}

export default async function NotaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/ingresar");
  if (!puedeVerNotas(session.user.rol)) redirect("/inicio");

  const nota = await prisma.nota.findUnique({
    where: { id },
    include: {
      mensajes: {
        orderBy: { createdAt: "asc" },
        include: { adjuntos: true },
      },
    },
  });
  if (!nota) notFound();

  const esEnte = esEnteRol(session.user.rol);
  const ambito = ambitoDeRol(session.user.rol);
  if (!esEnte && ambito !== nota.ambito) redirect("/notas");

  const m = NOTA_ESTADO_META[nota.estado];

  return (
    <main className="flex flex-1 flex-col items-center bg-paper px-6 py-8">
      <div className="w-full max-w-2xl flex flex-col gap-5">
        <BarraSesion />
        <Link
          href="/notas"
          className="text-xs text-muted underline underline-offset-4"
        >
          ← Volver a notas
        </Link>

        <header className="rounded-2xl border border-line bg-paper p-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-svc-orange">
              {nota.numero}
            </span>
            <span
              className={`text-[10px] uppercase tracking-wider font-bold rounded-full border px-2 py-0.5 ${TONE_CLASS[m.tone]}`}
            >
              {m.label}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-navy mt-1">
            {nota.asunto}
          </h1>
          <p className="text-xs text-muted mt-1">
            {NOTA_AMBITO_LABEL[nota.ambito]} · {nota.destinatario}
          </p>

          <Link
            href={`/notas/${nota.id}/imprimir`}
            target="_blank"
            className="inline-block mt-3 px-4 py-2 rounded-lg bg-svc-orange text-white font-bold text-sm"
          >
            📄 Exportar nota (PDF)
          </Link>

          {esEnte && nota.estado !== "CERRADA" && (
            <form action={cambiarEstadoNota} className="flex gap-2 mt-3">
              <input type="hidden" name="notaId" value={nota.id} />
              <input type="hidden" name="estado" value="CERRADA" />
              <button
                type="submit"
                className="text-xs px-3 py-1.5 rounded-lg border border-line-strong text-navy font-semibold hover:bg-paper-2"
              >
                Cerrar gestión
              </button>
            </form>
          )}
        </header>

        {/* Hilo de mensajes */}
        <div className="flex flex-col gap-3">
          {nota.mensajes.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.delEnte ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[88%] px-3 py-2 rounded-2xl text-sm ${
                  msg.delEnte
                    ? "bg-svc-blue/15 text-navy rounded-br-sm"
                    : "bg-paper-2 border border-line text-navy rounded-bl-sm"
                }`}
              >
                <div className="text-[10px] uppercase tracking-wide font-bold text-muted mb-0.5">
                  {msg.delEnte ? "ENCOSEP" : "Organismo"} · {msg.autorNombre}
                </div>
                <div className="whitespace-pre-wrap leading-snug">
                  {msg.cuerpo}
                </div>
                {msg.adjuntos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.adjuntos.map((adj) => (
                      <a
                        key={adj.id}
                        href={adj.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-line bg-paper text-xs text-navy hover:bg-paper-3"
                      >
                        <span>{iconoAdjunto(adj.tipo)}</span>
                        <span className="max-w-[140px] truncate">
                          {adj.nombre ?? "Archivo"}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-[9px] text-muted mt-0.5">
                {msg.createdAt.toLocaleString("es-AR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Responder */}
        {nota.estado !== "CERRADA" && (
          <form
            action={responderNota}
            encType="multipart/form-data"
            className="rounded-2xl border border-line bg-paper p-4 flex flex-col gap-2"
          >
            <input type="hidden" name="notaId" value={nota.id} />
            <textarea
              name="cuerpo"
              required
              rows={3}
              placeholder="Escribí tu respuesta…"
              className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper resize-y"
            />
            <input
              type="file"
              name="archivos"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="text-xs text-navy file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-navy-2 file:text-white file:text-xs file:font-semibold"
            />
            <SubmitButton
              className="self-end px-4 py-2 rounded-lg bg-navy-2 text-white font-bold text-sm"
              pendingText="Enviando…"
            >
              Responder
            </SubmitButton>
          </form>
        )}
      </div>
    </main>
  );
}
