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
        const analyses = await prisma.analysisResult.findMany({
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
                        enneagramType: true,
                    },
                },
            },
        });

        return NextResponse.json({ analyses });
    } catch (error) {
        console.error("Analysis list failed:", error);
        return NextResponse.json(
            { error: getValidationError(error, "Analisis gagal dimuat.") },
            { status: 400 }
        );
    }
}
