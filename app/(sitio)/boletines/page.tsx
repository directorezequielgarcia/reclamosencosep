import { prisma } from "@/lib/prisma";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { TIPO_BOLETIN_META } from "@/lib/boletines";
import { MigajasSitio, VolverInicio } from "@/components/ui/MigajasSitio";

export const metadata = { title: "Boletines · ENCOSEP" };

export default async function BoletinesPublicoPage() {
  const boletines = await prisma.boletin.findMany({
    where: { publicado: true },
    orderBy: { fechaPublicacion: "desc" },
    take: 100,
  });

  return (
    <>
      <SeccionHeader
        kicker="Comunicaciones del Ente"
        titulo="Boletines y prensa"
        descripcion="Publicaciones oficiales del ENCOSEP: boletines, comunicados, notas de prensa y menciones en medios sobre los servicios públicos bajo control."
      />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <MigajasSitio items={[{ label: "Boletines" }]} />
        {boletines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong bg-paper-2 p-12 text-center text-muted text-sm">
            Próximamente publicaciones del Ente.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {boletines.map((b) => {
              const m = TIPO_BOLETIN_META[b.tipo];
              const esEnlace = b.enlaceExterno || b.archivoUrl;
              return (
                <li
                  key={b.id}
                  className="rounded-2xl border border-line bg-paper p-5 flex items-start gap-4 hover:shadow transition"
                >
                  <span className="text-3xl">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span
                        className="uppercase tracking-wider font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: m.color }}
                      >
                        {m.label}
                      </span>
                      {b.numero && <span className="font-mono text-muted">#{b.numero}</span>}
                      <span className="text-muted">·</span>
                      <span className="text-muted">
                        {b.fechaPublicacion.toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      {b.fuente && (
                        <>
                          <span className="text-muted">·</span>
                          <span className="text-muted italic">{b.fuente}</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-lg font-extrabold text-navy mt-1">{b.titulo}</h3>
                    {b.resumen && (
                      <p className="text-sm text-navy mt-1 leading-relaxed">{b.resumen}</p>
                    )}
                    {b.cuerpo && (
                      <details className="text-sm text-navy mt-2">
                        <summary className="cursor-pointer text-navy-2 font-semibold">
                          Leer texto completo
                        </summary>
                        <div className="mt-2 whitespace-pre-wrap leading-relaxed">
                          {b.cuerpo}
                        </div>
                      </details>
                    )}
                    {esEnlace && (
                      <a
                        href={(b.enlaceExterno || b.archivoUrl) ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-2 text-xs text-navy-2 font-bold underline underline-offset-4"
                      >
                        {b.archivoUrl ? "Descargar archivo" : "Abrir enlace"} →
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <VolverInicio />
      </main>
    </>
  );
}
