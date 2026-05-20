import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidationError, profileRequestSchema } from "@/lib/api-validation";
import { requireCurrentUserId } from "@/lib/current-user";
import { profileToCreateInput, profileToUpdateInput, serializeProfile } from "@/lib/profile-storage";

export async function GET() {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const profile = await prisma.userProfile.findFirst({
            where: { userId: authResult.userId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(profile ? serializeProfile(profile) : null);
    } catch (error) {
        console.error("GET /api/profiles/current failed:", error);
        return NextResponse.json(
            { error: "Gagal memuat profil aktif." },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const body = await req.json();
        const profileInput = profileRequestSchema.parse(body);

        const existing = await prisma.userProfile.findFirst({
            where: { userId: authResult.userId },
            orderBy: { createdAt: "desc" },
        });

        if (existing) {
            const updated = await prisma.userProfile.update({
                where: { id: existing.id },
                data: profileToUpdateInput(profileInput, existing),
            });
            return NextResponse.json(serializeProfile(updated));
        } else {
            const created = await prisma.userProfile.create({
                data: profileToCreateInput(profileInput, authResult.userId),
            });
            return NextResponse.json(serializeProfile(created), { status: 201 });
        }
    } catch (error) {
        console.error("PUT /api/profiles/current failed:", error);
        return NextResponse.json(
            { error: getValidationError(error, "Profil gagal disimpan.") },
            { status: 400 }
        );
    }
}
