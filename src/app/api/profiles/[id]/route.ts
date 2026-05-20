import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidationError, idParamSchema, profilePatchRequestSchema } from "@/lib/api-validation";
import { NOT_FOUND_MESSAGE, requireCurrentUserId } from "@/lib/current-user";
import { profileToUpdateInput, serializeProfile } from "@/lib/profile-storage";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const params = idParamSchema.parse(await context.params);
        const profile = await prisma.userProfile.findFirst({
            where: { id: params.id, userId: authResult.userId },
            include: {
                analyses: { orderBy: { createdAt: "desc" } },
                narrativePredictions: { orderBy: { createdAt: "desc" } },
                careerInsights: { orderBy: { createdAt: "desc" } },
                bookInsights: { orderBy: { createdAt: "desc" } },
            },
        });

        if (!profile) {
            return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
        }

        return NextResponse.json({
            ...serializeProfile(profile),
            analyses: profile.analyses,
            narrativePredictions: profile.narrativePredictions,
            careerInsights: profile.careerInsights,
            bookInsights: profile.bookInsights,
        });
    } catch (error) {
        console.error("Profile read failed:", error);
        return NextResponse.json(
            { error: getValidationError(error, "Profil gagal dimuat.") },
            { status: 400 }
        );
    }
}

export async function PATCH(req: Request, context: RouteContext) {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const params = idParamSchema.parse(await context.params);
        const body = await req.json();
        const updates = profilePatchRequestSchema.parse(body);
        const existing = await prisma.userProfile.findFirst({ where: { id: params.id, userId: authResult.userId } });

        if (!existing) {
            return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
        }

        const updated = await prisma.userProfile.update({
            where: { id: params.id },
            data: profileToUpdateInput(updates, existing),
        });

        return NextResponse.json(serializeProfile(updated));
    } catch (error) {
        console.error("Profile update failed:", error);
        return NextResponse.json(
            { error: getValidationError(error, "Profil gagal diperbarui.") },
            { status: 400 }
        );
    }
}

export async function DELETE(_req: Request, context: RouteContext) {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const params = idParamSchema.parse(await context.params);
        const existing = await prisma.userProfile.findFirst({ where: { id: params.id, userId: authResult.userId } });

        if (!existing) {
            return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
        }

        await prisma.userProfile.delete({ where: { id: params.id } });
        return NextResponse.json({ deleted: true, profileId: params.id });
    } catch (error) {
        console.error("Profile delete failed:", error);
        return NextResponse.json(
            { error: getValidationError(error, "Profil gagal dihapus.") },
            { status: 400 }
        );
    }
}
