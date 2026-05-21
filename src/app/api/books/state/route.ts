import { NextResponse } from "next/server";
import { getLatestUserAnalysis, getLatestUserProfile } from "@/lib/analysis-data";
import { normalizeBookRecommendation } from "@/lib/book-recommendations";
import { requireCurrentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const NO_PROFILE_MESSAGE = "Bangun profil terlebih dahulu untuk mendapatkan rekomendasi buku.";
const NO_ANALYSIS_MESSAGE = "Buat analisis terlebih dahulu agar rekomendasi buku lebih personal.";
const READY_MESSAGE = "Rekomendasi buku siap dibuat.";

export async function GET() {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const profile = await getLatestUserProfile(authResult.userId);

        if (!profile) {
            return NextResponse.json({
                profile: null,
                latestAnalysis: null,
                latestBookInsight: null,
                canRecommend: false,
                emptyState: "no_profile",
                message: NO_PROFILE_MESSAGE,
            });
        }

        const analysis = await getLatestUserAnalysis(authResult.userId);

        if (!analysis) {
            return NextResponse.json({
                profile: {
                    id: profile.id,
                    name: profile.name,
                },
                latestAnalysis: null,
                latestBookInsight: null,
                canRecommend: false,
                emptyState: "no_analysis",
                message: NO_ANALYSIS_MESSAGE,
            });
        }

        const latestInsight = await prisma.bookInsight.findFirst({
            where: {
                profileId: profile.id,
                OR: [
                    { analysisId: analysis.id },
                    { analysisId: null },
                ],
            },
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

        return NextResponse.json({
            profile: {
                id: profile.id,
                name: profile.name,
            },
            latestAnalysis: {
                id: analysis.id,
                createdAt: analysis.createdAt,
                model: analysis.model,
                profile: analysis.profile,
            },
            latestBookInsight: recommendation && latestInsight
                ? {
                    id: latestInsight.id,
                    createdAt: latestInsight.createdAt,
                    model: latestInsight.model,
                    recommendation,
                }
                : null,
            canRecommend: true,
            emptyState: "ready",
            message: READY_MESSAGE,
        });
    } catch (error) {
        console.error("Book state load failed:", error);
        return NextResponse.json(
            { error: "Terjadi masalah pada server buku." },
            { status: 500 }
        );
    }
}
