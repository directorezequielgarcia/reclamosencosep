import { LogoEncosep } from "./LogoEncosep";
import { BrandStripe } from "./BrandStripe";

/**
 * Encabezado institucional de página interna.
 * Muestra kicker + título + descripción a la izquierda y el logo del EnCoSeP
 * grande a la derecha para reforzar la identidad institucional en cada sección.
 */
type Props = {
  kicker: string;
  titulo: string;
  descripcion?: string;
  /** Acento de color del banner — paper-2 por defecto. */
  variante?: "default" | "naranja";
};

export function SeccionHeader({
  kicker,
  titulo,
  descripcion,
  variante = "default",
}: Props) {
  const fondo =
    variante === "naranja"
      ? "bg-gradient-to-br from-svc-orange/15 via-paper to-paper-2"
      : "bg-gradient-to-br from-paper-2 via-paper to-paper-2";

  return (
    <section className={`border-b border-line ${fondo}`}>
      <div className="max-w-5xl mx-auto px-6 py-10 md:py-14 grid md:grid-cols-[1fr_auto] gap-6 md:gap-10 items-center">
        <div>
          <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-muted">
            {kicker}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-navy mt-2 leading-tight">
            {titulo}
          </h1>
          <BrandStripe className="mt-4 max-w-[220px]" />
          {descripcion && (
            <p className="text-base text-navy mt-4 leading-relaxed max-w-2xl">
              {descripcion}
            </p>
          )}
        </div>

        {/* Logo institucional grande a la derecha (solo desktop) */}
        <div className="hidden md:flex items-center justify-end">
          <div className="bg-white rounded-2xl p-3 shadow-lg shadow-navy/5 border border-line">
            <LogoEncosep size={160} />
          </div>
        </div>
      </div>
    </section>
  );
}
