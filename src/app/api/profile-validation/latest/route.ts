import { NextResponse } from "next/server";
import { requireCurrentUserId } from "@/lib/current-user";
import { getLatestProfileValidation } from "@/lib/profile-validation-service";

export async function GET() {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const validation = await getLatestProfileValidation(authResult.userId);

        return NextResponse.json({ validation });
    } catch (error) {
        console.error("Profile validation latest load failed:", error);
        return NextResponse.json(
            { error: "Gagal memuat validasi profil." },
            { status: 500 }
        );
    }
}
