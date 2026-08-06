-- CreateTable
CREATE TABLE "Visita" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visita_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Visita_createdAt_idx" ON "Visita"("createdAt");

-- CreateIndex
CREATE INDEX "Visita_ipHash_createdAt_idx" ON "Visita"("ipHash", "createdAt");
