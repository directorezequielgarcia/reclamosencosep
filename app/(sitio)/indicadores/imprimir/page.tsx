import Link from "next/link";
import { LogoEncosep } from "@/components/ui/LogoEncosep";
import { ESTADO_META } from "@/lib/admin";
import { getIndicadoresStats } from "@/lib/indicadores-stats";
import { BotonImprimirIndicadores } from "./BotonImprimirIndicadores";

export const metadata = { title: "Imprimir indicadores · ENCOSEP" };

type SP = { desde?: string; hasta?: string; svc?: string };

export default async function ImprimirIndicadoresPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const stats = await getIndicadoresStats(sp);
  const periodoTexto = `${stats.desde.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })} al ${stats.hasta.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}`;
  const pctResueltos =
    stats.totalPeriodo > 0 ? Math.round((stats.resueltos / stats.totalPeriodo) * 100) : 0;

  return (
    <div className="bg-paper-2 min-h-screen">
      <style>{`
        @media print {
          @page { size: A4; margin: 2cm; }
          body * { visibility: hidden; }
          #doc, #doc * { visibility: visible; }
          #doc { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 bg-navy text-white px-5 py-3 flex items-center gap-3 justify-between">
        <Link href="/indicadores" className="text-sm underline">
          ← Volver a Indicadores
        </Link>
        <BotonImprimirIndicadores />
      </div>

      <div
        id="doc"
        className="max-w-[800px] mx-auto my-6 bg-white text-black p-10 shadow"
      >
        <div className="flex items-center gap-4 border-b-2 border-black pb-3">
          <LogoEncosep size={56} />
          <div>
            <div className="text-sm font-bold uppercase tracking-wide">
              Ente de Control de los Servicios Públicos — ENCOSEP
            </div>
            <div className="text-xs text-gray-600">
              Comodoro Rivadavia · Provincia del Chubut
            </div>
          </div>
        </div>

        <h1 className="text-xl font-bold text-center mt-6">
          Indicadores públicos de gestión
        </h1>
        <p className="text-center text-sm text-gray-600 mt-1">
          Período: {periodoTexto}
          {stats.svcLabel ? ` — Servicio: ${stats.svcLabel}` : ""}
        </p>

        <SeccionTabla titulo="Cifras generales">
          <Fila a="Reclamos registrados (histórico)" b={String(stats.total)} />
          <Fila a="Reclamos en el período" b={String(stats.totalPeriodo)} />
          <Fila a="Reclamos resueltos" b={`${stats.resueltos} (${pctResueltos}%)`} />
          <Fila
            a="Tiempo medio de resolución"
            b={stats.tiempoMedioHoras ? `${stats.tiempoMedioHoras} hs` : "—"}
          />
        </SeccionTabla>

        <SeccionTabla titulo="Distribución por servicio">
          {stats.distribServicios.map((d) => (
            <Fila key={d.key} a={d.label} b={`${d.total} (${d.pct}%)`} />
          ))}
        </SeccionTabla>

        <SeccionTabla titulo="Estado de los reclamos">
          {stats.estadoBreakdown.map((e) => (
            <Fila
              key={e.estado}
              a={ESTADO_META[e.estado].label}
              b={`${e.n} (${e.pct}%)`}
            />
          ))}
        </SeccionTabla>

        {stats.cumplimiento.length > 0 && (
          <SeccionTabla titulo="Cumplimiento por prestadora">
            {stats.cumplimiento.map((c) => (
              <Fila
                key={c.nombre}
                a={c.nombre}
                b={`${c.resueltos} / ${c.total} (${c.pct ?? 0}%)`}
              />
            ))}
          </SeccionTabla>
        )}

        {stats.topBarrios.length > 0 && (
          <SeccionTabla titulo="Top barrios con más reclamos">
            {stats.topBarrios.map(([nombre, n]) => (
              <Fila key={nombre} a={nombre} b={String(n)} />
            ))}
          </SeccionTabla>
        )}

        <SeccionTabla titulo="Calidad del reporte">
          <Fila a="Con foto adjunta" b={`${stats.pctFoto}%`} />
          <Fila a="Con GPS o geolocalización" b={`${stats.pctGps}%`} />
          <Fila a="Con barrio especificado" b={`${stats.pctBarrio}%`} />
        </SeccionTabla>

        <p className="text-center text-[11px] text-gray-500 mt-8 italic">
          Reporte generado el{" "}
          {new Date().toLocaleString("es-AR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          desde el Portal de Reclamos ENCOSEP. Datos anonimizados y agregados.
        </p>
      </div>
    </div>
  );
}

function SeccionTabla({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <h2 className="text-sm font-bold uppercase tracking-wide border-b border-black pb-1 mb-2">
        {titulo}
      </h2>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function Fila({ a, b }: { a: string; b: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm py-1 border-b border-gray-200">
      <span>{a}</span>
      <span className="font-mono font-bold">{b}</span>
    </div>
  );
}
