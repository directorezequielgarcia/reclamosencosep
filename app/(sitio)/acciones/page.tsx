import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { Galeria } from "@/components/ui/Galeria";
import { MigajasSitio, VolverInicio } from "@/components/ui/MigajasSitio";

export const metadata = { title: "Acciones del Ente · ENCOSEP" };

const TIPOS_ACCION = [
  {
    icon: "🤝",
    titulo: "Mesas de trabajo",
    descripcion:
      "Reuniones de coordinación con las prestadoras (SCPL, Clear Urbana, Patagonia, Diadema) y con las autoridades de aplicación. Anticipamos crisis y trabajamos sobre conflictos puntuales del servicio.",
  },
  {
    icon: "🏛️",
    titulo: "Asistencia institucional",
    descripcion:
      "Acompañamos al Poder Ejecutivo Municipal, sus Secretarías y al Concejo Deliberante con información técnica para la toma de decisiones sobre los servicios públicos.",
  },
  {
    icon: "🔍",
    titulo: "Inspecciones y constataciones",
    descripcion:
      "Verificación en terreno del cumplimiento de pliegos y reglamentos por parte de las prestadoras, con actas de constatación. Inspecciones programadas y sorpresivas.",
  },
  {
    icon: "📨",
    titulo: "Atención de reclamos y expedientes",
    descripcion:
      "Recibimos y gestionamos los reclamos de los vecinos y, cuando corresponde, los escalamos a expedientes administrativos para su impulso formal.",
  },
  {
    icon: "📑",
    titulo: "Control documentario y auditorías",
    descripcion:
      "Control de la documentación que deben presentar las prestadoras y participación en auditorías para verificar el cumplimiento de sus obligaciones.",
  },
  {
    icon: "📊",
    titulo: "Propuestas de mejora e informes",
    descripcion:
      "Proponemos acciones de mejora y elaboramos informes técnicos para acompañar las decisiones administrativas y legislativas vinculadas a los servicios.",
  },
  {
    icon: "📣",
    titulo: "Convocatoria a audiencias públicas",
    descripcion:
      "Convocamos y presidimos audiencias públicas como instancia de participación de los usuarios en las cuestiones que afectan a los servicios públicos.",
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
        <MigajasSitio items={[{ label: "Acciones" }]} />
        {/* TIPOS DE ACCION */}
        <section>
          <div className="text-xs font-bold tracking-widest uppercase text-muted">
            Líneas de acción
          </div>
          <h2 className="text-2xl font-extrabold text-navy mt-1">
            Lo que hace el Ente, en concreto
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
            barriales. Hacé click para verlas a pantalla completa con
            navegación de galería.
          </p>
          <div className="mt-5">
            <Galeria
              fotos={FOTOS.map((src, i) => ({
                id: src,
                url: src,
                descripcion: `Acción ${i + 1}`,
              }))}
              titulo="Acciones del Ente"
            />
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

        <VolverInicio />
      </main>
    </>
  );
}
