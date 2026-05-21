import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId, NOT_FOUND_MESSAGE, FORBIDDEN_MESSAGE } from "@/lib/current-user";

const requestSchema = z.object({
    testId: z.string().min(1, "testId wajib diisi."),
});

export async function POST(req: NextRequest) {
    const { userId, response } = await requireCurrentUserId();
    if (response) return response;

    let testId: string;
    try {
        const body = await req.json();
        testId = requestSchema.parse(body).testId;
    } catch {
        return NextResponse.json(
            { error: "testId wajib diisi." },
            { status: 400 },
        );
    }

    // Find the completed test
    const testRecord = await prisma.externalMbtiTest.findUnique({
        where: { provider_testId: { provider: "devil.ai", testId } },
    });

    if (!testRecord) {
        return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    if (testRecord.userId !== userId) {
        return NextResponse.json({ error: FORBIDDEN_MESSAGE }, { status: 403 });
    }

    if (testRecord.status !== "completed" || !testRecord.prediction) {
        return NextResponse.json(
            { error: "Tes belum selesai atau belum memiliki prediksi." },
            { status: 400 },
        );
    }

    // Find the latest user profile
    const latestProfile = await prisma.userProfile.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });

    if (!latestProfile) {
        return NextResponse.json(
            { error: "Profil belum dibuat. Buat profil terlebih dahulu." },
            { status: 404 },
        );
    }

    // Update mbti on the profile
    const updateData: Prisma.UserProfileUpdateInput = {
        mbti: testRecord.prediction,
    };

    // Also update rawProfile.mbti when rawProfile is an object
    if (
        latestProfile.rawProfile &&
        typeof latestProfile.rawProfile === "object" &&
        !Array.isArray(latestProfile.rawProfile)
    ) {
        const rawObj = latestProfile.rawProfile as Record<string, unknown>;
        updateData.rawProfile = {
            ...rawObj,
            mbti: testRecord.prediction,
        } as Prisma.InputJsonValue;
    }

    await prisma.userProfile.update({
        where: { id: latestProfile.id },
        data: updateData,
    });

    return NextResponse.json({
        success: true,
        mbti: testRecord.prediction,
    });
}
