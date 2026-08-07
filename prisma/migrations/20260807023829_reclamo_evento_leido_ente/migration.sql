-- AlterTable
ALTER TABLE "ReclamoEvento" ADD COLUMN     "leidoEnte" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "ReclamoEvento_reclamoId_leidoEnte_idx" ON "ReclamoEvento"("reclamoId", "leidoEnte");
