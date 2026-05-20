import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { analyzeRequestSchema, getValidationError, isValidationError } from "@/lib/api-validation";
import { NOT_FOUND_MESSAGE, requireCurrentUserId } from "@/lib/current-user";
import { profileToCreateInput, storedProfileToUserProfile } from "@/lib/profile-storage";
import { generatePersonalitySynthesis, getConfiguredVertexModel } from "@/lib/vertex-ai";
import { personalityAnalysisSchema, type PersonalityAnalysis } from "@/lib/personality-json-schema";
import { buildNormalizedInput, cleanAndParseJSON, parsedJsonToMarkdown } from "@/lib/personality-parser";
import { buildPersonalityPrompt } from "@/lib/personality-prompt";

export async function POST(req: Request) {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const body = await req.json();
        const payload = analyzeRequestSchema.parse(body);
        const storedProfile = "profileId" in payload
            ? await prisma.userProfile.findFirst({ where: { id: payload.profileId, userId: authResult.userId } })
            : await prisma.userProfile.create({ data: profileToCreateInput(payload.profile, authResult.userId) });

        if (!storedProfile) {
            return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
        }

        const profile = storedProfileToUserProfile(storedProfile);
        const normalized = buildNormalizedInput(profile);
        const prompt = buildPersonalityPrompt(normalized);

        let rawResponse = "";
        let parsedJson: PersonalityAnalysis | null = null;
        let validationErrorMsg = "";

        try {
            rawResponse = await generatePersonalitySynthesis(prompt);
            const parsedObj = cleanAndParseJSON(rawResponse);
            parsedJson = personalityAnalysisSchema.parse(parsedObj);
        } catch (err: unknown) {
            console.warn("Initial AI response validation failed, attempting repair. Error:", err);
            validationErrorMsg = err instanceof Error ? err.message : String(err);
            
            // Single retry with repair prompt
            const repairPrompt = `Perbaiki output berikut agar menjadi JSON valid sesuai schema. Jangan ubah substansi data.

Keluaran yang tidak valid:
${rawResponse}

Pesan Error:
${validationErrorMsg}

JANGAN sertakan tag markdown atau teks apa pun di luar JSON. Kembalikan HANYA JSON valid.`;

            try {
                const repairResponse = await generatePersonalitySynthesis(repairPrompt);
                const parsedObj = cleanAndParseJSON(repairResponse);
                parsedJson = personalityAnalysisSchema.parse(parsedObj);
            } catch (retryErr) {
                console.error("Repair retry failed:", retryErr);
                throw new Error("Gagal memvalidasi output analisis kepribadian.");
            }
        }

        // Dynamically build backward compatible markdown from the structured JSON
        const markdownText = parsedJsonToMarkdown(parsedJson, storedProfile.name);
        const model = getConfiguredVertexModel();

        const analysis = await prisma.analysisResult.create({
            data: {
                userId: authResult.userId,
                profileId: storedProfile.id,
                markdown: markdownText,
                model,
                inputSnapshot: profile as unknown as Prisma.InputJsonValue,
                parsedJson: parsedJson as unknown as Prisma.InputJsonValue,
            },
        });

        return NextResponse.json({
            analysisId: analysis.id,
            profileId: storedProfile.id,
            model,
            createdAt: analysis.createdAt,
            profileJson: parsedJson,
            markdown: markdownText,
        });
    } catch (error: unknown) {
        console.error("Error analyzing profile:", error);
        const message = getValidationError(error, "Analisis gagal dibuat.");
        return NextResponse.json(
            { error: message },
            { status: isValidationError(error) ? 400 : 500 }
        );
    }
}
