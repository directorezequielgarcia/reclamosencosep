import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse usa APIs de Node y no debe bundlearse en el server build.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
