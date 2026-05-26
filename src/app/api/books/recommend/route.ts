import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getLatestUserAnalysis, getLatestUserProfile } from "@/lib/analysis-data";
import {
    buildBookRecommendationPrompt,
    buildBookRecommendationRepairPrompt,
    getAvailableProfileFactors,
    normalizeBookRecommendation,
} from "@/lib/book-recommendations";
import { analyzeCollectionPattern } from "@/lib/books/collection-pattern";
import { requireCurrentUserId } from "@/lib/current-user";
import { cleanAndParseJSON } from "@/lib/personality-parser";
import { prisma } from "@/lib/prisma";
import { generatePersonalitySynthesis, getConfiguredVertexModel } from "@/lib/vertex-ai";

const NO_PROFILE_MESSAGE = "Bangun profil terlebih dahulu untuk mendapatkan rekomendasi buku.";
const NO_ANALYSIS_MESSAGE = "Buat analisis terlebih dahulu agar rekomendasi buku lebih personal.";
const INVALID_RECOMMENDATION_MESSAGE = "Gagal membuat rekomendasi buku yang valid.";
const SAVE_RECOMMENDATION_MESSAGE = "Gagal menyimpan rekomendasi buku.";

function parseBookRecommendation(text: string) {
    return normalizeBookRecommendation(cleanAndParseJSON(text));
}

async function saveBookInsight({
    userId,
    profileId,
    analysisId,
    recommendation,
    model,
}: {
    userId: string;
    profileId: string;
    analysisId: string;
    recommendation: unknown;
    model: string;
}) {
    try {
        const bookInsight = await prisma.bookInsight.create({
            data: {
                profileId,
                analysisId,
                content: recommendation as Prisma.InputJsonValue,
                model,
            },
        });

        console.log("BookInsight saved:", {
            id: bookInsight.id,
            userId,
            profileId,
            createdAt: bookInsight.createdAt,
        });

        return bookInsight;
    } catch (error) {
        console.error("BookInsight save failed:", error);
        throw new Error(SAVE_RECOMMENDATION_MESSAGE);
    }
}

export async function GET() {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const [profile, analysis] = await Promise.all([
            getLatestUserProfile(authResult.userId),
            getLatestUserAnalysis(authResult.userId),
        ]);

        if (!profile) {
            return NextResponse.json({
                profile: null,
                analysis: null,
                recommendation: null,
                error: NO_PROFILE_MESSAGE,
            });
        }

        if (!analysis) {
            return NextResponse.json({
                profile: {
                    id: profile.id,
                    name: profile.name,
                },
                analysis: null,
                recommendation: null,
                error: NO_ANALYSIS_MESSAGE,
            });
        }

        const latestInsight = await prisma.bookInsight.findFirst({
            where: { profileId: profile.id },
            orderBy: { createdAt: "desc" },
        });
        const recommendation = latestInsight
            ? (() => {
                try {
                    return normalizeBookRecommendation(latestInsight.content);
                } catch {
                    return null;
                }
            })()
            : null;
        const collection = await prisma.userBook.findMany({
            where: { userId: authResult.userId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            profile: {
                id: profile.id,
                name: profile.name,
            },
            analysis: {
                id: analysis.id,
                createdAt: analysis.createdAt,
                model: analysis.model,
                profile: analysis.profile,
            },
            recommendation,
            bookInsightId: recommendation ? latestInsight?.id : null,
            collection,
            error: null,
        });
    } catch (error) {
        console.error("Book recommendation read failed:", error);
        return NextResponse.json(
            { error: "Rekomendasi buku gagal dimuat." },
            { status: 500 }
        );
    }
}

export async function POST() {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const [profile, analysis] = await Promise.all([
            getLatestUserProfile(authResult.userId),
            getLatestUserAnalysis(authResult.userId),
        ]);

        if (!profile) {
            return NextResponse.json({ error: NO_PROFILE_MESSAGE }, { status: 404 });
        }

        if (!analysis) {
            return NextResponse.json({ error: NO_ANALYSIS_MESSAGE }, { status: 404 });
        }

        const availableFactors = getAvailableProfileFactors(profile, analysis.parsedJson);
        const [collection, settings, latestBookInsight] = await Promise.all([
            prisma.userBook.findMany({
                where: { userId: authResult.userId },
                orderBy: { createdAt: "desc" },
            }),
            prisma.userSettings.findUnique({
                where: { userId: authResult.userId },
            }),
            prisma.bookInsight.findFirst({
                where: { profileId: profile.id },
                orderBy: { createdAt: "desc" },
            }),
        ]);
        const unfinishedBooks = collection.filter((book) => ["owned", "reading", "wishlist"].includes(book.status));
        const finishedBooks = collection.filter((book) => book.status === "finished");
        const collectionPattern = analyzeCollectionPattern(collection);
        const prompt = buildBookRecommendationPrompt({
            profile,
            analysisJson: analysis.parsedJson,
            markdown: analysis.markdown,
            availableFactors,
            unfinishedBooks,
            finishedBooks,
            settings,
            collectionPattern,
            latestBookInsight: latestBookInsight?.content ?? null,
        });

        let rawResponse = "";

        try {
            rawResponse = await generatePersonalitySynthesis(prompt);
            const parsed = parseBookRecommendation(rawResponse);
            const model = getConfiguredVertexModel();
            const bookInsight = await saveBookInsight({
                userId: authResult.userId,
                profileId: profile.id,
                analysisId: analysis.id,
                recommendation: parsed,
                model,
            });

            return NextResponse.json({
                recommendation: parsed,
                bookInsight: {
                    id: bookInsight.id,
                    createdAt: bookInsight.createdAt,
                    model: bookInsight.model,
                },
            });
        } catch (firstError) {
            if (firstError instanceof Error && firstError.message === SAVE_RECOMMENDATION_MESSAGE) {
                throw firstError;
            }

            console.warn("Book recommendation validation failed, attempting repair:", firstError);
            const validationMessage = firstError instanceof Error ? firstError.message : String(firstError);
            const repairResponse = await generatePersonalitySynthesis(
                buildBookRecommendationRepairPrompt(rawResponse, validationMessage)
            );
            const repaired = parseBookRecommendation(repairResponse);
            const model = getConfiguredVertexModel();
            const bookInsight = await saveBookInsight({
                userId: authResult.userId,
                profileId: profile.id,
                analysisId: analysis.id,
                recommendation: repaired,
                model,
            });

            return NextResponse.json({
                recommendation: repaired,
                bookInsight: {
                    id: bookInsight.id,
                    createdAt: bookInsight.createdAt,
                    model: bookInsight.model,
                },
            });
        }
    } catch (error) {
        console.error("Book recommendation failed:", error);
        return NextResponse.json(
            { error: error instanceof Error && error.message === SAVE_RECOMMENDATION_MESSAGE ? SAVE_RECOMMENDATION_MESSAGE : INVALID_RECOMMENDATION_MESSAGE },
            { status: 500 }
        );
    }
}
