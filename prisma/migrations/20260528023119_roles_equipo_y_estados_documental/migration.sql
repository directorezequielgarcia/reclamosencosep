-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EstadoDocumento" ADD VALUE 'ANALIZADO';
ALTER TYPE "EstadoDocumento" ADD VALUE 'INCOMPLETO';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Rol" ADD VALUE 'DIRECTOR';
ALTER TYPE "Rol" ADD VALUE 'COOPERATIVA_DOCS';
ALTER TYPE "Rol" ADD VALUE 'EXPEDIENTES';
ALTER TYPE "Rol" ADD VALUE 'INSPECCIONES';
ALTER TYPE "Rol" ADD VALUE 'AUDIENCIAS_MEDIOS';
