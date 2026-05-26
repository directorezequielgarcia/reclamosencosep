import { SeccionHeader } from "@/components/ui/SeccionHeader";

export const metadata = { title: "Acciones del Ente · ENCOSEP" };

const TIPOS_ACCION = [
  {
    icon: "🔍",
    titulo: "Inspecciones",
    descripcion:
      "Verificación en terreno del cumplimiento de los pliegos y reglamentos por parte de las prestadoras. Se realizan inspecciones programadas y sorpresivas.",
  },
  {
    icon: "🤝",
    titulo: "Mesas de Trabajo",
    descripcion:
      "Reuniones de coordinación con las empresas prestadoras (SCPL, Clear Urbana, Patagonia, Diadema) y con las Secretarías Municipales. Anticipamos crisis y trabajamos sobre conflictos puntuales.",
  },
  {
    icon: "📋",
    titulo: "Relevamientos y Monitoreos de Oficio",
    descripcion:
      "Acciones de fiscalización proactiva iniciadas por el Ente — sin reclamo previo — para verificar zonas sensibles, puntos críticos del servicio y cumplimiento normativo.",
  },
  {
    icon: "🚐",
    titulo: "EnCoSeP Móvil en tu barrio",
    descripcion:
      "Visitas territoriales del Ente a los barrios de Comodoro Rivadavia para escuchar a los vecinos en el lugar de los hechos y registrar reclamos en terreno.",
  },
];

const FOTOS = Array.from(
  { length: 14 },
  (_, i) => `/acciones/foto-${String(i + 1).padStart(2, "0")}.jpg`,
);

const VIDEOS = Array.from(
  { length: 2 },
  (_, i) => `/acciones/video-${String(i + 1).padStart(2, "0")}.mp4`,
);

export default function AccionesPage() {
  return (
    <>
      <SeccionHeader
        kicker="Lo que hacemos"
        titulo="Acciones del Ente"
        descripcion="Fiscalización territorial, articulación con prestadoras y presencia barrial. Acá compartimos un registro fotográfico y audiovisual de la gestión."
      />

      <main className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-12">
        {/* TIPOS DE ACCION */}
        <section>
          <div className="text-xs font-bold tracking-widest uppercase text-muted">
            Líneas de acción
          </div>
          <h2 className="text-2xl font-extrabold text-navy mt-1">
            Cuatro tipos de intervención del Ente
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            {TIPOS_ACCION.map((t) => (
              <div
                key={t.titulo}
                className="rounded-2xl border border-line bg-paper p-5"
              >
                <div className="text-3xl mb-2">{t.icon}</div>
                <h3 className="text-lg font-extrabold text-navy">{t.titulo}</h3>
                <p className="text-sm text-navy mt-2 leading-relaxed">
                  {t.descripcion}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* GALERIA DE FOTOS */}
        <section>
          <div className="text-xs font-bold tracking-widest uppercase text-muted">
            Registro fotográfico
          </div>
          <h2 className="text-2xl font-extrabold text-navy mt-1">
            Galería de acciones · {FOTOS.length} fotos
          </h2>
          <p className="text-sm text-muted mt-2 max-w-3xl">
            Imágenes de las inspecciones, mesas de trabajo y recorridas
            barriales. Hacé click para ver en tamaño completo.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-5">
            {FOTOS.map((src, i) => (
              <a
                key={src}
                href={src}
                target="_blank"
                rel="noreferrer"
                className="block aspect-square rounded-xl overflow-hidden border border-line bg-paper-2 hover:border-navy-2 hover:shadow-lg transition"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Acción ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </section>

        {/* VIDEOS */}
        <section>
          <div className="text-xs font-bold tracking-widest uppercase text-muted">
            Registro audiovisual
          </div>
          <h2 className="text-2xl font-extrabold text-navy mt-1">
            Videos · {VIDEOS.length}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            {VIDEOS.map((src) => (
              <video
                key={src}
                controls
                preload="metadata"
                className="w-full rounded-xl border border-line bg-black aspect-video"
              >
                <source src={src} type="video/mp4" />
                Tu navegador no soporta video HTML5.
              </video>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
