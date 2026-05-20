import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidationError, listQuerySchema } from "@/lib/api-validation";
import { requireCurrentUserId } from "@/lib/current-user";

export async function GET(req: Request) {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const { searchParams } = new URL(req.url);
        const query = listQuerySchema.parse(Object.fromEntries(searchParams));
        const predictions = await prisma.narrativePrediction.findMany({
            where: {
                userId: authResult.userId,
                ...(query.profileId ? { profileId: query.profileId } : {}),
            },
            take: query.limit,
            orderBy: { createdAt: "desc" },
            include: {
                profile: {
                    select: {
                        id: true,
                        name: true,
                        mbti: true,
                    },
                },
            },
        });

        return NextResponse.json({ predictions });
    } catch (error) {
        console.error("Narrative history failed:", error);
        return NextResponse.json(
            { error: getValidationError(error, "Riwayat narasi gagal dimuat.") },
            { status: 400 }
        );
    }
}
