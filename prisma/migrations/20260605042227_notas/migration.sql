-- CreateEnum
CREATE TYPE "NotaAmbito" AS ENUM ('AUTORIDAD_APLICACION', 'CONCEJO_DELIBERANTE', 'PEM', 'PRESTADORA', 'OTRO');

-- CreateEnum
CREATE TYPE "NotaEstado" AS ENUM ('BORRADOR', 'ENVIADA', 'RESPONDIDA', 'CERRADA');

-- CreateTable
CREATE TABLE "Nota" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "ambito" "NotaAmbito" NOT NULL,
    "destinatario" TEXT NOT NULL,
    "estado" "NotaEstado" NOT NULL DEFAULT 'BORRADOR',
    "creadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaMensaje" (
    "id" TEXT NOT NULL,
    "notaId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "autorNombre" TEXT NOT NULL,
    "delEnte" BOOLEAN NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotaMensaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaAdjunto" (
    "id" TEXT NOT NULL,
    "mensajeId" TEXT NOT NULL,
    "tipo" "AdjuntoTipo" NOT NULL,
    "url" TEXT NOT NULL,
    "nombre" TEXT,
    "mimeType" TEXT,
    "bytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotaAdjunto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Nota_numero_key" ON "Nota"("numero");

-- CreateIndex
CREATE INDEX "Nota_ambito_estado_idx" ON "Nota"("ambito", "estado");

-- CreateIndex
CREATE INDEX "Nota_estado_idx" ON "Nota"("estado");

-- CreateIndex
CREATE INDEX "NotaMensaje_notaId_createdAt_idx" ON "NotaMensaje"("notaId", "createdAt");

-- CreateIndex
CREATE INDEX "NotaAdjunto_mensajeId_idx" ON "NotaAdjunto"("mensajeId");

-- AddForeignKey
ALTER TABLE "NotaMensaje" ADD CONSTRAINT "NotaMensaje_notaId_fkey" FOREIGN KEY ("notaId") REFERENCES "Nota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaAdjunto" ADD CONSTRAINT "NotaAdjunto_mensajeId_fkey" FOREIGN KEY ("mensajeId") REFERENCES "NotaMensaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;
