import { NextResponse } from "next/server";
import { requireCurrentUserId } from "@/lib/current-user";
import { generateAndSaveProfileValidation } from "@/lib/profile-validation-service";

export async function POST() {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const result = await generateAndSaveProfileValidation(authResult.userId);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json({ validation: result.validation });
    } catch (error) {
        console.error("Profile validation generation failed:", error);
        return NextResponse.json(
            { error: "Gagal memeriksa konsistensi profil." },
            { status: 500 }
        );
    }
}
