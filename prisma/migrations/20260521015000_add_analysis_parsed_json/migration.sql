-- AlterTable
ALTER TABLE "AnalysisResult" ADD COLUMN IF NOT EXISTS "parsedJson" JSONB;
