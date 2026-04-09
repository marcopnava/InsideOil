-- AlterTable
ALTER TABLE "users" ADD COLUMN "registrationToken" TEXT;
ALTER TABLE "users" ADD COLUMN "tokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_registrationToken_key" ON "users"("registrationToken");
