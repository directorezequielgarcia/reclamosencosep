-- AlterEnum
ALTER TYPE "AdjuntoTipo" ADD VALUE 'VIDEO';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoActo" ADD VALUE 'ACTA_RECEPCION';
ALTER TYPE "TipoActo" ADD VALUE 'CONSTATACION';
ALTER TYPE "TipoActo" ADD VALUE 'AMPLIACION';
ALTER TYPE "TipoActo" ADD VALUE 'DISPOSICION';

-- AlterTable
ALTER TABLE "ActoAdministrativo" ADD COLUMN     "notificadoA" TEXT,
ADD COLUMN     "notificadoEn" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ActoAdjunto" (
    "id" TEXT NOT NULL,
    "actoId" TEXT NOT NULL,
    "tipo" "AdjuntoTipo" NOT NULL,
    "url" TEXT NOT NULL,
    "nombre" TEXT,
    "mimeType" TEXT,
    "bytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActoAdjunto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActoAdjunto_actoId_idx" ON "ActoAdjunto"("actoId");

-- AddForeignKey
ALTER TABLE "ActoAdjunto" ADD CONSTRAINT "ActoAdjunto_actoId_fkey" FOREIGN KEY ("actoId") REFERENCES "ActoAdministrativo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
