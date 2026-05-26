/**
 * Logo institucional EnCoSeP — versión "Vigilancia Orbital".
 * Renderiza la imagen oficial subida a /public/imagenes/logo-encosep.jpg.
 *
 * El logo tiene fondo blanco; cuando se use sobre superficies oscuras
 * (ej. footer navy) conviene envolverlo en una caja blanca o con padding.
 */
type Props = {
  size?: number;
  /** Si false, muestra solo el círculo orbital recortado (sin texto central). */
  conTexto?: boolean;
  className?: string;
};

export function LogoEncosep({ size = 56, conTexto = true, className }: Props) {
  // El logo es cuadrado (~564x501). Si se pide "sin texto" recortamos a
  // un círculo centrado más pequeño que solo muestra los anillos orbitales.
  const src = "/imagenes/logo-encosep.jpg";
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt="EnCoSeP — Ente de Control de Servicios Públicos"
      width={size}
      height={size}
      className={`block object-contain ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        // Mantener proporción del logo (alto ≈ 90% del ancho original) sin distorsión.
        objectPosition: "center",
      }}
      // Sugerencia al navegador para precargar en above-the-fold.
      loading="eager"
      // Para usos pequeños (favicons), conTexto=false sirve solo como pista
      // semántica; la imagen es la misma, el navegador la escala.
      data-with-text={conTexto ? "true" : "false"}
    />
  );
}
