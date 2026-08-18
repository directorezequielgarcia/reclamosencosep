-- CreateEnum
CREATE TYPE "FormulaTransporteEstado" AS ENUM ('BORRADOR', 'CERTIFICADO', 'PUBLICADO');

-- CreateTable
CREATE TABLE "FormulaTransporte" (
    "id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "estado" "FormulaTransporteEstado" NOT NULL DEFAULT 'BORRADOR',
    "datos" JSONB NOT NULL,
    "fuente" TEXT,
    "creadoPorId" TEXT,
    "creadoPorNombre" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormulaTransporte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FormulaTransporte_periodo_key" ON "FormulaTransporte"("periodo");

-- CreateIndex
CREATE INDEX "FormulaTransporte_estado_idx" ON "FormulaTransporte"("estado");
