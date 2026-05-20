-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "mbti" TEXT NOT NULL DEFAULT 'unknown',
    "enneagramType" TEXT NOT NULL DEFAULT 'unknown',
    "enneagramWing" TEXT NOT NULL DEFAULT 'unknown',
    "enneagramTritype" TEXT NOT NULL DEFAULT '',
    "attitudinalPsyche" TEXT NOT NULL DEFAULT 'unknown',
    "instinctualVariant" TEXT NOT NULL DEFAULT 'unknown',
    "socionics" TEXT NOT NULL DEFAULT 'unknown',
    "temperament" TEXT NOT NULL DEFAULT 'unknown',
    "riasec" TEXT NOT NULL DEFAULT '',
    "bigFive" JSONB,
    "rawProfile" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "profileId" TEXT NOT NULL,
    "markdown" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NarrativePrediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "profileId" TEXT,
    "inputText" TEXT NOT NULL,
    "prediction" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NarrativePrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerInsight" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookInsight" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "UserProfile_userId_idx" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_createdAt_idx" ON "UserProfile"("createdAt");

-- CreateIndex
CREATE INDEX "AnalysisResult_userId_idx" ON "AnalysisResult"("userId");

-- CreateIndex
CREATE INDEX "AnalysisResult_profileId_idx" ON "AnalysisResult"("profileId");

-- CreateIndex
CREATE INDEX "AnalysisResult_createdAt_idx" ON "AnalysisResult"("createdAt");

-- CreateIndex
CREATE INDEX "NarrativePrediction_userId_idx" ON "NarrativePrediction"("userId");

-- CreateIndex
CREATE INDEX "NarrativePrediction_profileId_idx" ON "NarrativePrediction"("profileId");

-- CreateIndex
CREATE INDEX "NarrativePrediction_createdAt_idx" ON "NarrativePrediction"("createdAt");

-- CreateIndex
CREATE INDEX "CareerInsight_profileId_idx" ON "CareerInsight"("profileId");

-- CreateIndex
CREATE INDEX "CareerInsight_createdAt_idx" ON "CareerInsight"("createdAt");

-- CreateIndex
CREATE INDEX "BookInsight_profileId_idx" ON "BookInsight"("profileId");

-- CreateIndex
CREATE INDEX "BookInsight_createdAt_idx" ON "BookInsight"("createdAt");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisResult" ADD CONSTRAINT "AnalysisResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisResult" ADD CONSTRAINT "AnalysisResult_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NarrativePrediction" ADD CONSTRAINT "NarrativePrediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NarrativePrediction" ADD CONSTRAINT "NarrativePrediction_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerInsight" ADD CONSTRAINT "CareerInsight_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookInsight" ADD CONSTRAINT "BookInsight_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
