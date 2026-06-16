-- CreateEnum
CREATE TYPE "CuadroEstado" AS ENUM ('VIGENTE', 'ANTERIOR', 'PEDIDO', 'BORRADOR');

-- AlterTable
ALTER TABLE "Documento" ADD COLUMN     "conclusionGeneral" TEXT,
ADD COLUMN     "montoMaximo" TEXT,
ADD COLUMN     "notaDocxUrl" TEXT,
ADD COLUMN     "notaEmitidaEn" TIMESTAMP(3),
ADD COLUMN     "notaNumero" TEXT,
ADD COLUMN     "observaciones" JSONB;

-- CreateTable
CREATE TABLE "CuadroTarifario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "expediente" TEXT,
    "estado" "CuadroEstado" NOT NULL DEFAULT 'BORRADOR',
    "vigenteDesde" TIMESTAMP(3),
    "fuente" TEXT,
    "pdfUrl" TEXT,
    "datos" JSONB NOT NULL,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "creadoPorId" TEXT,
    "creadoPorNombre" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CuadroTarifario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CuadroTarifario_publicado_estado_idx" ON "CuadroTarifario"("publicado", "estado");
