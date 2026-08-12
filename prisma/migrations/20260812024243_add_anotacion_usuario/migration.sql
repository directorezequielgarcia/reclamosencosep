-- CreateTable
CREATE TABLE "AnotacionUsuario" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnotacionUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnotacionUsuario_usuarioId_createdAt_idx" ON "AnotacionUsuario"("usuarioId", "createdAt");

-- AddForeignKey
ALTER TABLE "AnotacionUsuario" ADD CONSTRAINT "AnotacionUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnotacionUsuario" ADD CONSTRAINT "AnotacionUsuario_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
