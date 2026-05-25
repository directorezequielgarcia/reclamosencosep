import { PrismaClient } from "@prisma/client";

// Singleton de PrismaClient: en dev Next.js recarga módulos y crea
// múltiples instancias que agotan el pool de conexiones.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
