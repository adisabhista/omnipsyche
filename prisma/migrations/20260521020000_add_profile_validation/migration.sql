-- CreateTable
CREATE TABLE "ProfileValidation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT,
    "analysisId" TEXT,
    "result" JSONB NOT NULL,
    "score" INTEGER,
    "risk" TEXT,
    "confidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileValidation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileValidation_userId_idx" ON "ProfileValidation"("userId");

-- CreateIndex
CREATE INDEX "ProfileValidation_profileId_idx" ON "ProfileValidation"("profileId");

-- CreateIndex
CREATE INDEX "ProfileValidation_analysisId_idx" ON "ProfileValidation"("analysisId");

-- AddForeignKey
ALTER TABLE "ProfileValidation" ADD CONSTRAINT "ProfileValidation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileValidation" ADD CONSTRAINT "ProfileValidation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileValidation" ADD CONSTRAINT "ProfileValidation_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "AnalysisResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;
