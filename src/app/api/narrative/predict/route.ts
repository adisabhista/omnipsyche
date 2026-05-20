import { NextResponse } from "next/server";
import { getValidationError, narrativeRequestSchema } from "@/lib/api-validation";
import { requireCurrentUserId } from "@/lib/current-user";
import { createNarrativePrediction } from "@/lib/narrative-prediction";

export async function POST(req: Request) {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const body = await req.json();
        const payload = narrativeRequestSchema.parse(body);
        const result = await createNarrativePrediction(payload.text, authResult.userId, payload.profileId);

        return NextResponse.json({
            ...result.prediction,
            narrativePredictionId: result.narrativePredictionId,
            profileId: result.profileId,
            model: result.model,
            createdAt: result.createdAt,
        });
    } catch (error) {
        console.error("Narrative prediction failed:", error);
        const message = error instanceof SyntaxError
            ? "Respons narasi dari AI tidak valid."
            : getValidationError(error, error instanceof Error ? error.message : "Prediksi narasi gagal dibuat.");

        return NextResponse.json({ error: message }, { status: 400 });
    }
}
