import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { MapaCalor, type PuntoCalor } from "@/components/mapa/MapaCalor";
import { SVC_META, SVC_ORDER } from "@/lib/servicios";
import type { Prisma, ServicioKind } from "@prisma/client";

export const metadata = { title: "Mapa de calor · ENCOSEP" };
export const revalidate = 60;

type SP = { svc?: string; estado?: string; mes?: string };

export default async function MapaCalorPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const where: Prisma.ReclamoWhereInput = {
    lat: { not: null },
    lng: { not: null },
  };

  // Filtros
  if (sp.svc && SVC_ORDER.includes(sp.svc as (typeof SVC_ORDER)[number])) {
    const kind = SVC_META[sp.svc as (typeof SVC_ORDER)[number]].kind;
    where.servicio = { kind };
  }
  if (sp.estado) {
    where.estado = sp.estado as Prisma.ReclamoWhereInput["estado"];
  }
  if (sp.mes && /^\d{4}-\d{2}$/.test(sp.mes)) {
    const [a, m] = sp.mes.split("-").map(Number);
    const desde = new Date(a, m - 1, 1);
    const hasta = new Date(a, m, 1);
    where.createdAt = { gte: desde, lt: hasta };
  }

  const reclamos = await prisma.reclamo.findMany({
    where,
    select: {
      codigo: true,
      lat: true,
      lng: true,
      estado: true,
      servicio: { select: { kind: true } },
    },
    take: 5000,
  });

  const puntos: PuntoCalor[] = reclamos
    .filter((r) => r.lat !== null && r.lng !== null)
    .map((r) => ({
      lat: r.lat as number,
      lng: r.lng as number,
      estado: r.estado,
      codigo: r.codigo,
      servicio: r.servicio.kind as PuntoCalor["servicio"],
    }));

  // Calcular los últimos 6 meses para el dropdown
  const hoy = new Date();
  const mesesOpts: Array<{ value: string; label: string }> = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const l = d.toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });
    mesesOpts.push({ value: v, label: l });
  }

  return (
    <>
      <SeccionHeader
        kicker="Datos en tiempo real"
        titulo="Mapa de calor de reclamos"
        descripcion="Distribución geográfica de los reclamos sobre Comodoro Rivadavia. Las zonas más rojas son las que concentran más reclamos. Filtrá por servicio, mes o estado."
      />

      <main className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-5">
        {/* FILTROS */}
        <form
          method="GET"
          className="flex flex-wrap gap-2 items-end p-3 rounded-xl border border-line bg-paper"
        >
          <Field label="Servicio">
            <select
              name="svc"
              defaultValue={sp.svc ?? ""}
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
            >
              <option value="">Todos</option>
              {SVC_ORDER.map((k) => (
                <option key={k} value={k}>
                  {SVC_META[k].short}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mes">
            <select
              name="mes"
              defaultValue={sp.mes ?? ""}
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
            >
              <option value="">Todos</option>
              {mesesOpts.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Estado">
            <select
              name="estado"
              defaultValue={sp.estado ?? ""}
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
            >
              <option value="">Todos</option>
              <option value="RECIBIDO">Recibido</option>
              <option value="EN_REVISION">En revisión</option>
              <option value="DERIVADO">Derivado</option>
              <option value="EN_PROCESO">En proceso</option>
              <option value="RESUELTO">Resuelto</option>
              <option value="CERRADO_SIN_SOLUCION">Cerrado sin solución</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
          </Field>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-navy-2 text-white font-semibold text-sm"
          >
            Aplicar
          </button>
          {(sp.svc || sp.mes || sp.estado) && (
            <Link
              href="/mapa-calor"
              className="px-4 py-2 rounded-lg border border-line-strong text-sm text-navy"
            >
              Limpiar
            </Link>
          )}
          <div className="ml-auto text-sm text-muted">
            <strong className="text-navy">{puntos.length}</strong> reclamo
            {puntos.length === 1 ? "" : "s"} con ubicación
          </div>
        </form>

        {puntos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong bg-paper-2 p-12 text-center text-muted text-sm">
            Aún no hay reclamos con ubicación GPS para los filtros elegidos.
          </div>
        ) : (
          <>
            <MapaCalor puntos={puntos} alto={580} />

            {/* LEYENDA */}
            <section className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-line bg-paper p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">
                  Intensidad de la zona
                </h3>
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 flex-1 rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, #4a8b3a 0%, #f0bc40 33%, #e88a3c 66%, #c4393c 100%)",
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted mt-1">
                  <span>Pocos reclamos</span>
                  <span>Muchos reclamos</span>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-paper p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">
                  Color del punto = servicio
                </h3>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <Pt color="#4ba8c2" label="Agua y Saneamiento" />
                  <Pt color="#f0bc40" label="Energía y Alumbrado" />
                  <Pt color="#4a8b3a" label="Residuos" />
                  <Pt color="#7e57c2" label="Transporte" />
                </div>
              </div>
            </section>

            <p className="text-xs text-muted leading-relaxed">
              Los datos están anonimizados: el mapa no muestra el nombre ni el
              DNI del vecino que cargó el reclamo, sólo su ubicación
              aproximada y el servicio. Esta herramienta de transparencia
              permite ver en qué zonas se concentran los problemas y exigir
              acciones concretas. Hacé click en un punto para ver el código
              del reclamo.
            </p>
          </>
        )}
      </main>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </span>
      {children}
    </label>
  );
}

function Pt({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block w-3 h-3 rounded-full"
        style={{ background: color }}
      />
      <span className="text-navy">{label}</span>
    </div>
  );
}
