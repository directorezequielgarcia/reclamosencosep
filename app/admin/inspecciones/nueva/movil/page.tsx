import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeGestionarInspecciones } from "@/lib/admin";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FormMovil } from "@/components/inspecciones/FormMovil";

export const metadata = { title: "Nueva inspección (celular) · ENCOSEP" };

export default async function MovilPage({
  searchParams,
}: {
  searchParams: Promise<{ reclamoId?: string; servicioId?: string }>;
}) {
  const session = await auth();
  if (!session || !puedeGestionarInspecciones(session.user.rol)) {
    redirect("/admin");
  }

  const { reclamoId, servicioId: servicioIdParam } = await searchParams;

  let servicioId = servicioIdParam ?? "";
  let servicioNombre = "";
  let relamoCodigo: string | undefined;

  if (reclamoId) {
    const reclamo = await prisma.reclamo.findUnique({
      where: { id: reclamoId },
      select: {
        codigo: true,
        servicioId: true,
        servicio: { select: { nombre: true } },
      },
    });
    if (reclamo) {
      servicioId = reclamo.servicioId;
      servicioNombre = reclamo.servicio.nombre;
      relamoCodigo = reclamo.codigo;
    }
  } else if (servicioId) {
    const servicio = await prisma.servicio.findUnique({
      where: { id: servicioId },
      select: { nombre: true },
    });
    servicioNombre = servicio?.nombre ?? "";
  }

  // Si no hay servicio pre-seleccionado, cargamos la lista para el selector
  const servicios =
    servicioId
      ? []
      : await prisma.servicio.findMany({
          orderBy: { nombreCorto: "asc" },
          select: { id: true, nombre: true, nombreCorto: true },
        });

  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto">
      <Breadcrumbs
        items={[
          { label: "Panel", href: "/admin" },
          { label: "Inspecciones", href: "/admin/inspecciones" },
          ...(reclamoId && relamoCodigo
            ? [
                {
                  label: `Reclamo #${relamoCodigo}`,
                  href: `/admin/reclamo/${reclamoId}`,
                },
              ]
            : []),
          { label: "Nueva (celular)" },
        ]}
      />

      <header>
        <h1 className="text-xl font-extrabold text-navy">
          Carga rápida desde celular
        </h1>
        {servicioNombre ? (
          <p className="text-sm text-muted mt-1">
            Servicio: <strong className="text-navy">{servicioNombre}</strong>
            {relamoCodigo && (
              <>
                {" · "}Reclamo{" "}
                <strong className="text-navy font-mono">#{relamoCodigo}</strong>
              </>
            )}
          </p>
        ) : (
          <p className="text-sm text-muted mt-1">
            Cargá fotos, GPS y observaciones. Queda en borrador y podés editarla
            desde la PC después.
          </p>
        )}
      </header>

      <FormMovil
        servicioId={servicioId}
        servicioNombre={servicioNombre}
        servicios={servicios}
        reclamoId={reclamoId}
        relamoCodigo={relamoCodigo}
      />
    </div>
  );
}
