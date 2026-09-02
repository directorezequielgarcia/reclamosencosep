import Link from "next/link";
import { auth } from "@/lib/auth";
import { whereReclamosByRol } from "@/lib/admin";
import { reporteDiarioPorTema } from "@/lib/reclamos-stats";
import { inicioDiaLocal, finDiaLocal } from "@/lib/horario";
import { SvcIcon } from "@/components/servicios/SvcIcon";
import { svcFromKind } from "@/lib/servicios";
import { BotonImprimir } from "./BotonImprimir";

export const metadata = { title: "Reporte diario · Panel ENCOSEP" };

type SP = { desde?: string; hasta?: string };

export default async function ReporteDiarioPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const where = whereReclamosByRol(
    session!.user.rol,
    session!.user.prestadoraId,
  );

  const desde = sp.desde ? new Date(`${sp.desde}T00:00:00`) : inicioDiaLocal(0);
  const hasta = sp.hasta ? new Date(`${sp.hasta}T23:59:59`) : finDiaLocal(0);
  const esSoloHoy = !sp.desde && !sp.hasta;

  const reporte = await reporteDiarioPorTema(where, desde, hasta);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-baseline justify-between gap-4 flex-wrap print:hidden">
        <div>
          <Link
            href="/admin/bandeja"
            className="text-xs text-navy-2 underline underline-offset-4"
          >
            ← Volver a la bandeja
          </Link>
          <h1 className="text-2xl font-extrabold text-navy mt-1">
            Reporte diario por tema y problemática
          </h1>
        </div>
        <BotonImprimir />
      </header>

      <div className="rounded-2xl border border-line bg-paper p-6 print:border-0 print:p-0">
        <div className="text-center mb-6 pb-4 border-b border-line">
          <div className="text-[10px] font-bold tracking-widest opacity-60 uppercase">
            ENCOSEP
          </div>
          <h2 className="text-xl font-extrabold text-navy mt-1">
            Reporte diario de reclamos por tema y problemática
          </h2>
          <p className="text-sm text-muted mt-1">
            {esSoloHoy
              ? `Reclamos de hoy, ${reporte.hasta}`
              : reporte.desde === reporte.hasta
                ? `Reclamos del ${reporte.desde}`
                : `Reclamos del ${reporte.desde} al ${reporte.hasta}`}
          </p>
          <p className="text-[11px] text-muted mt-0.5">
            Generado el {reporte.generadoEn} hs
          </p>
        </div>

        <div className="text-center mb-6">
          <span className="text-3xl font-extrabold text-navy">
            {reporte.total}
          </span>
          <span className="text-sm text-muted ml-2">
            {reporte.total === 1 ? "reclamo en el período" : "reclamos en el período"}
          </span>
        </div>

        {reporte.temas.length === 0 ? (
          <div className="text-center text-muted text-sm py-10">
            No hay reclamos registrados en este período.
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {reporte.temas.map((tema) => (
              <section
                key={tema.servicioId}
                className="rounded-xl border border-line overflow-hidden print:break-inside-avoid"
              >
                <div className="flex items-center gap-3 bg-paper-2 px-4 py-3">
                  <SvcIcon kind={svcFromKind(tema.kind)} size={32} />
                  <h3 className="flex-1 font-bold text-navy">{tema.nombre}</h3>
                  <span className="font-mono font-extrabold text-navy">
                    {tema.cantidad}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {tema.problematicas.map((p) => (
                      <tr
                        key={p.titulo}
                        className="border-t border-line last:border-b-0"
                      >
                        <td className="py-2 px-4 text-navy">{p.titulo}</td>
                        <td className="py-2 px-4 text-right font-mono font-semibold text-navy w-16">
                          {p.cantidad}
                        </td>
                        <td className="py-2 px-4 text-muted w-24 text-right">
                          {Math.round((p.cantidad / tema.cantidad) * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
