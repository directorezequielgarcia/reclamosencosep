-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "prestadoraId" TEXT,
    "expediente" TEXT,
    "auditorResponsable" TEXT,
    "tipoAuditoria" TEXT,
    "periodoAuditado" TEXT,
    "fechaInforme" TIMESTAMP(3),
    "resumen" TEXT,
    "queEsAuditoria" TEXT,
    "procedimientos" TEXT,
    "alcance" TEXT,
    "hallazgos" TEXT,
    "conclusiones" TEXT,
    "razonabilidad" TEXT,
    "recomendaciones" TEXT,
    "opinionEncosep" TEXT,
    "archivoUrl" TEXT,
    "fotoUrl" TEXT,
    "fechaPublicacion" TIMESTAMP(3),
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "autorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Auditoria_publicado_fechaPublicacion_idx" ON "Auditoria"("publicado", "fechaPublicacion");

-- CreateIndex
CREATE INDEX "Auditoria_prestadoraId_idx" ON "Auditoria"("prestadoraId");

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_prestadoraId_fkey" FOREIGN KEY ("prestadoraId") REFERENCES "Prestadora"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
