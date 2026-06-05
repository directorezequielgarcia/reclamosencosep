import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ambitoDeRol,
  esEnteRol,
  puedeVerNotas,
  NOTA_AMBITO_LABEL,
} from "@/lib/notas";
import { LogoEncosep } from "@/components/ui/LogoEncosep";
import { BotonImprimirNota } from "./BotonImprimirNota";

export const metadata = { title: "Exportar nota · ENCOSEP" };

const ENTE_NOMBRE = "Ente de Control de los Servicios Públicos — ENCOSEP";

export default async function ImprimirNotaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/ingresar");
  if (!puedeVerNotas(session.user.rol)) redirect("/inicio");

  const nota = await prisma.nota.findUnique({
    where: { id },
    include: { mensajes: { orderBy: { createdAt: "asc" } } },
  });
  if (!nota || nota.mensajes.length === 0) notFound();

  const esEnte = esEnteRol(session.user.rol);
  const ambito = ambitoDeRol(session.user.rol);
  if (!esEnte && ambito !== nota.ambito) redirect("/notas");

  // La nota se exporta desde la óptica de quien la EMITIÓ (primer mensaje).
  const emiteEnte = nota.mensajes[0].delEnte;
  const cuerpo = nota.mensajes[0].cuerpo;
  const emisorNombre = emiteEnte ? ENTE_NOMBRE : NOTA_AMBITO_LABEL[nota.ambito];
  const destinatarioNombre = emiteEnte
    ? nota.destinatario
    : ENTE_NOMBRE;

  const fecha = nota.createdAt.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-paper-2 min-h-screen">
      <style>{`
        @media print {
          @page { size: A4; margin: 2.5cm 2.5cm; }
          body * { visibility: hidden; }
          #doc, #doc * { visibility: visible; }
          #doc { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Barra (no se imprime) */}
      <div className="no-print sticky top-0 z-10 bg-navy text-white px-5 py-3 flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/notas/${nota.id}`} className="text-sm underline">
            ← Volver
          </Link>
          <span className="text-sm font-semibold">Nota {nota.numero}</span>
        </div>
        <BotonImprimirNota />
      </div>

      {/* Documento */}
      <div
        id="doc"
        className="max-w-[800px] mx-auto my-6 bg-white text-black p-14 shadow"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {/* Encabezado / membrete */}
        <div className="flex items-center gap-4 border-b-2 border-black pb-3">
          {emiteEnte ? (
            <LogoEncosep size={64} />
          ) : (
            <div className="w-16 h-16 rounded-full border-2 border-black flex items-center justify-center text-xs text-center font-bold">
              {NOTA_AMBITO_LABEL[nota.ambito].slice(0, 3).toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-sm font-bold uppercase tracking-wide">
              {emisorNombre}
            </div>
            <div className="text-xs text-gray-600">
              Comodoro Rivadavia · Provincia del Chubut
            </div>
          </div>
        </div>

        {/* Lugar y fecha */}
        <div className="text-right text-sm mt-6">
          Comodoro Rivadavia, {fecha}.
        </div>

        {/* Número de nota */}
        <div className="text-sm font-bold mt-4">NOTA N° {nota.numero}</div>

        {/* Destinatario + S/D */}
        <div className="mt-6 text-[15px]">
          <div>Señores</div>
          <div className="font-bold">{destinatarioNombre}</div>
          <div className="font-bold mt-1">S / D</div>
        </div>

        {/* Referencia */}
        <div className="mt-6 text-[15px]">
          <span className="font-bold">Ref.:</span> {nota.asunto}
        </div>

        {/* Cuerpo */}
        <div className="mt-6 text-[15px] leading-relaxed text-justify whitespace-pre-wrap">
          De nuestra mayor consideración:
          {"\n\n"}
          {cuerpo}
        </div>

        <div className="mt-6 text-[15px] text-justify">
          Sin otro particular, y a la espera de una respuesta favorable,
          saludamos a Ud. muy atentamente.
        </div>

        {/* Firmas */}
        {emiteEnte ? (
          <div className="mt-24 grid grid-cols-3 gap-8 text-center text-xs">
            <div className="pt-1 border-t border-black">Presidente</div>
            <div className="pt-1 border-t border-black">Vicepresidente</div>
            <div className="pt-1 border-t border-black">Vocal</div>
          </div>
        ) : (
          <div className="mt-24 flex justify-end">
            <div className="w-64 pt-1 border-t border-black text-center text-xs">
              {NOTA_AMBITO_LABEL[nota.ambito]}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
