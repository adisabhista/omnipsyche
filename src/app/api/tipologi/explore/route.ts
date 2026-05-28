import { NextResponse } from "next/server";
import { getValidationError } from "@/lib/api-validation";
import { generateTextWithFallback, isAiGenerationError } from "@/lib/ai-generate";
import { getLatestUserAnalysis, getLatestUserProfile } from "@/lib/analysis-data";
import { getCurrentUserId } from "@/lib/current-user";
import { cleanAndParseJSON } from "@/lib/personality-parser";
import { buildTipologiExplorePrompt, buildTipologiExploreRepairPrompt } from "@/lib/tipologi-explore-prompt";
import {
    countWords,
    tipologiExploreRequestSchema,
    tipologiExploreResponseSchema,
    trimToWords,
    type TipologiExploreRequest,
    type TipologiExploreResponse,
} from "@/lib/tipologi-explore-schema";

const INVALID_MESSAGE = "Eksplorasi tipe gagal dibuat.";
const BANNED_PHRASES = [
    "kamu pasti tipe ini",
    "tipe kamu benar",
    "tipe kamu salah",
    "ai membuktikan",
];

function ensureQuestionEnding(response: TipologiExploreResponse) {
    const text = response.response.trim();
    if (/[?？]\s*$/.test(text)) return response;

    const fallbackQuestion = response.questions[0] || "Pengalaman nyata apa yang paling membuatmu merasa tipe ini cocok?";
    return {
        ...response,
        response: `${text} ${fallbackQuestion}`.trim(),
    };
}

function enforceSafety(response: TipologiExploreResponse) {
    const warnings = [...response.warnings];
    let safeResponse = response.response.trim();
    const lower = safeResponse.toLowerCase();

    if (BANNED_PHRASES.some((phrase) => lower.includes(phrase))) {
        safeResponse = safeResponse.replace(/kamu pasti tipe ini/gi, "pola ini belum cukup untuk menyimpulkan");
        safeResponse = safeResponse.replace(/tipe kamu benar/gi, "data ini masih perlu dicek dari pengalaman nyata");
        safeResponse = safeResponse.replace(/tipe kamu salah/gi, "pembeda ini perlu dilihat lebih hati-hati");
        safeResponse = safeResponse.replace(/AI membuktikan/gi, "eksplorasi ini hanya memberi hipotesis");
        warnings.push("Respons AI disesuaikan agar tidak mengonfirmasi tipe secara absolut.");
    }

    const questionSafe = ensureQuestionEnding({
        ...response,
        response: safeResponse,
        questions: response.questions.slice(0, 3),
        distinction_focus: response.distinction_focus.slice(0, 6),
        warnings: Array.from(new Set(warnings)).slice(0, 6),
    });

    return {
        ...questionSafe,
        response: countWords(questionSafe.response) > 120
            ? trimToWords(questionSafe.response, 120)
            : questionSafe.response,
    };
}

function parseExploration(text: string) {
    return tipologiExploreResponseSchema.parse(cleanAndParseJSON(text));
}

async function buildContext() {
    const userId = await getCurrentUserId();
    if (!userId) {
        return { profile: null, analysis: null };
    }

    const [profile, analysis] = await Promise.all([
        getLatestUserProfile(userId),
        getLatestUserAnalysis(userId),
    ]);

    return {
        profile: profile
            ? {
                name: profile.name,
                mbti: profile.mbti,
                enneagramType: profile.enneagramType,
                enneagramWing: profile.enneagramWing,
                enneagramTritype: profile.enneagramTritype,
                instinctualVariant: profile.instinctualVariant,
                socionics: profile.socionics,
                attitudinalPsyche: profile.attitudinalPsyche,
                riasec: profile.riasec,
                bigFive: profile.bigFive,
            }
            : null,
        analysis: analysis
            ? {
                parsedJson: analysis.parsedJson,
                markdown: analysis.markdown.slice(0, 1200),
                createdAt: analysis.createdAt,
            }
            : null,
    };
}

async function createExploration(payload: TipologiExploreRequest) {
    const context = await buildContext();
    let rawResponse = "";

    try {
        const generationResult = await generateTextWithFallback(buildTipologiExplorePrompt({
            payload,
            profileContext: context.profile,
            analysisContext: context.analysis,
        }), { feature: "tipologi-exploration" });
        rawResponse = generationResult.text;
        let parsed = parseExploration(rawResponse);

        if (countWords(parsed.response) > 120) {
            const repaired = await generateTextWithFallback(buildTipologiExploreRepairPrompt({
                payload,
                validationError: "Field response melebihi 120 kata.",
                previousResponse: rawResponse,
            }), { feature: "tipologi-exploration-repair" });
            parsed = parseExploration(repaired.text);
        }

        return enforceSafety({
            ...parsed,
            response: trimToWords(parsed.response, 120),
        });
    } catch (firstError) {
        if (isAiGenerationError(firstError)) {
            throw firstError;
        }

        const validationMessage = firstError instanceof Error ? firstError.message : String(firstError);
        const repaired = await generateTextWithFallback(buildTipologiExploreRepairPrompt({
            payload,
            validationError: validationMessage,
            previousResponse: rawResponse,
        }), { feature: "tipologi-exploration-repair" });
        const parsed = parseExploration(repaired.text);

        return enforceSafety({
            ...parsed,
            response: trimToWords(parsed.response, 120),
        });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const payload = tipologiExploreRequestSchema.parse(body);
        const result = await createExploration(payload);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Tipologi exploration failed:", error);
        const message = isAiGenerationError(error)
            ? error.publicMessage
            : error instanceof SyntaxError
            ? "Data permintaan eksplorasi tidak valid."
            : getValidationError(error, error instanceof Error ? error.message : INVALID_MESSAGE);

        return NextResponse.json({ error: message }, { status: isAiGenerationError(error) ? 500 : 400 });
    }
}
