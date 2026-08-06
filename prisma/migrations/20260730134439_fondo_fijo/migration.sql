-- CreateEnum
CREATE TYPE "EstadoRendicionFondo" AS ENUM ('BORRADOR', 'PRESENTADA', 'APROBADA', 'OBSERVADA');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Rol" ADD VALUE 'FONDO_FIJO_RESPONSABLE';
ALTER TYPE "Rol" ADD VALUE 'FONDO_FIJO_CONTROL';

-- CreateTable
CREATE TABLE "FondoFijo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL DEFAULT 'Fondo Fijo Caja Chica',
    "montoAsignado" DOUBLE PRECISION NOT NULL,
    "responsableId" TEXT NOT NULL,
    "controladorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FondoFijo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RendicionFondoFijo" (
    "id" TEXT NOT NULL,
    "fondoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "periodo" TEXT NOT NULL,
    "estado" "EstadoRendicionFondo" NOT NULL DEFAULT 'BORRADOR',
    "presentadaPorId" TEXT,
    "presentadaEn" TIMESTAMP(3),
    "controladaPorId" TEXT,
    "controladaEn" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RendicionFondoFijo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComprobanteFondo" (
    "id" TEXT NOT NULL,
    "rendicionId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "fecha" TIMESTAMP(3) NOT NULL,
    "quienRealizoGasto" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "tipoFactura" TEXT NOT NULL,
    "numeroComprobante" TEXT NOT NULL,
    "neto" DOUBLE PRECISION NOT NULL,
    "iva" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percepcionIva" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percepcionIibb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otrosImpuestos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "archivoUrl" TEXT,
    "archivoMimeType" TEXT,
    "textoOcr" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComprobanteFondo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RendicionFondoFijo_fondoId_estado_idx" ON "RendicionFondoFijo"("fondoId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "RendicionFondoFijo_fondoId_numero_key" ON "RendicionFondoFijo"("fondoId", "numero");

-- CreateIndex
CREATE INDEX "ComprobanteFondo_rendicionId_orden_idx" ON "ComprobanteFondo"("rendicionId", "orden");

-- AddForeignKey
ALTER TABLE "FondoFijo" ADD CONSTRAINT "FondoFijo_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FondoFijo" ADD CONSTRAINT "FondoFijo_controladorId_fkey" FOREIGN KEY ("controladorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendicionFondoFijo" ADD CONSTRAINT "RendicionFondoFijo_fondoId_fkey" FOREIGN KEY ("fondoId") REFERENCES "FondoFijo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendicionFondoFijo" ADD CONSTRAINT "RendicionFondoFijo_presentadaPorId_fkey" FOREIGN KEY ("presentadaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendicionFondoFijo" ADD CONSTRAINT "RendicionFondoFijo_controladaPorId_fkey" FOREIGN KEY ("controladaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComprobanteFondo" ADD CONSTRAINT "ComprobanteFondo_rendicionId_fkey" FOREIGN KEY ("rendicionId") REFERENCES "RendicionFondoFijo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
