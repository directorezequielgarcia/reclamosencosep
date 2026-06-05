import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AUDIENCIA_LABEL,
  AUDIENCIA_ORDEN,
  audienciaDeRol,
  puedeGestionarCapacitacion,
  youtubeEmbed,
} from "@/lib/capacitacion";
import { LogoEncosep } from "@/components/ui/LogoEncosep";
import { eliminarCapacitacion } from "./actions";
import type { AudienciaCapacitacion } from "@prisma/client";

export const metadata = { title: "Capacitación · ENCOSEP" };

export default async function CapacitacionPage() {
  const session = await auth();
  if (!session) redirect("/ingresar");
  if (session.user.rol === "CIUDADANO") redirect("/inicio");

  const puedeGestionar = puedeGestionarCapacitacion(session.user.rol);
  const miAudiencia = audienciaDeRol(session.user.rol);

  const items = await prisma.capacitacion.findMany({
    orderBy: [{ audiencia: "asc" }, { orden: "asc" }, { createdAt: "desc" }],
  });

  const porAudiencia = (a: AudienciaCapacitacion) =>
    items.filter((i) => i.audiencia === a);

  const volver = puedeGestionar
    ? "/admin"
    : session.user.rol === "OPERADOR_PRESTADORA"
      ? "/admin"
      : "/institucional";

  return (
    <main className="flex flex-1 flex-col items-center bg-paper px-6 py-8">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <LogoEncosep size={48} />
            <div>
              <h1 className="text-2xl font-extrabold text-navy leading-tight">
                Capacitación
              </h1>
              <p className="text-xs text-muted">
                Videos, instructivos y guías para usar cada módulo.
              </p>
            </div>
          </div>
          {puedeGestionar && (
            <Link
              href="/capacitacion/nueva"
              className="px-4 py-2 rounded-lg bg-svc-orange text-white font-bold text-sm"
            >
              + Subir capacitación
            </Link>
          )}
        </header>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-line bg-paper p-10 text-center text-sm text-muted">
            Todavía no hay material de capacitación cargado.
            {puedeGestionar && " Subí el primero con + Subir capacitación."}
          </div>
        ) : (
          AUDIENCIA_ORDEN.map((aud) => {
            const lista = porAudiencia(aud);
            if (lista.length === 0) return null;
            const esMia = aud === miAudiencia || aud === "TODOS";
            return (
              <section key={aud} className="flex flex-col gap-3">
                <h2
                  className={`text-[11px] font-bold uppercase tracking-widest ${
                    esMia ? "text-svc-orange" : "text-muted"
                  }`}
                >
                  {AUDIENCIA_LABEL[aud]}
                  {esMia && aud !== "TODOS" && " · tu perfil"}
                </h2>
                <div className="grid gap-3">
                  {lista.map((item) => {
                    const embed =
                      item.tipo === "VIDEO" && item.url
                        ? youtubeEmbed(item.url)
                        : null;
                    return (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-line bg-paper p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-extrabold text-navy">
                              {item.tipo === "VIDEO"
                                ? "🎬 "
                                : item.tipo === "IMAGEN"
                                  ? "🖼️ "
                                  : "📋 "}
                              {item.titulo}
                            </h3>
                            {item.modulo && (
                              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                                Módulo: {item.modulo}
                              </span>
                            )}
                          </div>
                          {puedeGestionar && (
                            <form action={eliminarCapacitacion}>
                              <input type="hidden" name="id" value={item.id} />
                              <button
                                type="submit"
                                className="text-xs text-svc-red font-semibold hover:underline"
                              >
                                Eliminar
                              </button>
                            </form>
                          )}
                        </div>

                        <p className="text-sm text-navy mt-1 leading-relaxed whitespace-pre-wrap">
                          {item.descripcion}
                        </p>

                        {/* Video embebido (YouTube) */}
                        {embed && (
                          <div className="mt-3 aspect-video rounded-lg overflow-hidden border border-line">
                            <iframe
                              src={embed}
                              title={item.titulo}
                              allowFullScreen
                              className="w-full h-full"
                            />
                          </div>
                        )}

                        {/* Video no-YouTube o recurso externo */}
                        {item.tipo === "VIDEO" && item.url && !embed && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-3 text-sm text-svc-blue underline"
                          >
                            ▶ Ver el video
                          </a>
                        )}

                        {/* Imagen / instructivo gráfico */}
                        {item.tipo === "IMAGEN" && item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.url}
                              alt={item.titulo}
                              className="mt-3 max-w-full rounded-lg border border-line"
                            />
                          </a>
                        )}

                        {/* Guía paso a paso */}
                        {item.tipo === "GUIA" && item.contenido && (
                          <details className="mt-3 rounded-lg border border-line bg-paper-2 px-3 py-2">
                            <summary className="text-sm font-bold text-navy cursor-pointer">
                              Abrir la guía
                            </summary>
                            <div className="mt-2 text-sm text-navy whitespace-pre-wrap leading-relaxed">
                              {item.contenido}
                            </div>
                          </details>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}

        <Link
          href={volver}
          className="text-center text-xs text-muted underline underline-offset-4"
        >
          ← Volver
        </Link>
      </div>
    </main>
  );
}
