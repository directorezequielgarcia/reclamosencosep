import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Tipografía neo-grotesque alineada al estilo del logo institucional EnCoSeP
// (la fuente del nombre "EnCoSeP" en el logo es una neo-grotesque pesada;
// Inter es la opción libre más cercana en proporciones y peso).
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sans-display",
});

export const metadata: Metadata = {
  title: "EnCoSeP · Ente de Control de Servicios Públicos · Comodoro Rivadavia",
  description:
    "Ente de Control de Servicios Públicos de Comodoro Rivadavia — control y fiscalización de residuos, electricidad, agua y transporte.",
  applicationName: "EnCoSeP",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#1d3550",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-paper text-navy font-sans-display">
        {children}
      </body>
    </html>
  );
}
