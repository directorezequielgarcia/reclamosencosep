"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es-AR">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "4rem 1.5rem",
          background: "#ffffff",
          color: "#1d3550",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>
          Estamos con un inconveniente técnico
        </h1>
        <p style={{ maxWidth: 420, color: "#5b6f8a", marginBottom: "2rem" }}>
          El sitio del ENCOSEP no está respondiendo en este momento. Ya
          estamos al tanto — probá recargar en unos minutos.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: 999,
            background: "#1d3550",
            color: "#ffffff",
            fontSize: "0.875rem",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
