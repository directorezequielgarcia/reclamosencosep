import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { MiniMapa } from "@/components/mapa/MiniMapa";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { svcFromKind } from "@/lib/servicios";
import { ESTADO_META } from "@/lib/admin";

export const metadata = { title: "Mi reclamo · ENCOSEP" };

// Eventos visibles para el vecino: el historial completo excepto comentarios internos
// del Ente. Mantengo CREACION, CAMBIO_ESTADO, ASIGNACION, NOTIFICACION.
const TIPOS_VISIBLES = ["CREACION", "CAMBIO_ESTADO", "ASIGNACION", "NOTIFICACION"];

export default async function DetalleMiReclamoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const session = await auth();

  const reclamo = await prisma.reclamo.findUnique({
    where: { codigo },
    include: {
      servicio: true,
      prestadora: true,
      adjuntos: true,
      expediente: true,
      eventos: {
        orderBy: { createdAt: "asc" },
        include: { autor: true },
      },
    },
  });

  if (!reclamo || reclamo.ciudadanoId !== session!.user.id) notFound();

  const svc = svcFromKind(reclamo.servicio.kind);
  const fotos = reclamo.adjuntos.filter((a) => a.tipo === "FOTO");
  const eventosVisibles = reclamo.eventos.filter((e) =>
    TIPOS_VISIBLES.includes(e.tipo),
  );

  const fechaLarga = reclamo.createdAt.toLocaleString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="flex flex-1 flex-col gap-4 py-4">
      <Link
        href="/mis-reclamos"
        className="text-xs text-muted hover:text-navy"
      >
        ← Mis reclamos
      </Link>

      <header className="flex items-start gap-3">
        <SvcIcon kind={svc} size={56} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-extrabold text-navy font-mono">
              #{reclamo.codigo}
            </h1>
            <EstadoBadge estado={reclamo.estado} size="sm" />
          </div>
          <div className="text-sm font-semibold text-navy mt-1 leading-snug">
            {reclamo.titulo}
          </div>
          <div className="text-[11px] text-muted mt-0.5">
            {reclamo.servicio.nombre}
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-line bg-paper p-4">
        <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
          Lo que contaste
        </div>
        <p className="text-sm text-navy whitespace-pre-wrap leading-relaxed">
          {reclamo.descripcion}
        </p>
        <div className="text-[11px] text-muted mt-2">
          Cargado el {fechaLarga}
        </div>
      </section>

      {fotos.length > 0 && (
        <section className="rounded-2xl border border-line bg-paper p-4">
          <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
            Fotos · {fotos.length}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {fotos.map((f) => (
              <a
                key={f.id}
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="block aspect-square rounded-xl overflow-hidden border border-line"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.url}
                  alt="foto del reclamo"
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-line bg-paper p-4">
        <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
          Ubicación
        </div>
        <div className="text-sm text-navy">
          {reclamo.direccion}
          {reclamo.barrio && (
            <span className="text-muted"> · {reclamo.barrio}</span>
          )}
        </div>
        {reclamo.lat !== null && reclamo.lng !== null && (
          <div className="mt-3">
            <MiniMapa lat={reclamo.lat} lng={reclamo.lng} alto={180} />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-paper p-4">
        <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
          Estado del trámite
        </div>
        <div className="text-xs text-muted leading-relaxed mb-3">
          Acá te avisamos cada movimiento que hagan el Ente o la prestadora.
        </div>
        <ol className="flex flex-col gap-3">
          {eventosVisibles.map((ev) => (
            <li key={ev.id} className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-navy-2 mt-2 shrink-0" />
              <div className="flex-1">
                <div className="text-[11px] text-muted">
                  {ev.createdAt.toLocaleString("es-AR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="text-sm text-navy mt-0.5 font-semibold">
                  {eventoLabelVecino(ev.tipo)}
                  {ev.estadoNuevo
                    ? ` → ${ESTADO_META[ev.estadoNuevo].label}`
                    : ""}
                </div>
                {ev.mensaje && (
                  <div className="text-sm text-navy bg-paper-2 rounded-lg p-2 mt-1.5 whitespace-pre-wrap">
                    {ev.mensaje}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-line bg-paper p-4">
        <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
          Prestadora responsable
        </div>
        <div className="text-sm font-semibold text-navy">
          {reclamo.prestadora?.razonSocial ?? "Por asignar"}
        </div>
        {reclamo.slaDeadline && !reclamo.cerradoEn && (
          <div className="text-xs text-muted mt-1">
            Plazo para resolver:{" "}
            {reclamo.slaDeadline.toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </div>
        )}
        {reclamo.cerradoEn && (
          <div className="text-xs text-svc-green font-semibold mt-1">
            Cerrado el{" "}
            {reclamo.cerradoEn.toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </div>
        )}
      </section>

      {reclamo.expediente && (
        <section className="rounded-2xl border border-svc-orange/40 bg-svc-orange/5 p-4">
          <div className="text-[11px] font-bold text-svc-orange uppercase tracking-wider mb-1">
            Expediente administrativo
          </div>
          <div className="text-sm font-mono font-bold text-svc-orange">
            {reclamo.expediente.numero}
          </div>
          <div className="text-xs text-navy mt-0.5">
            {reclamo.expediente.caratula}
          </div>
          <div className="text-[11px] text-muted mt-1">
            El Ente elevó tu reclamo a un expediente administrativo formal
            contra la prestadora.
          </div>
        </section>
      )}
    </main>
  );
}

function eventoLabelVecino(tipo: string): string {
  switch (tipo) {
    case "CREACION":
      return "Reclamo registrado";
    case "CAMBIO_ESTADO":
      return "Cambio de estado";
    case "ASIGNACION":
      return "Derivado a la prestadora";
    case "NOTIFICACION":
      return "Aviso del Ente";
    default:
      return tipo;
  }
}
