import "server-only";

import { prisma } from "@/lib/prisma";

export function getLatestUserProfile(userId: string) {
    return prisma.userProfile.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
}

export function getLatestUserAnalysis(userId: string) {
    return prisma.analysisResult.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            profile: {
                select: {
                    id: true,
                    name: true,
                    mbti: true,
                    enneagramType: true,
                    enneagramWing: true,
                    enneagramTritype: true,
                    instinctualVariant: true,
                    socionics: true,
                    attitudinalPsyche: true,
                    riasec: true,
                    bigFive: true,
                },
            },
        },
    });
}

export function getUserAnalyses(userId: string) {
    return prisma.analysisResult.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            profile: {
                select: {
                    id: true,
                    name: true,
                    mbti: true,
                    enneagramType: true,
                },
            },
        },
    });
}

export function getUserAnalysisById(userId: string, id: string) {
    return prisma.analysisResult.findFirst({
        where: { id, userId },
        include: {
            profile: {
                select: {
                    id: true,
                    name: true,
                    mbti: true,
                    enneagramType: true,
                    enneagramWing: true,
                    instinctualVariant: true,
                    socionics: true,
                    attitudinalPsyche: true,
                    riasec: true,
                },
            },
        },
    });
}
