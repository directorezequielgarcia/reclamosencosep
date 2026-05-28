import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeGestionarInspecciones } from "@/lib/admin";
import { NuevaInspeccionForm } from "./nueva-form";

export const metadata = { title: "Nueva inspección · Panel ENCOSEP" };

export default async function NuevaInspeccionPage() {
  const session = await auth();
  if (!session || !puedeGestionarInspecciones(session.user.rol)) {
    redirect("/admin");
  }

  const [servicios, prestadoras] = await Promise.all([
    prisma.servicio.findMany({
      orderBy: { nombreCorto: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.prestadora.findMany({
      where: { activa: true },
      orderBy: { razonSocial: "asc" },
      select: { id: true, razonSocial: true },
    }),
  ]);

  // Fecha y hora actual en formato input datetime-local
  const ahora = new Date();
  const fechaPorDefecto = new Date(
    ahora.getTime() - ahora.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <nav className="text-xs text-muted">
        <Link href="/admin/inspecciones" className="hover:underline">
          ← Inspecciones
        </Link>
      </nav>

      <header>
        <h1 className="text-2xl font-extrabold text-navy">Nueva inspección</h1>
        <p className="text-sm text-muted mt-1">
          Carga inicial del relevamiento. Queda en{" "}
          <strong className="text-navy">borrador</strong>. Después sumás texto,
          audio dictado, fotos y ubicación desde la pantalla de detalle — todo
          opcional.
        </p>
      </header>

      <NuevaInspeccionForm
        servicios={servicios}
        prestadoras={prestadoras}
        fechaPorDefecto={fechaPorDefecto}
      />
    </div>
  );
}
