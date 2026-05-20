-- AlterTable
ALTER TABLE "BookInsight" ADD COLUMN "analysisId" TEXT;

-- CreateIndex
CREATE INDEX "BookInsight_analysisId_idx" ON "BookInsight"("analysisId");

-- AddForeignKey
ALTER TABLE "BookInsight" ADD CONSTRAINT "BookInsight_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "AnalysisResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

