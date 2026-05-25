-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('CIUDADANO', 'GESTOR_ENTE', 'OPERADOR_PRESTADORA', 'SUPER_ADMIN', 'AUDITOR');

-- CreateEnum
CREATE TYPE "ServicioKind" AS ENUM ('RESIDUOS', 'ENERGIA', 'AGUA', 'TRANSPORTE');

-- CreateEnum
CREATE TYPE "ReclamoEstado" AS ENUM ('RECIBIDO', 'EN_REVISION', 'DERIVADO', 'EN_PROCESO', 'RESUELTO', 'CERRADO_SIN_SOLUCION', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('CREACION', 'CAMBIO_ESTADO', 'ASIGNACION', 'COMENTARIO', 'ADJUNTO', 'NOTIFICACION');

-- CreateEnum
CREATE TYPE "ExpedienteEstado" AS ENUM ('ABIERTO', 'EN_TRAMITE', 'RESUELTO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "TipoActo" AS ENUM ('CARATULACION', 'NOTIFICACION', 'INTIMACION', 'DESCARGO_PRESTADORA', 'RESOLUCION', 'CIERRE', 'NOTA');

-- CreateEnum
CREATE TYPE "AdjuntoTipo" AS ENUM ('FOTO', 'AUDIO', 'DOCUMENTO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'CIUDADANO',
    "prestadoraId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" TEXT NOT NULL,
    "kind" "ServicioKind" NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreCorto" TEXT NOT NULL,

    CONSTRAINT "Servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prestadora" (
    "id" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "cuit" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prestadora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reclamo" (
    "id" TEXT NOT NULL,
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
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "estado" "ReclamoEstado" NOT NULL DEFAULT 'RECIBIDO',
    "slaHoras" INTEGER NOT NULL DEFAULT 72,
    "slaDeadline" TIMESTAMP(3),
    "expedienteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cerradoEn" TIMESTAMP(3),

    CONSTRAINT "Reclamo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expediente" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "caratula" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "prestadoraId" TEXT NOT NULL,
    "estado" "ExpedienteEstado" NOT NULL DEFAULT 'ABIERTO',
    "iniciadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cerradoEn" TIMESTAMP(3),

    CONSTRAINT "Expediente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActoAdministrativo" (
    "id" TEXT NOT NULL,
    "expedienteId" TEXT NOT NULL,
    "tipo" "TipoActo" NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActoAdministrativo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReclamoEvento" (
    "id" TEXT NOT NULL,
    "reclamoId" TEXT NOT NULL,
    "tipo" "TipoEvento" NOT NULL,
    "estadoNuevo" "ReclamoEstado",
    "autorId" TEXT,
    "mensaje" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReclamoEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adjunto" (
    "id" TEXT NOT NULL,
    "reclamoId" TEXT NOT NULL,
    "tipo" "AdjuntoTipo" NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "bytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Adjunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PrestadoraToServicio" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PrestadoraToServicio_AB_pkey" PRIMARY KEY ("A","B")
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
CREATE INDEX "Reclamo_expedienteId_idx" ON "Reclamo"("expedienteId");

-- CreateIndex
CREATE UNIQUE INDEX "Expediente_numero_key" ON "Expediente"("numero");

-- CreateIndex
CREATE INDEX "Expediente_prestadoraId_estado_idx" ON "Expediente"("prestadoraId", "estado");

-- CreateIndex
CREATE INDEX "Expediente_estado_idx" ON "Expediente"("estado");

-- CreateIndex
CREATE INDEX "ActoAdministrativo_expedienteId_createdAt_idx" ON "ActoAdministrativo"("expedienteId", "createdAt");

-- CreateIndex
CREATE INDEX "ReclamoEvento_reclamoId_createdAt_idx" ON "ReclamoEvento"("reclamoId", "createdAt");

-- CreateIndex
CREATE INDEX "_PrestadoraToServicio_B_index" ON "_PrestadoraToServicio"("B");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_prestadoraId_fkey" FOREIGN KEY ("prestadoraId") REFERENCES "Prestadora"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reclamo" ADD CONSTRAINT "Reclamo_ciudadanoId_fkey" FOREIGN KEY ("ciudadanoId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reclamo" ADD CONSTRAINT "Reclamo_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reclamo" ADD CONSTRAINT "Reclamo_prestadoraId_fkey" FOREIGN KEY ("prestadoraId") REFERENCES "Prestadora"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reclamo" ADD CONSTRAINT "Reclamo_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reclamo" ADD CONSTRAINT "Reclamo_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "Expediente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expediente" ADD CONSTRAINT "Expediente_prestadoraId_fkey" FOREIGN KEY ("prestadoraId") REFERENCES "Prestadora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expediente" ADD CONSTRAINT "Expediente_iniciadorId_fkey" FOREIGN KEY ("iniciadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActoAdministrativo" ADD CONSTRAINT "ActoAdministrativo_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "Expediente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActoAdministrativo" ADD CONSTRAINT "ActoAdministrativo_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReclamoEvento" ADD CONSTRAINT "ReclamoEvento_reclamoId_fkey" FOREIGN KEY ("reclamoId") REFERENCES "Reclamo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReclamoEvento" ADD CONSTRAINT "ReclamoEvento_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjunto" ADD CONSTRAINT "Adjunto_reclamoId_fkey" FOREIGN KEY ("reclamoId") REFERENCES "Reclamo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PrestadoraToServicio" ADD CONSTRAINT "_PrestadoraToServicio_A_fkey" FOREIGN KEY ("A") REFERENCES "Prestadora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PrestadoraToServicio" ADD CONSTRAINT "_PrestadoraToServicio_B_fkey" FOREIGN KEY ("B") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
