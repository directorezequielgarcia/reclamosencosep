-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "passwordResetToken" TEXT;
ALTER TABLE "Usuario" ADD COLUMN "passwordResetExpires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_passwordResetToken_key" ON "Usuario"("passwordResetToken");
