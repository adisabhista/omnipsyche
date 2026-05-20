import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireCurrentUserId } from "@/lib/current-user";
import { getProfileDataQuality } from "@/lib/profile-consistency";
import { prisma } from "@/lib/prisma";
import { defaultSettings, type SettingsPayload } from "@/lib/settings-schema";

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

export async function GET() {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const [profile, settings, latestAnalysis, books] = await Promise.all([
            prisma.userProfile.findFirst({
                where: { userId: authResult.userId },
                orderBy: { createdAt: "desc" },
            }),
            prisma.userSettings.findUnique({
                where: { userId: authResult.userId },
            }),
            prisma.analysisResult.findFirst({
                where: { userId: authResult.userId },
                orderBy: { createdAt: "desc" },
                select: { parsedJson: true },
            }),
            prisma.userBook.findMany({
                where: { userId: authResult.userId },
                select: { status: true },
            }),
        ]);

        const quality = getProfileDataQuality(
            profile,
            settings ? serializeSettings(settings) : defaultSettings,
            latestAnalysis,
            books
        );

        return NextResponse.json(quality);
    } catch (error) {
        console.error("GET /api/profile/quality failed:", error);
        return NextResponse.json(
            { error: "Gagal memuat kualitas profil." },
            { status: 500 }
        );
    }
}
