-- CreateEnum
CREATE TYPE "ReclamoOrigen" AS ENUM ('WEB', 'WHATSAPP');

-- AlterTable
ALTER TABLE "Reclamo" ADD COLUMN     "origen" "ReclamoOrigen" NOT NULL DEFAULT 'WEB';

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "whatsappId" TEXT;

-- CreateTable
CREATE TABLE "MensajeWhatsApp" (
    "id" TEXT NOT NULL,
    "waId" TEXT NOT NULL,
    "nombrePerfil" TEXT,
    "cuerpo" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "recibidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "procesado" BOOLEAN NOT NULL DEFAULT false,
    "reclamoId" TEXT,

    CONSTRAINT "MensajeWhatsApp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MensajeWhatsApp_messageId_key" ON "MensajeWhatsApp"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "MensajeWhatsApp_reclamoId_key" ON "MensajeWhatsApp"("reclamoId");

-- CreateIndex
CREATE INDEX "MensajeWhatsApp_waId_recibidoEn_idx" ON "MensajeWhatsApp"("waId", "recibidoEn");

-- CreateIndex
CREATE INDEX "MensajeWhatsApp_procesado_recibidoEn_idx" ON "MensajeWhatsApp"("procesado", "recibidoEn");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_whatsappId_key" ON "Usuario"("whatsappId");

-- AddForeignKey
ALTER TABLE "MensajeWhatsApp" ADD CONSTRAINT "MensajeWhatsApp_reclamoId_fkey" FOREIGN KEY ("reclamoId") REFERENCES "Reclamo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

