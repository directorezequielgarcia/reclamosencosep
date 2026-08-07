import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { svcFromKind } from "@/lib/servicios";

export const metadata = { title: "Reclamo registrado · ENCOSEP" };

export default async function ListoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const session = await auth();
  const reclamo = await prisma.reclamo.findUnique({
    where: { codigo },
    include: { servicio: true, prestadora: true, adjuntos: true },
  });

  if (!reclamo || reclamo.ciudadanoId !== session!.user.id) notFound();

  const svc = svcFromKind(reclamo.servicio.kind);
  const deadline = reclamo.slaDeadline?.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const fotos = reclamo.adjuntos.filter((a) => a.tipo === "FOTO");

  return (
    <main className="flex flex-1 flex-col gap-5 py-6 items-center text-center">
      <div className="w-16 h-16 rounded-full bg-svc-green/10 border-2 border-svc-green flex items-center justify-center text-svc-green text-3xl font-bold">
        ✓
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest text-muted font-semibold">
          Reclamo registrado
        </div>
        <div className="text-4xl font-extrabold text-navy mt-1 font-mono tracking-wider">
          #{reclamo.codigo}
        </div>
      </div>

      <p className="text-sm text-muted leading-relaxed max-w-xs">
        Guardá este número para hacer el seguimiento. También vas a poder verlo
        en <strong className="text-navy">Mis reclamos</strong>.
      </p>

      <div className="w-full flex flex-col gap-2 rounded-2xl border border-line bg-paper p-4 text-left text-sm">
        <div className="flex items-center gap-3">
          <SvcIcon kind={svc} size={40} />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-navy truncate">{reclamo.titulo}</div>
            <div className="text-xs text-muted truncate">
              {reclamo.direccion}
              {reclamo.barrio ? ` · ${reclamo.barrio}` : ""}
            </div>
          </div>
        </div>

        {fotos.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {fotos.map((f) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={f.id}
                src={f.url}
                alt="foto del reclamo"
                className="w-full aspect-square object-cover rounded-lg border border-line"
              />
            ))}
          </div>
        )}

        <div className="border-t border-line pt-2 mt-1 grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-muted">Prestadora</div>
            <div className="font-semibold text-navy">
              {reclamo.prestadora?.razonSocial ?? "Por asignar"}
            </div>
          </div>
          <div>
            <div className="text-muted">Plazo (SLA)</div>
            <div className="font-semibold text-navy">{deadline}</div>
          </div>
        </div>
      </div>

      <div className="w-full rounded-2xl border border-line bg-paper-2 p-4 text-left">
        <div className="text-xs font-bold uppercase tracking-wider text-navy">
          ¿Qué más podés hacer?
        </div>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm">
          <li>
            <Link href="/tarifas" className="text-navy-2 font-semibold underline underline-offset-2">
              🧮 Controlar tu factura
            </Link>
          </li>
          <li>
            <Link href="/audiencias" className="text-navy-2 font-semibold underline underline-offset-2">
              🏛️ Participar en audiencias públicas
            </Link>
          </li>
          <li>
            <Link href="/encuesta" className="text-navy-2 font-semibold underline underline-offset-2">
              ⭐ Calificar los servicios públicos
            </Link>
          </li>
        </ul>
        <Link
          href="/atencion-usuarios"
          className="inline-block mt-3 text-xs text-muted underline underline-offset-2"
        >
          Ver todo lo que podés hacer →
        </Link>
      </div>

      <div className="flex-1" />

      <div className="w-full flex flex-col gap-2">
        <Link
          href="/mis-reclamos"
          className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-navy-2 text-white font-semibold"
        >
          Ver mis reclamos
        </Link>
        <Link
          href="/inicio"
          className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-line-strong text-navy font-semibold"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
