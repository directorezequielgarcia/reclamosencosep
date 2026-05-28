-- AlterTable
ALTER TABLE "Reclamo" ADD COLUMN     "inspeccionOrigenId" TEXT,
ADD COLUMN     "origenOficio" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Reclamo" ADD CONSTRAINT "Reclamo_inspeccionOrigenId_fkey" FOREIGN KEY ("inspeccionOrigenId") REFERENCES "Inspeccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
