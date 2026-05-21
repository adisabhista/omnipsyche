import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/current-user";
import { createDevilAiTest } from "@/lib/devil-ai";

export async function POST() {
    const { userId, response } = await requireCurrentUserId();
    if (response) return response;

    // Use profile name, settings displayName, or fallback
    let testerName = "Pengguna OmniPsyche";

    const [latestProfile, settings] = await Promise.all([
        prisma.userProfile.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: { name: true },
        }),
        prisma.userSettings.findFirst({
            where: { userId },
            select: { displayName: true },
        }),
    ]);

    if (latestProfile?.name) {
        testerName = latestProfile.name;
    } else if (settings?.displayName) {
        testerName = settings.displayName;
    }

    try {
        const result = await createDevilAiTest(testerName);

        const record = await prisma.externalMbtiTest.create({
            data: {
                userId: userId!,
                provider: "devil.ai",
                testId: result.testId,
                testUrl: result.testUrl,
                status: "pending",
            },
        });

        return NextResponse.json({
            test: {
                id: record.id,
                testId: record.testId,
                testUrl: record.testUrl,
                status: record.status,
            },
        });
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Gagal membuat tes MBTI.";
        return NextResponse.json({ error: message }, { status: 502 });
    }
}
