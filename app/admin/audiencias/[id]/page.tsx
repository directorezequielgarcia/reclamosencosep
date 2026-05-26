import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ESTADO_AUDIENCIA_META, MODALIDAD_META } from "@/lib/audiencias";
import { TONE_CLASS } from "@/lib/admin";
import { cambiarEstadoAudiencia } from "../actions";
import type { EstadoAudiencia } from "@prisma/client";

export const metadata = { title: "Audiencia · Panel ENCOSEP" };

const ESTADOS: EstadoAudiencia[] = [
  "PROGRAMADA",
  "ABIERTA_INSCRIPCION",
  "CERRADA_INSCRIPCION",
  "REALIZADA",
  "CANCELADA",
];

export default async function AudienciaAdminDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const a = await prisma.audienciaPublica.findUnique({
    where: { id },
    include: {
      inscripciones: { orderBy: { createdAt: "asc" } },
      autor: true,
    },
  });
  if (!a) notFound();
  const m = ESTADO_AUDIENCIA_META[a.estado];

  return (
    <div className="flex flex-col gap-5">
      <nav className="text-xs text-muted">
        <Link href="/admin/audiencias" className="hover:underline">
          ← Audiencias
        </Link>
      </nav>

      <header>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-extrabold text-navy">{a.titulo}</h1>
          <span className={`inline-flex items-center uppercase tracking-wider font-bold rounded-full border text-xs px-2.5 py-1 ${TONE_CLASS[m.tone]}`}>
            {m.label}
          </span>
        </div>
        <div className="text-sm text-muted mt-1">
          {MODALIDAD_META[a.modalidad].icon} {MODALIDAD_META[a.modalidad].label} ·{" "}
          {a.fecha.toLocaleString("es-AR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </header>

      <section className="rounded-2xl border border-line bg-paper p-5">
        <p className="text-sm text-navy whitespace-pre-wrap leading-relaxed">
          {a.descripcion}
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
          {a.lugar && (
            <div>
              <div className="text-xs text-muted">Lugar</div>
              <div className="text-navy">{a.lugar}</div>
            </div>
          )}
          {a.enlaceVirtual && (
            <div>
              <div className="text-xs text-muted">Enlace virtual</div>
              <a className="text-navy-2 underline break-all" href={a.enlaceVirtual} target="_blank" rel="noreferrer">
                {a.enlaceVirtual}
              </a>
            </div>
          )}
          {a.capacidad && (
            <div>
              <div className="text-xs text-muted">Capacidad</div>
              <div className="text-navy">
                {a.inscripciones.length} / {a.capacidad}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-base font-extrabold text-navy mb-3">
          Cambiar estado
        </h2>
        <form action={cambiarEstadoAudiencia} className="flex gap-2 items-end">
          <input type="hidden" name="id" value={a.id} />
          <select name="estado" defaultValue={a.estado} className="px-3 py-2 rounded-lg border border-line-strong text-sm bg-paper">
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{ESTADO_AUDIENCIA_META[e].label}</option>
            ))}
          </select>
          <button type="submit" className="px-4 py-2 rounded-lg bg-navy-2 text-white font-semibold text-sm">
            Aplicar
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-base font-extrabold text-navy mb-3">
          Inscriptos · {a.inscripciones.length}
        </h2>
        {a.inscripciones.length === 0 ? (
          <div className="text-sm text-muted">Aún sin inscripciones.</div>
        ) : (
          <ul className="divide-y divide-line">
            {a.inscripciones.map((i) => (
              <li key={i.id} className="py-2 text-sm flex items-center gap-3">
                <span className="font-semibold text-navy">
                  {i.nombre} {i.apellido}
                </span>
                <span className="font-mono text-muted">DNI {i.dni}</span>
                <span className="text-muted text-xs">{i.email}</span>
                {i.telefono && <span className="text-muted text-xs">· {i.telefono}</span>}
                <span className="ml-auto text-xs text-muted">
                  {i.createdAt.toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
