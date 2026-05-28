-- CreateEnum
CREATE TYPE "EstadoInformeMensual" AS ENUM ('BORRADOR', 'PUBLICADO', 'ARCHIVADO');

-- CreateTable
CREATE TABLE "InformeMensual" (
    "id" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "estado" "EstadoInformeMensual" NOT NULL DEFAULT 'BORRADOR',
    "bloques" JSONB NOT NULL,
    "metricas" JSONB NOT NULL,
    "emitidoPorId" TEXT,
    "emitidoEn" TIMESTAMP(3),
    "docxUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InformeMensual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InformeMensual_estado_anio_mes_idx" ON "InformeMensual"("estado", "anio", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "InformeMensual_anio_mes_key" ON "InformeMensual"("anio", "mes");

-- AddForeignKey
ALTER TABLE "InformeMensual" ADD CONSTRAINT "InformeMensual_emitidoPorId_fkey" FOREIGN KEY ("emitidoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
