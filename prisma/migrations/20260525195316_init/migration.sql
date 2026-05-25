-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dni" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "passwordHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'CIUDADANO',
    "prestadoraId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Usuario_prestadoraId_fkey" FOREIGN KEY ("prestadoraId") REFERENCES "Prestadora" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreCorto" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Prestadora" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "razonSocial" TEXT NOT NULL,
    "cuit" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Reclamo" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "cerradoEn" DATETIME,
    CONSTRAINT "Reclamo_ciudadanoId_fkey" FOREIGN KEY ("ciudadanoId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reclamo_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reclamo_prestadoraId_fkey" FOREIGN KEY ("prestadoraId") REFERENCES "Prestadora" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reclamo_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReclamoEvento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reclamoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estadoNuevo" TEXT,
    "autorId" TEXT,
    "mensaje" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReclamoEvento_reclamoId_fkey" FOREIGN KEY ("reclamoId") REFERENCES "Reclamo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReclamoEvento_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Adjunto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reclamoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "bytes" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Adjunto_reclamoId_fkey" FOREIGN KEY ("reclamoId") REFERENCES "Reclamo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PrestadoraToServicio" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PrestadoraToServicio_A_fkey" FOREIGN KEY ("A") REFERENCES "Prestadora" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PrestadoraToServicio_B_fkey" FOREIGN KEY ("B") REFERENCES "Servicio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_dni_key" ON "Usuario"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Servicio_kind_key" ON "Servicio"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "Prestadora_cuit_key" ON "Prestadora"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "Reclamo_codigo_key" ON "Reclamo"("codigo");

-- CreateIndex
CREATE INDEX "Reclamo_estado_servicioId_idx" ON "Reclamo"("estado", "servicioId");

-- CreateIndex
CREATE INDEX "Reclamo_ciudadanoId_idx" ON "Reclamo"("ciudadanoId");

-- CreateIndex
CREATE INDEX "Reclamo_prestadoraId_estado_idx" ON "Reclamo"("prestadoraId", "estado");

-- CreateIndex
CREATE INDEX "ReclamoEvento_reclamoId_createdAt_idx" ON "ReclamoEvento"("reclamoId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_PrestadoraToServicio_AB_unique" ON "_PrestadoraToServicio"("A", "B");

-- CreateIndex
CREATE INDEX "_PrestadoraToServicio_B_index" ON "_PrestadoraToServicio"("B");
