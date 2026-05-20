import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getValidationError, isValidationError } from "@/lib/api-validation";
import { requireCurrentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { defaultSettings, normalizeSettingsPayload, type SettingsPayload } from "@/lib/settings-schema";

const jsonArrayFields = [
    "learningGoals",
    "careerInterests",
    "hobbies",
    "interests",
    "favoriteTopics",
    "favoriteBookGenres",
    "skillsToImprove",
    "dislikedTopics",
] as const;

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
}) {
    return {
        ...defaultSettings,
        ...settings,
        themeMode: settings.themeMode === "light" || settings.themeMode === "dark" || settings.themeMode === "system"
            ? settings.themeMode
            : "system",
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

function settingsToPrismaData(settings: SettingsPayload) {
    const data: Record<string, string | number | null | Prisma.InputJsonValue> = {
        themeMode: settings.themeMode,
        displayName: settings.displayName ?? null,
        birthYear: settings.birthYear ?? null,
        ageRange: settings.ageRange ?? null,
        gender: settings.gender ?? null,
        location: settings.location ?? null,
        shortBio: settings.shortBio ?? null,
        educationLevel: settings.educationLevel ?? null,
        fieldOfStudy: settings.fieldOfStudy ?? null,
        institution: settings.institution ?? null,
        graduationStatus: settings.graduationStatus ?? null,
        currentStatus: settings.currentStatus ?? null,
        currentRole: settings.currentRole ?? null,
        targetCareer: settings.targetCareer ?? null,
        preferredWorkStyle: settings.preferredWorkStyle ?? null,
    };

    for (const field of jsonArrayFields) {
        data[field] = settings[field] as Prisma.InputJsonValue;
    }

    return data;
}

export async function GET() {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const settings = await prisma.userSettings.findUnique({
            where: { userId: authResult.userId },
        });

        return NextResponse.json({
            settings: settings ? serializeSettings(settings) : defaultSettings,
        });
    } catch (error) {
        console.error("GET /api/settings failed:", error);
        return NextResponse.json(
            { error: "Gagal memuat pengaturan." },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const settings = normalizeSettingsPayload(await request.json());
        const data = settingsToPrismaData(settings);
        const saved = await prisma.userSettings.upsert({
            where: { userId: authResult.userId },
            create: {
                userId: authResult.userId,
                ...data,
            },
            update: data,
        });

        return NextResponse.json({ settings: serializeSettings(saved) });
    } catch (error) {
        console.error("PUT /api/settings failed:", error);
        return NextResponse.json(
            { error: getValidationError(error, "Pengaturan gagal disimpan.") },
            { status: isValidationError(error) ? 400 : 500 }
        );
    }
}
