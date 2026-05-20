import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidationError, listQuerySchema, profileRequestSchema } from "@/lib/api-validation";
import { requireCurrentUserId } from "@/lib/current-user";
import { profileToCreateInput, serializeProfile } from "@/lib/profile-storage";

export async function POST(req: Request) {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const body = await req.json();
        const profile = profileRequestSchema.parse(body);
        const created = await prisma.userProfile.create({
            data: profileToCreateInput(profile, authResult.userId),
        });

        return NextResponse.json(serializeProfile(created), { status: 201 });
    } catch (error) {
        console.error("Profile create failed:", error);
        return NextResponse.json(
            { error: getValidationError(error, "Profil gagal dibuat.") },
            { status: 400 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const { searchParams } = new URL(req.url);
        const query = listQuerySchema.parse(Object.fromEntries(searchParams));
        const profiles = await prisma.userProfile.findMany({
            where: { userId: authResult.userId },
            take: query.limit,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            profiles: profiles.map(serializeProfile),
        });
    } catch (error) {
        console.error("Profile list failed:", error);
        return NextResponse.json(
            { error: getValidationError(error, "Profil gagal dimuat.") },
            { status: 400 }
        );
    }
}
