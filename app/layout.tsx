import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal de Reclamos · ENCOSEP",
  description:
    "Ente de Control de Servicios Públicos de Comodoro Rivadavia — registro y seguimiento de reclamos ciudadanos.",
  applicationName: "ENCOSEP Reclamos",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#1d3550",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-paper text-navy">
        {children}
      </body>
    </html>
  );
}
