import "server-only";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { getDashboardConsistencySummary, type DashboardConsistencySummary } from "@/lib/profile-consistency";
import { prisma } from "@/lib/prisma";
import { defaultSettings, type SettingsPayload } from "@/lib/settings-schema";

export interface DashboardData {
    isAuthenticated: boolean;
    dashboardStatus: "guest" | "ready" | "degraded";
    dashboardError: string | null;
    profileCompleteness: number;
    analysisCount: number;
    narrativePredictionCount: number;
    latestProfile: {
        id: string;
        name: string;
        mbti: string;
        enneagramType: string;
        enneagramWing: string;
        enneagramTritype: string;
        attitudinalPsyche: string;
        instinctualVariant: string;
        socionics: string;
        temperament: string;
        riasec: string;
        bigFive: unknown;
        createdAt: Date;
    } | null;
    latestAnalysis: {
        id: string;
        createdAt: Date;
        markdown: string;
        model: string;
        parsedJson: unknown;
    } | null;
    consistencySummary: DashboardConsistencySummary;
    latestProfileValidation: {
        id: string;
        score: number | null;
        risk: string | null;
        confidence: string | null;
        createdAt: Date;
    } | null;
    hasCompletedMbtiTest: boolean;
    hasBookRecommendation: boolean;
}

const isComplete = (val: unknown) => {
    if (val === null || val === undefined || val === "") return false;
    if (typeof val === "string" && val.toLowerCase() === "unknown") return false;
    return true;
};

function readJsonArray(value: Prisma.JsonValue | null) {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function serializeSettings(settings: {
    themeMode: string;
    displayName: string | null;
    birthYear: number | null;
    ageRange: string | null;
    gender: string | null;
    location: string | null;
    shortBio: string | null;
    educationLevel: string | null;
    fieldOfStudy: string | null;
    institution: string | null;
    graduationStatus: string | null;
    learningGoals: Prisma.JsonValue | null;
    currentStatus: string | null;
    currentRole: string | null;
    targetCareer: string | null;
    careerInterests: Prisma.JsonValue | null;
    preferredWorkStyle: string | null;
    hobbies: Prisma.JsonValue | null;
    interests: Prisma.JsonValue | null;
    favoriteTopics: Prisma.JsonValue | null;
    favoriteBookGenres: Prisma.JsonValue | null;
    skillsToImprove: Prisma.JsonValue | null;
    dislikedTopics: Prisma.JsonValue | null;
}): SettingsPayload {
    return {
        ...defaultSettings,
        ...settings,
        themeMode: settings.themeMode === "light" || settings.themeMode === "dark" || settings.themeMode === "system" ? settings.themeMode : "system",
        learningGoals: readJsonArray(settings.learningGoals),
        careerInterests: readJsonArray(settings.careerInterests),
        hobbies: readJsonArray(settings.hobbies),
        interests: readJsonArray(settings.interests),
        favoriteTopics: readJsonArray(settings.favoriteTopics),
        favoriteBookGenres: readJsonArray(settings.favoriteBookGenres),
        skillsToImprove: readJsonArray(settings.skillsToImprove),
        dislikedTopics: readJsonArray(settings.dislikedTopics),
    };
}

async function findCompletedMbtiTest(userId: string) {
    try {
        return await prisma.externalMbtiTest.findFirst({
            where: { userId, provider: "devil.ai", status: "completed" },
            select: { id: true },
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
            console.warn("Dashboard external MBTI status unavailable: required table does not exist.");
            return null;
        }

        throw error;
    }
}

export async function getDashboardData(): Promise<DashboardData> {
    const session = await auth();
    const userId = session?.user?.id;

    if (process.env.NODE_ENV === "development") {
        console.log("Dashboard auth debug:", {
            hasSession: Boolean(session),
            userEmail: session?.user?.email ?? null,
            userId: userId ?? null,
        });
    }

    const publicState: DashboardData = {
        isAuthenticated: false,
        dashboardStatus: "guest",
        dashboardError: null,
        profileCompleteness: 0,
        analysisCount: 0,
        narrativePredictionCount: 0,
        latestProfile: null,
        latestAnalysis: null,
        consistencySummary: getDashboardConsistencySummary(null, defaultSettings, null, []),
        latestProfileValidation: null,
        hasCompletedMbtiTest: false,
        hasBookRecommendation: false,
    };

    if (!userId) {
        return publicState;
    }

    try {
        // Fetch latest profile owned by user
        const latestProfile = await prisma.userProfile.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        const [
            latestAnalysis,
            settings,
            books,
            analysisCount,
            narrativePredictionCount,
            latestProfileValidation,
            completedMbtiTest,
            latestBookInsight,
        ] = await Promise.all([
            prisma.analysisResult.findFirst({
                where: { userId },
                orderBy: { createdAt: "desc" },
            }),
            prisma.userSettings.findUnique({ where: { userId } }),
            prisma.userBook.findMany({
                where: { userId },
                select: { status: true },
            }),
            prisma.analysisResult.count({ where: { userId } }),
            prisma.narrativePrediction.count({ where: { userId } }),
            prisma.profileValidation.findFirst({
                where: { userId },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    score: true,
                    risk: true,
                    confidence: true,
                    createdAt: true,
                },
            }),
            findCompletedMbtiTest(userId),
            latestProfile
                ? prisma.bookInsight.findFirst({
                      where: { profileId: latestProfile.id },
                      select: { id: true },
                      orderBy: { createdAt: "desc" },
                  })
                : Promise.resolve(null),
        ]);

        // Completeness calculation
        let profileCompleteness = 0;
        if (latestProfile) {
            let completeCount = 0;
            if (isComplete(latestProfile.name)) completeCount++;
            if (isComplete(latestProfile.mbti)) completeCount++;
            if (isComplete(latestProfile.enneagramType)) completeCount++;
            if (isComplete(latestProfile.instinctualVariant)) completeCount++;
            if (isComplete(latestProfile.socionics)) completeCount++;
            if (isComplete(latestProfile.temperament)) completeCount++;
            if (isComplete(latestProfile.attitudinalPsyche)) completeCount++;
            if (isComplete(latestProfile.riasec)) completeCount++;
            if (isComplete(latestProfile.bigFive)) completeCount++;
            if (narrativePredictionCount > 0) completeCount++;

            profileCompleteness = Math.round((completeCount / 10) * 100);
        }

        return {
            isAuthenticated: true,
            dashboardStatus: "ready",
            dashboardError: null,
            profileCompleteness,
            analysisCount,
            narrativePredictionCount,
            latestProfile: latestProfile
                ? {
                      id: latestProfile.id,
                      name: latestProfile.name,
                      mbti: latestProfile.mbti,
                      enneagramType: latestProfile.enneagramType,
                      enneagramWing: latestProfile.enneagramWing,
                      enneagramTritype: latestProfile.enneagramTritype,
                      attitudinalPsyche: latestProfile.attitudinalPsyche,
                      instinctualVariant: latestProfile.instinctualVariant,
                      socionics: latestProfile.socionics,
                      temperament: latestProfile.temperament,
                      riasec: latestProfile.riasec,
                      bigFive: latestProfile.bigFive,
                      createdAt: latestProfile.createdAt,
                  }
                : null,
            latestAnalysis: latestAnalysis
                ? {
                      id: latestAnalysis.id,
                      createdAt: latestAnalysis.createdAt,
                      markdown: latestAnalysis.markdown,
                      model: latestAnalysis.model,
                      parsedJson: latestAnalysis.parsedJson,
                  }
                : null,
            consistencySummary: getDashboardConsistencySummary(
                latestProfile,
                settings ? serializeSettings(settings) : defaultSettings,
                latestAnalysis ? { parsedJson: latestAnalysis.parsedJson } : null,
                books
            ),
            latestProfileValidation,
            hasCompletedMbtiTest: !!completedMbtiTest,
            hasBookRecommendation: !!latestBookInsight,
        };
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        return {
            ...publicState,
            isAuthenticated: true,
            dashboardStatus: "degraded",
            dashboardError: "Data dashboard belum dapat dimuat. Coba lagi nanti.",
        };
    }
}
