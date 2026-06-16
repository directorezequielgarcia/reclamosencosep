import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse usa APIs de Node y no debe bundlearse en el server build.
  serverExternalPackages: ["pdf-parse"],
  experimental: {
    serverActions: {
      // Vercel Hobby limita payloads de funciones a ~4.5 MB.
      // Subimos el techo de Next.js (default 1 MB) a 4 MB para admitir PDFs de certificación.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
