-- CreateEnum
CREATE TYPE "TipoInspeccion" AS ENUM ('OFICIO', 'DENUNCIA_VECINO', 'SEGUIMIENTO_EXPEDIENTE', 'EVENTO_PUNTUAL');

-- CreateEnum
CREATE TYPE "EstadoInspeccion" AS ENUM ('BORRADOR', 'PUBLICADA', 'ARCHIVADA');

-- CreateTable
CREATE TABLE "Inspeccion" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "prestadoraId" TEXT,
    "tipo" "TipoInspeccion" NOT NULL DEFAULT 'OFICIO',
    "estado" "EstadoInspeccion" NOT NULL DEFAULT 'BORRADOR',
    "titulo" TEXT NOT NULL,
    "observaciones" TEXT NOT NULL,
    "direccion" TEXT,
    "barrio" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "audioUrl" TEXT,
    "audioMimeType" TEXT,
    "audioBytes" INTEGER,
    "audioDuracionSeg" INTEGER,
    "transcripcionAudio" TEXT,
    "expedienteId" TEXT,
    "actaUrl" TEXT,
    "actaGeneradaEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inspeccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspeccionFoto" (
    "id" TEXT NOT NULL,
    "inspeccionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "descripcion" TEXT,
    "mimeType" TEXT,
    "bytes" INTEGER,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspeccionFoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_InspeccionReclamos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InspeccionReclamos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Inspeccion_codigo_key" ON "Inspeccion"("codigo");

-- CreateIndex
CREATE INDEX "Inspeccion_servicioId_estado_idx" ON "Inspeccion"("servicioId", "estado");

-- CreateIndex
CREATE INDEX "Inspeccion_inspectorId_fecha_idx" ON "Inspeccion"("inspectorId", "fecha");

-- CreateIndex
CREATE INDEX "Inspeccion_estado_fecha_idx" ON "Inspeccion"("estado", "fecha");

-- CreateIndex
CREATE INDEX "Inspeccion_expedienteId_idx" ON "Inspeccion"("expedienteId");

-- CreateIndex
CREATE INDEX "InspeccionFoto_inspeccionId_orden_idx" ON "InspeccionFoto"("inspeccionId", "orden");

-- CreateIndex
CREATE INDEX "_InspeccionReclamos_B_index" ON "_InspeccionReclamos"("B");

-- AddForeignKey
ALTER TABLE "Inspeccion" ADD CONSTRAINT "Inspeccion_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspeccion" ADD CONSTRAINT "Inspeccion_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspeccion" ADD CONSTRAINT "Inspeccion_prestadoraId_fkey" FOREIGN KEY ("prestadoraId") REFERENCES "Prestadora"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspeccion" ADD CONSTRAINT "Inspeccion_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "Expediente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspeccionFoto" ADD CONSTRAINT "InspeccionFoto_inspeccionId_fkey" FOREIGN KEY ("inspeccionId") REFERENCES "Inspeccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InspeccionReclamos" ADD CONSTRAINT "_InspeccionReclamos_A_fkey" FOREIGN KEY ("A") REFERENCES "Inspeccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InspeccionReclamos" ADD CONSTRAINT "_InspeccionReclamos_B_fkey" FOREIGN KEY ("B") REFERENCES "Reclamo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
