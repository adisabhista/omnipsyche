import "server-only";

import {
    AI_USER_ERROR_MESSAGE,
    AiGenerationError,
    generateGeminiText,
    isAiGenerationError,
    isModelAvailabilityError,
    safeErrorMessage,
} from "@/lib/gemini-api";
import { getAiProvider, type AiProvider } from "@/lib/ai-config";

export {
    AI_USER_ERROR_MESSAGE,
    AiGenerationError,
    isAiGenerationError,
    isModelAvailabilityError,
    safeErrorMessage,
};

export type AiGenerationResult = {
    text: string;
    modelUsed: string;
    provider: AiProvider;
    fallbackUsed: boolean;
    primaryError?: string;
};

export async function generateTextWithFallback(
    prompt: string,
    options: { feature?: string } = {}
): Promise<AiGenerationResult> {
    const result = await generateGeminiText(prompt, options);

    return {
        ...result,
        provider: getAiProvider(),
    };
}

export async function generatePersonalitySynthesis(prompt: string) {
    const result = await generateTextWithFallback(prompt, { feature: "legacy-personality-synthesis" });
    return result.text;
}
