import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidationError, idParamSchema } from "@/lib/api-validation";
import { NOT_FOUND_MESSAGE, requireCurrentUserId } from "@/lib/current-user";
import { serializeProfile } from "@/lib/profile-storage";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const params = idParamSchema.parse(await context.params);
        const analysis = await prisma.analysisResult.findFirst({
            where: { id: params.id, userId: authResult.userId },
            include: { profile: true },
        });

        if (!analysis) {
            return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
        }

        return NextResponse.json({
            ...analysis,
            profile: serializeProfile(analysis.profile),
        });
    } catch (error) {
        console.error("Analysis read failed:", error);
        return NextResponse.json(
            { error: getValidationError(error, "Analisis gagal dimuat.") },
            { status: 400 }
        );
    }
}
