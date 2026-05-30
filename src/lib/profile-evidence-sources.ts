import "server-only";

import { prisma } from "@/lib/prisma";
import { profileValidationSchema } from "@/lib/profile-validation-schema";

export type CareerEvidenceStatus = "Tersedia" | "Terbatas" | "Belum tersedia";
export type CareerEvidenceStrength = "strong" | "medium" | "weak" | "insufficient";

export type LiveProfileEvidenceSources = {
    profileAvailable: boolean;
    analysisAvailable: boolean;
    settingsAvailable: boolean;
    bookCollectionCount: number;
    finishedBooksCount: number;
    unfinishedBooksCount: number;
    careerDataAvailable: boolean;
    careerEvidenceStatus: CareerEvidenceStatus;
    careerEvidenceStrength: CareerEvidenceStrength;
    careerEvidenceExplanation: string;
    narrativeDataAvailable: boolean;
    bookRecommendationAvailable: boolean;
    latestBookInsightCreatedAt: string | null;
    latestValidationCreatedAt: string | null;
    latestBookCollectionChangedAt: string | null;
    bookInsightChangedAfterValidation: boolean;
    bookCollectionChangedAfterValidation: boolean;
    validationDataQualityMismatch: boolean;
};

function isKnown(value: unknown) {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        return normalized !== "" && normalized !== "unknown" && normalized !== "belum tahu";
    }

    return true;
}

function hasMeaningfulSettings(settings: unknown) {
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) return false;

    return Object.entries(settings).some(([key, value]) => {
        if (["id", "userId", "createdAt", "updatedAt", "themeMode"].includes(key)) return false;
        if (Array.isArray(value)) return value.length > 0;
        return isKnown(value);
    });
}

function hasNonEmptyValue(value: unknown): boolean {
    if (typeof value === "string") return isKnown(value);
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object") return Object.keys(value).length > 0;
    return Boolean(value);
}

function getObjectField(source: unknown, field: string) {
    if (!source || typeof source !== "object" || Array.isArray(source)) return undefined;
    return (source as Record<string, unknown>)[field];
}

function getProfileCareerField(profile: unknown, field: string) {
    return getObjectField(profile, field) ?? getObjectField(getObjectField(profile, "rawProfile"), field);
}

function isAfter(first: Date | null | undefined, second: Date | null | undefined) {
    return !!first && !!second && first.getTime() > second.getTime();
}

export function detectCareerEvidence({
    settings,
    profile,
    careerInsight,
}: {
    settings: unknown;
    profile: unknown;
    careerInsight: unknown;
}) {
    const explicitCareerFields = [
        getObjectField(settings, "targetCareer"),
        getObjectField(settings, "careerInterests"),
        getObjectField(settings, "currentRole"),
        getObjectField(settings, "preferredWorkStyle"),
        getProfileCareerField(profile, "careerInterests"),
        getProfileCareerField(profile, "careerGoals"),
        getProfileCareerField(profile, "targetCareer"),
        getProfileCareerField(profile, "preferredWorkStyle"),
        getProfileCareerField(profile, "riasec"),
    ];
    const supportingFields = [
        getObjectField(settings, "currentStatus"),
        getObjectField(settings, "educationLevel"),
        getObjectField(settings, "fieldOfStudy"),
        getObjectField(settings, "learningGoals"),
        getObjectField(settings, "skillsToImprove"),
        getProfileCareerField(profile, "fieldOfStudy"),
        getProfileCareerField(profile, "majorInterest"),
    ];
    const hasCareerInsight = Boolean(careerInsight);
    const hasExplicitCareerData = explicitCareerFields.some(hasNonEmptyValue);
    const hasSupportingCareerData = supportingFields.some(hasNonEmptyValue);

    const result = hasCareerInsight || hasExplicitCareerData
        ? {
              available: true,
              status: "Tersedia" as const,
              strength: hasCareerInsight ? "strong" as const : "medium" as const,
              explanation: hasCareerInsight
                  ? "Insight karier tersedia dan dapat menjadi konteks pemeriksaan."
                  : "Minat atau preferensi karier tersedia dari profil/pengaturan.",
          }
        : hasSupportingCareerData
            ? {
                  available: true,
                  status: "Terbatas" as const,
                  strength: "weak" as const,
                  explanation: "Data pendidikan atau status saat ini tersedia, tetapi minat karier spesifik belum lengkap.",
              }
            : {
                  available: false,
                  status: "Belum tersedia" as const,
                  strength: "insufficient" as const,
                  explanation: "Data minat karier belum tersedia.",
              };

    if (process.env.NODE_ENV === "development") {
        console.log("Career evidence debug:", {
            hasCareerInsight,
            hasExplicitCareerData,
            hasSupportingCareerData,
            result,
        });
    }

    return result;
}

export async function getLiveProfileEvidenceSources(userId: string): Promise<LiveProfileEvidenceSources> {
    const profile = await prisma.userProfile.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { id: true, riasec: true, rawProfile: true },
    });

    const [
        analysis,
        settings,
        totalBooks,
        finishedBooks,
        latestBook,
        latestNarrativePrediction,
        latestValidation,
        latestBookInsight,
    ] = await Promise.all([
        prisma.analysisResult.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: { id: true },
        }),
        prisma.userSettings.findUnique({ where: { userId } }),
        prisma.userBook.count({ where: { userId } }),
        prisma.userBook.count({ where: { userId, status: "finished" } }),
        prisma.userBook.findFirst({
            where: { userId },
            orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
            select: { updatedAt: true, createdAt: true },
        }),
        prisma.narrativePrediction.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: { id: true },
        }),
        prisma.profileValidation.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: { id: true, createdAt: true, result: true },
        }),
        profile
            ? prisma.bookInsight.findFirst({
                  where: { profileId: profile.id },
                  orderBy: { createdAt: "desc" },
                  select: { id: true, createdAt: true },
              })
            : Promise.resolve(null),
    ]);

    const latestCareerInsight = profile
        ? await prisma.careerInsight.findFirst({
              where: { profileId: profile.id },
              orderBy: { createdAt: "desc" },
              select: { id: true },
          })
        : null;

    const parsedValidation = latestValidation ? profileValidationSchema.safeParse(latestValidation.result) : null;
    const validationQuality = parsedValidation?.success ? parsedValidation.data.data_quality : null;
    const unfinishedBooks = Math.max(totalBooks - finishedBooks, 0);
    const latestBookChangedAt = latestBook?.updatedAt ?? latestBook?.createdAt ?? null;
    const careerEvidence = detectCareerEvidence({ settings, profile, careerInsight: latestCareerInsight });
    const validationDataQualityMismatch = !!validationQuality && (
        validationQuality.book_collection_count !== totalBooks ||
        validationQuality.finished_books_count !== finishedBooks ||
        validationQuality.unfinished_books_count !== unfinishedBooks
    );

    if (process.env.NODE_ENV === "development") {
        console.log("Book evidence live counts:", {
            totalBooks,
            finishedBooks,
            unfinishedBooks,
            hasLatestBookInsight: !!latestBookInsight,
            hasLatestProfileValidation: !!latestValidation,
        });
    }

    return {
        profileAvailable: !!profile,
        analysisAvailable: !!analysis,
        settingsAvailable: hasMeaningfulSettings(settings),
        bookCollectionCount: totalBooks,
        finishedBooksCount: finishedBooks,
        unfinishedBooksCount: unfinishedBooks,
        careerDataAvailable: careerEvidence.available,
        careerEvidenceStatus: careerEvidence.status,
        careerEvidenceStrength: careerEvidence.strength,
        careerEvidenceExplanation: careerEvidence.explanation,
        narrativeDataAvailable: !!latestNarrativePrediction,
        bookRecommendationAvailable: !!latestBookInsight,
        latestBookInsightCreatedAt: latestBookInsight?.createdAt.toISOString() ?? null,
        latestValidationCreatedAt: latestValidation?.createdAt.toISOString() ?? null,
        latestBookCollectionChangedAt: latestBookChangedAt?.toISOString() ?? null,
        bookInsightChangedAfterValidation: isAfter(latestBookInsight?.createdAt, latestValidation?.createdAt),
        bookCollectionChangedAfterValidation: isAfter(latestBookChangedAt, latestValidation?.createdAt),
        validationDataQualityMismatch,
    };
}
