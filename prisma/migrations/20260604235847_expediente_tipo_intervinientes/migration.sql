-- AlterTable
ALTER TABLE "Expediente" ADD COLUMN     "intervinientes" TEXT,
ADD COLUMN     "tipoExpediente" TEXT NOT NULL DEFAULT 'Reclamo individual';
