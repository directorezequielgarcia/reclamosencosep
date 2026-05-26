-- CreateEnum
CREATE TYPE "TipoBoletin" AS ENUM ('BOLETIN_OFICIAL', 'COMUNICADO', 'NOTA_PRENSA', 'CLIPPING');

-- CreateEnum
CREATE TYPE "ModalidadAudiencia" AS ENUM ('PRESENCIAL', 'VIRTUAL', 'HIBRIDA');

-- CreateEnum
CREATE TYPE "EstadoAudiencia" AS ENUM ('PROGRAMADA', 'ABIERTA_INSCRIPCION', 'CERRADA_INSCRIPCION', 'REALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoVencimiento" AS ENUM ('PENDIENTE', 'CUMPLIDO', 'VENCIDO', 'PRORROGADO', 'EXCEPTUADO');

-- AlterTable
ALTER TABLE "Reclamo" ADD COLUMN     "copiaExpedienteEn" TIMESTAMP(3),
ADD COLUMN     "copiaExpedienteSolicitada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recursoDirecto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recursoDirectoEn" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Boletin" (
    "id" TEXT NOT NULL,
    "tipo" "TipoBoletin" NOT NULL,
    "numero" TEXT,
    "titulo" TEXT NOT NULL,
    "resumen" TEXT,
    "cuerpo" TEXT,
    "archivoUrl" TEXT,
    "enlaceExterno" TEXT,
    "fuente" TEXT,
    "fechaPublicacion" TIMESTAMP(3) NOT NULL,
    "publicado" BOOLEAN NOT NULL DEFAULT true,
    "autorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Boletin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudienciaPublica" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "lugar" TEXT,
    "enlaceVirtual" TEXT,
    "modalidad" "ModalidadAudiencia" NOT NULL,
    "estado" "EstadoAudiencia" NOT NULL DEFAULT 'PROGRAMADA',
    "capacidad" INTEGER,
    "autorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AudienciaPublica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InscripcionAudiencia" (
    "id" TEXT NOT NULL,
    "audienciaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InscripcionAudiencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vencimiento" (
    "id" TEXT NOT NULL,
    "prestadoraId" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "periodo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "fechaLimite" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoVencimiento" NOT NULL DEFAULT 'PENDIENTE',
    "observacion" TEXT,
    "documentoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vencimiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Boletin_tipo_fechaPublicacion_idx" ON "Boletin"("tipo", "fechaPublicacion");

-- CreateIndex
CREATE INDEX "Boletin_publicado_fechaPublicacion_idx" ON "Boletin"("publicado", "fechaPublicacion");

-- CreateIndex
CREATE INDEX "AudienciaPublica_estado_fecha_idx" ON "AudienciaPublica"("estado", "fecha");

-- CreateIndex
CREATE INDEX "InscripcionAudiencia_audienciaId_idx" ON "InscripcionAudiencia"("audienciaId");

-- CreateIndex
CREATE UNIQUE INDEX "InscripcionAudiencia_audienciaId_dni_key" ON "InscripcionAudiencia"("audienciaId", "dni");

-- CreateIndex
CREATE INDEX "Vencimiento_prestadoraId_estado_idx" ON "Vencimiento"("prestadoraId", "estado");

-- CreateIndex
CREATE INDEX "Vencimiento_estado_fechaLimite_idx" ON "Vencimiento"("estado", "fechaLimite");

-- AddForeignKey
ALTER TABLE "Boletin" ADD CONSTRAINT "Boletin_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudienciaPublica" ADD CONSTRAINT "AudienciaPublica_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscripcionAudiencia" ADD CONSTRAINT "InscripcionAudiencia_audienciaId_fkey" FOREIGN KEY ("audienciaId") REFERENCES "AudienciaPublica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vencimiento" ADD CONSTRAINT "Vencimiento_prestadoraId_fkey" FOREIGN KEY ("prestadoraId") REFERENCES "Prestadora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
