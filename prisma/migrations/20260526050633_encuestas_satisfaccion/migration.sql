-- AlterTable
ALTER TABLE "Reclamo" ADD COLUMN     "comentarioEncuesta" TEXT,
ADD COLUMN     "encuestaEn" TIMESTAMP(3),
ADD COLUMN     "puntajeEnte" INTEGER,
ADD COLUMN     "puntajePrestadora" INTEGER;

-- CreateTable
CREATE TABLE "EncuestaServicios" (
    "id" TEXT NOT NULL,
    "puntajeAgua" INTEGER,
    "puntajeEnergia" INTEGER,
    "puntajeResiduos" INTEGER,
    "puntajeTransporte" INTEGER,
    "comentario" TEXT,
    "barrio" TEXT,
    "dniHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EncuestaServicios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EncuestaServicios_createdAt_idx" ON "EncuestaServicios"("createdAt");
