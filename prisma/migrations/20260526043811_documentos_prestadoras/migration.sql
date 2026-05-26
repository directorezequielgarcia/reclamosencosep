-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('ANUAL', 'MENSUAL', 'CERTIFICACION', 'CONTRATO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoDocumento" AS ENUM ('PENDIENTE', 'EN_REVISION', 'APROBADO', 'OBSERVADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "prestadoraId" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "periodo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "archivoUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "bytes" INTEGER,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'PENDIENTE',
    "comentarioRevision" TEXT,
    "subidoPorId" TEXT NOT NULL,
    "revisorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revisadoEn" TIMESTAMP(3),

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Documento_prestadoraId_estado_idx" ON "Documento"("prestadoraId", "estado");

-- CreateIndex
CREATE INDEX "Documento_tipo_periodo_idx" ON "Documento"("tipo", "periodo");

-- CreateIndex
CREATE INDEX "Documento_estado_idx" ON "Documento"("estado");

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_prestadoraId_fkey" FOREIGN KEY ("prestadoraId") REFERENCES "Prestadora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_revisorId_fkey" FOREIGN KEY ("revisorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
