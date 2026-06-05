import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TIPO_ACTO_META } from "@/lib/expedientes";
import { LogoEncosep } from "@/components/ui/LogoEncosep";
import { BotonImprimir } from "./BotonImprimir";

export const metadata = { title: "Emitir expediente · ENCOSEP" };

function fmt(d: Date): string {
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Parsea "EXP-2026-001" → { nro: "001", anio: "2026" }
function parseNumero(numero: string): { nro: string; anio: string } {
  const m = numero.match(/(\d{4})-(\d+)/);
  if (m) return { anio: m[1], nro: m[2] };
  return { anio: String(new Date().getFullYear()), nro: numero };
}

export default async function ImprimirExpedientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hasta?: string; solo?: string; hoja?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();

  const where: { id: string; prestadoraId?: string } = { id };
  if (session!.user.rol === "OPERADOR_PRESTADORA") {
    where.prestadoraId = session!.user.prestadoraId ?? "__none__";
  }

  const exp = await prisma.expediente.findFirst({
    where,
    include: {
      prestadora: true,
      iniciador: true,
      reclamos: { include: { ciudadano: true } },
      actos: {
        include: { autor: true, adjuntos: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!exp) notFound();

  const esEnte =
    session!.user.rol === "GESTOR_ENTE" || session!.user.rol === "SUPER_ADMIN";

  // Visibilidad: la prestadora solo imprime lo que tiene visible.
  let actos = esEnte
    ? exp.actos
    : exp.actos.filter(
        (a) => a.visiblePrestadora || a.tipo === "DESCARGO_PRESTADORA",
      );

  // Alcance de la emisión.
  let subtitulo = "Expediente completo";
  if (sp.solo) {
    actos = actos.filter((a) => a.id === sp.solo);
    subtitulo = "Etapa puntual";
  } else if (sp.hasta) {
    const corte = exp.actos.find((a) => a.id === sp.hasta);
    if (corte) {
      actos = actos.filter((a) => a.createdAt <= corte.createdAt);
      subtitulo = "Hasta la foja indicada";
    }
  }

  const hoja = sp.hoja === "oficio" ? "oficio" : "a4";
  const sizeCss = hoja === "oficio" ? "21.6cm 35.6cm" : "A4";
  const { nro, anio } = parseNumero(exp.numero);
  const reclamante =
    exp.reclamos[0]?.ciudadano
      ? `${exp.reclamos[0].ciudadano.nombre} ${exp.reclamos[0].ciudadano.apellido}`
      : exp.intervinientes ?? "—";

  // Conserva el alcance al cambiar de hoja.
  const baseQuery: Record<string, string> = {};
  if (sp.solo) baseQuery.solo = sp.solo;
  if (sp.hasta) baseQuery.hasta = sp.hasta;
  const linkHoja = (h: string) =>
    `?${new URLSearchParams({ ...baseQuery, hoja: h }).toString()}`;

  return (
    <div className="bg-paper-2 min-h-screen">
      <style>{`
        @media print {
          @page { size: ${sizeCss}; margin: 2cm 2.2cm; }
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
          <Link href={`/admin/expediente/${exp.id}`} className="text-sm underline">
            ← Volver
          </Link>
          <span className="text-sm font-semibold">
            Emitir: {subtitulo}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-80">Hoja:</span>
          <Link
            href={linkHoja("a4")}
            className={`text-xs px-2 py-1 rounded ${hoja === "a4" ? "bg-white text-navy font-bold" : "bg-navy-2"}`}
          >
            A4
          </Link>
          <Link
            href={linkHoja("oficio")}
            className={`text-xs px-2 py-1 rounded ${hoja === "oficio" ? "bg-white text-navy font-bold" : "bg-navy-2"}`}
          >
            Oficio
          </Link>
          <BotonImprimir />
        </div>
      </div>

      {/* Documento */}
      <div
        id="doc"
        className="max-w-[800px] mx-auto my-6 bg-white text-black p-12 shadow"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {/* Foja 1 · Carátula */}
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
              {exp.prestadora.cuit ? ` (CUIT ${exp.prestadora.cuit})` : ""}
            </p>
            <p>
              <strong>Reclamante:</strong> {reclamante}
            </p>
            {exp.intervinientes && (
              <p>
                <strong>Intervinientes:</strong> {exp.intervinientes}
              </p>
            )}
          </div>

          <div className="mt-10 text-xs text-gray-600">
            Iniciado el{" "}
            {exp.createdAt.toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}{" "}
            por {exp.iniciador.nombre} {exp.iniciador.apellido}
          </div>
        </div>

        {/* Actos: cada uno es una foja consecutiva en hoja nueva */}
        {actos.map((a, i) => {
          const ti = TIPO_ACTO_META[a.tipo];
          const foja = i + 2; // foja 1 es la carátula
          return (
            <div key={a.id} className="foja pt-4">
              <FojaHeader nro={nro} anio={anio} foja={foja} />
              <div className="mt-6">
                <div className="text-xs uppercase tracking-widest text-gray-600">
                  {ti.label}
                </div>
                <h2 className="text-xl font-bold mt-1">{a.titulo}</h2>
                <div className="text-xs text-gray-600 mt-1">
                  {fmt(a.createdAt)} · {a.autor.nombre} {a.autor.apellido}
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

                {a.notificadoEn && (
                  <div className="mt-5 text-xs text-gray-700 border-t border-gray-300 pt-2">
                    Notificado a {a.notificadoA} el {fmt(a.notificadoEn)}.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
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
      <span className="font-bold">
        Foja N° {String(foja).padStart(3, "0")}
      </span>
    </div>
  );
}
