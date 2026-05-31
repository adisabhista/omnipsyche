-- CreateTable
CREATE TABLE "ExternalMbtiTest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'devil.ai',
    "testId" TEXT NOT NULL,
    "testUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "prediction" TEXT,
    "resultsPage" TEXT,
    "rawResult" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ExternalMbtiTest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalMbtiTest_provider_testId_key" ON "ExternalMbtiTest"("provider", "testId");

-- CreateIndex
CREATE INDEX "ExternalMbtiTest_userId_idx" ON "ExternalMbtiTest"("userId");

-- CreateIndex
CREATE INDEX "ExternalMbtiTest_createdAt_idx" ON "ExternalMbtiTest"("createdAt");

-- AddForeignKey
ALTER TABLE "ExternalMbtiTest" ADD CONSTRAINT "ExternalMbtiTest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
