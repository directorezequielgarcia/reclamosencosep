-- CreateTable
CREATE TABLE "AuditoriaDocumento" (
    "id" TEXT NOT NULL,
    "auditoriaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "bytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditoriaDocumento_auditoriaId_idx" ON "AuditoriaDocumento"("auditoriaId");

-- AddForeignKey
ALTER TABLE "AuditoriaDocumento" ADD CONSTRAINT "AuditoriaDocumento_auditoriaId_fkey" FOREIGN KEY ("auditoriaId") REFERENCES "Auditoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
