import "server-only";

import type { Prisma } from "@prisma/client";
import { cleanAndParseJSON } from "@/lib/personality-parser";
import { prisma } from "@/lib/prisma";
import { buildProfileValidationPrompt, buildProfileValidationRepairPrompt } from "@/lib/profile-validation-prompt";
import { profileValidationSchema, type ProfileValidationResult } from "@/lib/profile-validation-schema";
import { generateProfileValidation } from "@/lib/vertex-ai";

export const NO_PROFILE_VALIDATION_MESSAGE = "Bangun profil terlebih dahulu sebelum memeriksa konsistensi.";
export const INVALID_PROFILE_VALIDATION_MESSAGE = "Gagal memeriksa konsistensi profil.";

type JsonValue = Prisma.JsonValue;

type ProfileValidationRecord = {
    id: string;
    userId: string;
    profileId: string | null;
    analysisId: string | null;
    result: JsonValue;
    score: number | null;
    risk: string | null;
    confidence: string | null;
    createdAt: Date;
};

export type ProfileValidationInput = {
    available_frameworks: string[];
    data_quality_hint: {
        limited_supporting_data: boolean;
        supporting_source_count: number;
    };
    profile_data: {
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
        bigFive: JsonValue | null;
        rawProfile: JsonValue;
        createdAt: string;
        updatedAt: string;
    };
    analysis_data: {
        id: string;
        markdown_excerpt: string;
        parsedJson: JsonValue | null;
        createdAt: string;
    } | null;
    settings_data: JsonValue | null;
    book_collection: Array<{
        id: string;
        title: string;
        author: string | null;
        categories: JsonValue | null;
        status: string;
        rating: number | null;
        notes: string | null;
    }>;
    latest_book_insight: {
        id: string;
        content: JsonValue;
        createdAt: string;
    } | null;
    latest_narrative_prediction: {
        id: string;
        inputText: string;
        prediction: JsonValue;
        createdAt: string;
    } | null;
    latest_career_insight: {
        id: string;
        content: JsonValue;
        createdAt: string;
    } | null;
};

function isKnown(value: unknown) {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        return normalized !== "" && normalized !== "unknown" && normalized !== "belum tahu";
    }

    return true;
}

function getAvailableFrameworks(profile: ProfileValidationInput["profile_data"], analysisJson: JsonValue | null) {
    const frameworks: string[] = [];

    if (isKnown(profile.mbti)) frameworks.push("MBTI");
    if (isKnown(profile.enneagramType)) frameworks.push("Enneagram");
    if (isKnown(profile.enneagramTritype)) frameworks.push("Tritype");
    if (isKnown(profile.instinctualVariant)) frameworks.push("Instinctual Variant");
    if (isKnown(profile.socionics)) frameworks.push("Socionics");
    if (isKnown(profile.attitudinalPsyche)) frameworks.push("Attitudinal Psyche");
    if (isKnown(profile.riasec)) frameworks.push("RIASEC");
    if (isKnown(profile.bigFive)) frameworks.push("Big Five");
    if (isKnown(profile.temperament)) frameworks.push("Temperament");

    if (analysisJson && typeof analysisJson === "object") {
        frameworks.push("Analisis AI tersimpan");
    }

    return frameworks;
}

function hasMeaningfulSettings(settings: JsonValue | null) {
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) return false;

    return Object.entries(settings).some(([key, value]) => {
        if (["id", "userId", "createdAt", "updatedAt", "themeMode"].includes(key)) return false;
        if (Array.isArray(value)) return value.length > 0;
        return isKnown(value);
    });
}

function isLimitedData(input: ProfileValidationInput) {
    const sourceCount = [
        input.analysis_data,
        hasMeaningfulSettings(input.settings_data) ? input.settings_data : null,
        input.book_collection.length > 0 ? input.book_collection : null,
        input.latest_book_insight,
        input.latest_narrative_prediction,
        input.latest_career_insight,
    ].filter(Boolean).length;

    return {
        limited_supporting_data: sourceCount < 2,
        supporting_source_count: sourceCount,
    };
}

function normalizeResult(result: ProfileValidationResult, input: ProfileValidationInput): ProfileValidationResult {
    const available = new Set(input.available_frameworks.filter((framework) => framework !== "Analisis AI tersimpan"));
    const normalized = {
        ...result,
        framework_assessment: result.framework_assessment.filter((assessment) => available.has(assessment.framework)),
    };

    if (input.data_quality_hint.limited_supporting_data) {
        return {
            ...normalized,
            confidence: "low",
            warnings: Array.from(new Set([
                ...normalized.warnings,
                "Data pendukung masih terbatas. Hasil pemeriksaan mungkin belum kuat.",
            ])),
            data_quality: {
                ...normalized.data_quality,
                limitations: Array.from(new Set([
                    ...normalized.data_quality.limitations,
                    "Data pendukung masih terbatas.",
                ])),
            },
        };
    }

    return normalized;
}

function parseProfileValidation(text: string, input: ProfileValidationInput) {
    const parsed = profileValidationSchema.parse(cleanAndParseJSON(text));
    return normalizeResult(parsed, input);
}

function excerpt(text: string, maxLength = 5000) {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export function serializeProfileValidation(validation: ProfileValidationRecord) {
    const parsed = profileValidationSchema.safeParse(validation.result);

    return {
        id: validation.id,
        profileId: validation.profileId,
        analysisId: validation.analysisId,
        result: parsed.success ? parsed.data : validation.result,
        score: validation.score,
        risk: validation.risk,
        confidence: validation.confidence,
        createdAt: validation.createdAt,
    };
}

export async function getLatestProfileValidation(userId: string) {
    const validation = await prisma.profileValidation.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });

    return validation ? serializeProfileValidation(validation) : null;
}

async function buildProfileValidationInput(userId: string): Promise<ProfileValidationInput | null> {
    const profile = await prisma.userProfile.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });

    if (!profile) return null;

    const [analysis, settings, books, latestBookInsight, latestNarrativePrediction, latestCareerInsight] = await Promise.all([
        prisma.analysisResult.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
        }),
        prisma.userSettings.findUnique({ where: { userId } }),
        prisma.userBook.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                author: true,
                categories: true,
                status: true,
                rating: true,
                notes: true,
            },
        }),
        prisma.bookInsight.findFirst({
            where: { profileId: profile.id },
            orderBy: { createdAt: "desc" },
        }),
        prisma.narrativePrediction.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
        }),
        prisma.careerInsight.findFirst({
            where: { profileId: profile.id },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    const profileData: ProfileValidationInput["profile_data"] = {
        id: profile.id,
        name: profile.name,
        mbti: profile.mbti,
        enneagramType: profile.enneagramType,
        enneagramWing: profile.enneagramWing,
        enneagramTritype: profile.enneagramTritype,
        attitudinalPsyche: profile.attitudinalPsyche,
        instinctualVariant: profile.instinctualVariant,
        socionics: profile.socionics,
        temperament: profile.temperament,
        riasec: profile.riasec,
        bigFive: profile.bigFive,
        rawProfile: profile.rawProfile,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
    };
    const analysisData = analysis
        ? {
              id: analysis.id,
              markdown_excerpt: excerpt(analysis.markdown),
              parsedJson: analysis.parsedJson,
              createdAt: analysis.createdAt.toISOString(),
          }
        : null;
    const inputWithoutHints = {
        available_frameworks: getAvailableFrameworks(profileData, analysisData?.parsedJson ?? null),
        data_quality_hint: {
            limited_supporting_data: false,
            supporting_source_count: 0,
        },
        profile_data: profileData,
        analysis_data: analysisData,
        settings_data: settings as unknown as JsonValue | null,
        book_collection: books,
        latest_book_insight: latestBookInsight
            ? {
                  id: latestBookInsight.id,
                  content: latestBookInsight.content,
                  createdAt: latestBookInsight.createdAt.toISOString(),
              }
            : null,
        latest_narrative_prediction: latestNarrativePrediction
            ? {
                  id: latestNarrativePrediction.id,
                  inputText: excerpt(latestNarrativePrediction.inputText, 3000),
                  prediction: latestNarrativePrediction.prediction,
                  createdAt: latestNarrativePrediction.createdAt.toISOString(),
              }
            : null,
        latest_career_insight: latestCareerInsight
            ? {
                  id: latestCareerInsight.id,
                  content: latestCareerInsight.content,
                  createdAt: latestCareerInsight.createdAt.toISOString(),
              }
            : null,
    };

    return {
        ...inputWithoutHints,
        data_quality_hint: isLimitedData(inputWithoutHints),
    };
}

export async function generateAndSaveProfileValidation(userId: string) {
    const input = await buildProfileValidationInput(userId);

    if (!input) {
        return { error: NO_PROFILE_VALIDATION_MESSAGE, status: 400 as const };
    }

    let rawResponse = "";
    let parsed: ProfileValidationResult;

    try {
        rawResponse = await generateProfileValidation(buildProfileValidationPrompt(input));
        parsed = parseProfileValidation(rawResponse, input);
    } catch (firstError) {
        const validationMessage = firstError instanceof Error ? firstError.message : String(firstError);

        try {
            const repaired = await generateProfileValidation(
                buildProfileValidationRepairPrompt(rawResponse, validationMessage)
            );
            parsed = parseProfileValidation(repaired, input);
        } catch {
            return { error: INVALID_PROFILE_VALIDATION_MESSAGE, status: 500 as const };
        }
    }

    const validation = await prisma.profileValidation.create({
        data: {
            userId,
            profileId: input.profile_data.id,
            analysisId: input.analysis_data?.id ?? null,
            result: parsed as unknown as Prisma.InputJsonValue,
            score: Math.round(parsed.profile_consistency_score),
            risk: parsed.mistype_risk,
            confidence: parsed.confidence,
        },
    });

    return {
        validation: serializeProfileValidation(validation),
        status: 200 as const,
    };
}
