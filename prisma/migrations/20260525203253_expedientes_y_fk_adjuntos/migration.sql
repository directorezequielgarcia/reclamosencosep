-- CreateTable
CREATE TABLE "Expediente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "caratula" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "prestadoraId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    "iniciadorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "cerradoEn" DATETIME,
    CONSTRAINT "Expediente_prestadoraId_fkey" FOREIGN KEY ("prestadoraId") REFERENCES "Prestadora" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Expediente_iniciadorId_fkey" FOREIGN KEY ("iniciadorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActoAdministrativo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expedienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActoAdministrativo_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "Expediente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActoAdministrativo_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reclamo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "ciudadanoId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "prestadoraId" TEXT,
    "asignadoAId" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "respuestas" TEXT,
    "direccion" TEXT NOT NULL,
    "barrio" TEXT,
    "lat" REAL,
    "lng" REAL,
    "estado" TEXT NOT NULL DEFAULT 'RECIBIDO',
    "slaHoras" INTEGER NOT NULL DEFAULT 72,
    "slaDeadline" DATETIME,
    "expedienteId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "cerradoEn" DATETIME,
    CONSTRAINT "Reclamo_ciudadanoId_fkey" FOREIGN KEY ("ciudadanoId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reclamo_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reclamo_prestadoraId_fkey" FOREIGN KEY ("prestadoraId") REFERENCES "Prestadora" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reclamo_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reclamo_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "Expediente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Reclamo" ("asignadoAId", "barrio", "cerradoEn", "ciudadanoId", "codigo", "createdAt", "descripcion", "direccion", "estado", "id", "lat", "lng", "prestadoraId", "respuestas", "servicioId", "slaDeadline", "slaHoras", "titulo", "updatedAt") SELECT "asignadoAId", "barrio", "cerradoEn", "ciudadanoId", "codigo", "createdAt", "descripcion", "direccion", "estado", "id", "lat", "lng", "prestadoraId", "respuestas", "servicioId", "slaDeadline", "slaHoras", "titulo", "updatedAt" FROM "Reclamo";
DROP TABLE "Reclamo";
ALTER TABLE "new_Reclamo" RENAME TO "Reclamo";
CREATE UNIQUE INDEX "Reclamo_codigo_key" ON "Reclamo"("codigo");
CREATE INDEX "Reclamo_estado_servicioId_idx" ON "Reclamo"("estado", "servicioId");
CREATE INDEX "Reclamo_ciudadanoId_idx" ON "Reclamo"("ciudadanoId");
CREATE INDEX "Reclamo_prestadoraId_estado_idx" ON "Reclamo"("prestadoraId", "estado");
CREATE INDEX "Reclamo_expedienteId_idx" ON "Reclamo"("expedienteId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Expediente_numero_key" ON "Expediente"("numero");

-- CreateIndex
CREATE INDEX "Expediente_prestadoraId_estado_idx" ON "Expediente"("prestadoraId", "estado");

-- CreateIndex
CREATE INDEX "Expediente_estado_idx" ON "Expediente"("estado");

-- CreateIndex
CREATE INDEX "ActoAdministrativo_expedienteId_createdAt_idx" ON "ActoAdministrativo"("expedienteId", "createdAt");
