-- CreateTable
CREATE TABLE "ArchivoBlob" (
    "id" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "contenido" BYTEA NOT NULL,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivoBlob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArchivoBlob_documentoId_tipo_key" ON "ArchivoBlob"("documentoId", "tipo");

-- AddForeignKey
ALTER TABLE "ArchivoBlob" ADD CONSTRAINT "ArchivoBlob_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "Documento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
