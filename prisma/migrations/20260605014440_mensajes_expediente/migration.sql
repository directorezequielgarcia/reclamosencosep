-- CreateEnum
CREATE TYPE "CanalMensaje" AS ENUM ('USUARIO', 'PRESTADORA');

-- CreateTable
CREATE TABLE "MensajeExpediente" (
    "id" TEXT NOT NULL,
    "expedienteId" TEXT NOT NULL,
    "canal" "CanalMensaje" NOT NULL,
    "autorId" TEXT NOT NULL,
    "autorNombre" TEXT NOT NULL,
    "esEnte" BOOLEAN NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensajeExpediente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MensajeExpediente_expedienteId_canal_createdAt_idx" ON "MensajeExpediente"("expedienteId", "canal", "createdAt");

-- AddForeignKey
ALTER TABLE "MensajeExpediente" ADD CONSTRAINT "MensajeExpediente_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "Expediente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
