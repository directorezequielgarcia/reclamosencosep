import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TIPO_ACTO_META } from "@/lib/expedientes";
import { LogoEncosep } from "@/components/ui/LogoEncosep";
import { BotonImprimirVecino } from "./BotonImprimirVecino";

export const metadata = { title: "Mi expediente · ENCOSEP" };

function fmt(d: Date): string {
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseNumero(numero: string): { nro: string; anio: string } {
  const m = numero.match(/(\d{4})-(\d+)/);
  if (m) return { anio: m[1], nro: m[2] };
  return { anio: String(new Date().getFullYear()), nro: numero };
}

export default async function MiExpedientePage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const session = await auth();

  // El vecino solo ve el expediente de SU reclamo.
  const reclamo = await prisma.reclamo.findFirst({
    where: { codigo, ciudadanoId: session!.user.id },
    include: {
      ciudadano: true,
      expediente: {
        include: {
          prestadora: true,
          actos: {
            // Solo lo confirmado (no borradores internos del Ente).
            where: { confirmadoEn: { not: null } },
            include: { adjuntos: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
  if (!reclamo || !reclamo.expediente) notFound();

  const exp = reclamo.expediente;
  const { nro, anio } = parseNumero(exp.numero);
  const reclamante = `${reclamo.ciudadano.nombre} ${reclamo.ciudadano.apellido}`;

  const imagenes = exp.actos.flatMap((a, i) =>
    a.adjuntos
      .filter((adj) => adj.tipo === "FOTO")
      .map((adj) => ({
        url: adj.url,
        foja: i + 2,
        acto: TIPO_ACTO_META[a.tipo].label,
        nombre: adj.nombre,
      })),
  );
  const fojaAnexo = exp.actos.length + 2;

  return (
    <div className="bg-paper-2 min-h-screen -mx-4 -my-4">
      <style>{`
        @media print {
          @page { size: A4; margin: 2cm 2.2cm; }
          body * { visibility: hidden; }
          #doc, #doc * { visibility: visible; }
          #doc { position: absolute; left: 0; top: 0; width: 100%; }
          .foja { page-break-before: always; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Barra de control (no se imprime) */}
      <div className="no-print sticky top-0 z-10 bg-navy text-white px-5 py-3 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/mis-reclamos/${codigo}`} className="text-sm underline">
            ← Volver a mi reclamo
          </Link>
          <span className="text-sm font-semibold">
            Expediente {exp.numero}
          </span>
        </div>
        <BotonImprimirVecino />
      </div>

      {exp.actos.length === 0 ? (
        <div className="max-w-[800px] mx-auto my-10 text-center text-muted text-sm">
          Tu reclamo ya tiene expediente abierto, pero todavía no hay actuaciones
          comunicadas para mostrar.
        </div>
      ) : (
        <div
          id="doc"
          className="max-w-[800px] mx-auto my-6 bg-white text-black p-12 shadow"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {/* Portada */}
          <FojaHeader nro={nro} anio={anio} foja={1} />
          <div className="text-center mt-10">
            <div className="flex justify-center mb-4">
              <LogoEncosep size={90} />
            </div>
            <div className="text-sm uppercase tracking-widest">
              Ente de Control de los Servicios Públicos
            </div>
            <div className="text-xs uppercase tracking-widest text-gray-600">
              Comodoro Rivadavia · Chubut
            </div>
            <div className="mt-10 text-3xl font-bold">
              EXPEDIENTE N° {nro}/{anio}
            </div>
            <div className="mt-1 text-base italic text-gray-700">
              {exp.tipoExpediente}
            </div>
            <div className="mt-10 mx-auto max-w-xl text-left border-t border-b border-black py-6 space-y-2 text-[15px]">
              <p>
                <strong>Carátula:</strong> {exp.caratula}
              </p>
              <p>
                <strong>Objeto:</strong> {exp.asunto}
              </p>
              <p>
                <strong>Prestadora:</strong> {exp.prestadora.razonSocial}
              </p>
              <p>
                <strong>Reclamante:</strong> {reclamante}
              </p>
            </div>
            <div className="mt-10 text-xs text-gray-600">
              Iniciado el{" "}
              {exp.createdAt.toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          {/* Actos confirmados */}
          {exp.actos.map((a, i) => {
            const ti = TIPO_ACTO_META[a.tipo];
            const foja = i + 2;
            return (
              <div key={a.id} className="foja pt-4">
                <FojaHeader nro={nro} anio={anio} foja={foja} />
                <div className="mt-6">
                  <div className="text-xs uppercase tracking-widest text-gray-600">
                    {ti.label}
                  </div>
                  <h2 className="text-xl font-bold mt-1">{a.titulo}</h2>
                  <div className="text-xs text-gray-600 mt-1">
                    {fmt(a.createdAt)}
                  </div>
                  <div className="mt-4 text-[15px] leading-relaxed whitespace-pre-wrap text-justify">
                    {a.cuerpo}
                  </div>
                  {a.adjuntos.length > 0 && (
                    <div className="mt-4 text-sm">
                      <strong>Documental adjunta:</strong>
                      <ul className="list-disc ml-6 mt-1">
                        {a.adjuntos.map((adj) => (
                          <li key={adj.id}>{adj.nombre ?? "Archivo"}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {a.tipo === "RESOLUCION" && (
                    <div className="mt-20 grid grid-cols-3 gap-8 text-center text-xs">
                      <div className="pt-1 border-t border-black">Presidente</div>
                      <div className="pt-1 border-t border-black">
                        Vicepresidente
                      </div>
                      <div className="pt-1 border-t border-black">Vocal</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Anexo de imágenes */}
          {imagenes.length > 0 && (
            <div className="foja pt-4">
              <FojaHeader nro={nro} anio={anio} foja={fojaAnexo} />
              <h2 className="text-lg font-bold mt-6 mb-4">
                Anexo — Documental gráfica
              </h2>
              <div className="flex flex-col gap-6">
                {imagenes.map((img, idx) => (
                  <figure
                    key={idx}
                    className="text-center"
                    style={{ breakInside: "avoid" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.nombre ?? `Imagen ${idx + 1}`}
                      className="mx-auto max-w-full border border-gray-300"
                      style={{ maxHeight: "20cm", objectFit: "contain" }}
                    />
                    <figcaption className="text-xs text-gray-600 mt-1">
                      Imagen {idx + 1} — {img.acto} (foja{" "}
                      {String(img.foja).padStart(3, "0")})
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FojaHeader({
  nro,
  anio,
  foja,
}: {
  nro: string;
  anio: string;
  foja: number;
}) {
  return (
    <div className="flex justify-between items-center text-[11px] text-gray-600 border-b border-gray-300 pb-1">
      <span>
        Expte. N° {nro}/{anio}
      </span>
      <span className="font-bold">Foja N° {String(foja).padStart(3, "0")}</span>
    </div>
  );
}
