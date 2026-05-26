-- AlterTable
ALTER TABLE "AudienciaPublica" ADD COLUMN     "actaTexto" TEXT,
ADD COLUMN     "actaUrl" TEXT,
ADD COLUMN     "convocatoriaPublicadaEn" TIMESTAMP(3),
ADD COLUMN     "convocatoriaTexto" TEXT,
ADD COLUMN     "expedienteNumero" TEXT,
ADD COLUMN     "expedienteTitulo" TEXT,
ADD COLUMN     "expedienteUrl" TEXT,
ADD COLUMN     "inscripcionCierra" TIMESTAMP(3),
ADD COLUMN     "ordenDiaUrl" TEXT,
ADD COLUMN     "realizadaEn" TIMESTAMP(3);
