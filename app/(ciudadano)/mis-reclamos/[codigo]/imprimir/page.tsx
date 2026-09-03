import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ESTADO_META } from "@/lib/admin";
import { construirMapaEstatico } from "@/lib/mapa-estatico";
import { ImpresionControles } from "@/components/ui/ImpresionControles";
import { ReclamoImprimible } from "@/components/ui/ReclamoImprimible";

export const metadata = { title: "Imprimir reclamo · ENCOSEP" };

const TIPOS_VISIBLES = ["CREACION", "CAMBIO_ESTADO", "ASIGNACION", "NOTIFICACION", "ADJUNTO"];

export default async function ImprimirMiReclamoPage({
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
      ciudadano: true,
      expediente: true,
      adjuntos: { where: { tipo: "FOTO" } },
      eventos: { orderBy: { createdAt: "asc" }, include: { autor: true } },
    },
  });
  if (!reclamo || reclamo.ciudadanoId !== session!.user.id) notFound();

  const eventosVisibles = reclamo.eventos.filter(
    (e) => TIPOS_VISIBLES.includes(e.tipo) || (e.tipo === "COMENTARIO" && e.visibleVecino),
  );

  const mapa =
    reclamo.lat != null && reclamo.lng != null
      ? await construirMapaEstatico(reclamo.lat, reclamo.lng)
      : null;

  return (
    <div className="bg-paper-2 min-h-screen -mx-4 -my-4">
      <ImpresionControles volverHref={`/mis-reclamos/${codigo}`} volverLabel="← Volver a mi reclamo" />
      <ReclamoImprimible
        codigo={reclamo.codigo}
        origen={reclamo.origen}
        createdAt={reclamo.createdAt}
        estadoLabel={ESTADO_META[reclamo.estado].label}
        titulo={reclamo.titulo}
        descripcion={reclamo.descripcion}
        servicioNombre={reclamo.servicio.nombre}
        prestadoraNombre={reclamo.prestadora?.razonSocial ?? null}
        vecinoNombre={`${reclamo.ciudadano.nombre} ${reclamo.ciudadano.apellido}`}
        vecinoDni={reclamo.ciudadano.dni}
        vecinoContacto={
          [reclamo.ciudadano.email, reclamo.ciudadano.telefono].filter(Boolean).join(" · ") ||
          null
        }
        direccion={reclamo.direccion}
        barrio={reclamo.barrio}
        coordenadas={
          reclamo.lat != null && reclamo.lng != null
            ? `${reclamo.lat.toFixed(5)}, ${reclamo.lng.toFixed(5)}`
            : null
        }
        expediente={
          reclamo.expediente
            ? { numero: reclamo.expediente.numero, caratula: reclamo.expediente.caratula }
            : null
        }
        fotos={reclamo.adjuntos.map((f) => ({ url: f.url }))}
        mapaSvg={mapa?.svg ?? null}
        eventos={eventosVisibles.map((e) => ({
          id: e.id,
          tipo: e.tipo,
          estadoLabel: e.estadoNuevo ? ESTADO_META[e.estadoNuevo].label : null,
          autorNombre: e.autor ? `${e.autor.nombre} ${e.autor.apellido}` : null,
          mensaje: e.mensaje,
          visibleVecino: e.visibleVecino,
          createdAt: e.createdAt,
        }))}
        mostrarInterno={false}
      />
    </div>
  );
}
