-- Revierte el módulo Fondo Fijo (pertenece a otro proyecto, no a ENCOSEP).
-- Las tablas están vacías (nunca se cargaron datos reales), así que no hay
-- pérdida de información.

-- DropTable
DROP TABLE "ComprobanteFondo";

-- DropTable
DROP TABLE "RendicionFondoFijo";

-- DropTable
DROP TABLE "FondoFijo";

-- DropEnum
DROP TYPE "EstadoRendicionFondo";

-- AlterEnum (sacar FONDO_FIJO_RESPONSABLE / FONDO_FIJO_CONTROL de Rol)
BEGIN;
CREATE TYPE "Rol_new" AS ENUM ('CIUDADANO', 'GESTOR_ENTE', 'OPERADOR_PRESTADORA', 'SUPER_ADMIN', 'AUDITOR', 'DIRECTOR', 'COOPERATIVA_DOCS', 'EXPEDIENTES', 'INSPECCIONES', 'AUDIENCIAS_MEDIOS', 'PEM', 'CONCEJO_DELIBERANTE', 'AUTORIDAD_APLICACION');
ALTER TABLE "Usuario" ALTER COLUMN "rol" DROP DEFAULT;
ALTER TABLE "Usuario" ALTER COLUMN "rol" TYPE "Rol_new" USING ("rol"::text::"Rol_new");
ALTER TYPE "Rol" RENAME TO "Rol_old";
ALTER TYPE "Rol_new" RENAME TO "Rol";
DROP TYPE "Rol_old";
ALTER TABLE "Usuario" ALTER COLUMN "rol" SET DEFAULT 'CIUDADANO';
COMMIT;
