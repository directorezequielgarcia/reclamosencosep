-- CreateEnum
CREATE TYPE "EstadoInformeAnual" AS ENUM ('BORRADOR', 'PUBLICADO', 'ARCHIVADO');

-- CreateTable
CREATE TABLE "InformeAnual" (
    "id" TEXT NOT NULL,
    "periodoDesde" TIMESTAMP(3) NOT NULL,
    "periodoHasta" TIMESTAMP(3) NOT NULL,
    "titulo" TEXT NOT NULL,
    "estado" "EstadoInformeAnual" NOT NULL DEFAULT 'BORRADOR',
    "bloques" JSONB NOT NULL,
    "metricas" JSONB NOT NULL,
    "emitidoPorId" TEXT,
    "emitidoEn" TIMESTAMP(3),
    "docxUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InformeAnual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InformeAnual_estado_periodoDesde_idx" ON "InformeAnual"("estado", "periodoDesde");

-- AddForeignKey
ALTER TABLE "InformeAnual" ADD CONSTRAINT "InformeAnual_emitidoPorId_fkey" FOREIGN KEY ("emitidoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
