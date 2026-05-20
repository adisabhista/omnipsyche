-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "themeMode" TEXT NOT NULL DEFAULT 'system',
    "displayName" TEXT,
    "birthYear" INTEGER,
    "ageRange" TEXT,
    "gender" TEXT,
    "location" TEXT,
    "shortBio" TEXT,
    "educationLevel" TEXT,
    "fieldOfStudy" TEXT,
    "institution" TEXT,
    "graduationStatus" TEXT,
    "learningGoals" JSONB,
    "currentStatus" TEXT,
    "currentRole" TEXT,
    "targetCareer" TEXT,
    "careerInterests" JSONB,
    "preferredWorkStyle" TEXT,
    "hobbies" JSONB,
    "interests" JSONB,
    "favoriteTopics" JSONB,
    "favoriteBookGenres" JSONB,
    "skillsToImprove" JSONB,
    "dislikedTopics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
