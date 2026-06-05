-- CreateEnum
CREATE TYPE "AudienciaCapacitacion" AS ENUM ('TODOS', 'TEAM_ENCOSEP', 'AUTORIDAD_APLICACION', 'CONCEJO_DELIBERANTE', 'PEM', 'PRESTADORAS');

-- CreateEnum
CREATE TYPE "TipoCapacitacion" AS ENUM ('VIDEO', 'IMAGEN', 'GUIA');

-- CreateTable
CREATE TABLE "Capacitacion" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "TipoCapacitacion" NOT NULL DEFAULT 'VIDEO',
    "url" TEXT,
    "contenido" TEXT,
    "modulo" TEXT,
    "audiencia" "AudienciaCapacitacion" NOT NULL DEFAULT 'TODOS',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Capacitacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Capacitacion_audiencia_orden_idx" ON "Capacitacion"("audiencia", "orden");
