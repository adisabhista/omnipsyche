import { NextResponse } from "next/server";
import { requireCurrentUserId } from "@/lib/current-user";
import { getLiveProfileEvidenceSources } from "@/lib/profile-evidence-sources";
import { getLatestProfileValidation } from "@/lib/profile-validation-service";

export async function GET() {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const [validation, evidenceSources] = await Promise.all([
            getLatestProfileValidation(authResult.userId),
            getLiveProfileEvidenceSources(authResult.userId),
        ]);

        return NextResponse.json({ validation, evidenceSources });
    } catch (error) {
        console.error("Profile validation latest load failed:", error);
        return NextResponse.json(
            { error: "Gagal memuat konsistensi profil." },
            { status: 500 }
        );
    }
}
