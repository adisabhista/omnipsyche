import "server-only";

import { GoogleGenAI } from "@google/genai";
import {
    getFallbackModel,
    getGeminiApiKey,
    getPrimaryModel,
    isAiFallbackEnabled,
} from "@/lib/ai-config";

export const AI_USER_ERROR_MESSAGE = "AI belum bisa digunakan. Periksa GEMINI_API_KEY atau model Gemini.";
export const MISSING_API_KEY_MESSAGE = "Konfigurasi Gemini API belum lengkap. Isi GEMINI_API_KEY di .env.local lalu restart server.";
export const INVALID_API_KEY_MESSAGE = "Konfigurasi Gemini API bermasalah atau API key tidak valid.";

const BOTH_MODELS_FAILED_MESSAGE = "Model AI utama dan fallback gagal digunakan.";

export type GeminiGenerationResult = {
    text: string;
    modelUsed: string;
    fallbackUsed: boolean;
    primaryError?: string;
};

export class AiGenerationError extends Error {
    public readonly publicMessage: string;
    public readonly safeReason?: string;

    constructor(message: string, publicMessage = AI_USER_ERROR_MESSAGE, safeReason?: string) {
        super(message);
        this.name = "AiGenerationError";
        this.publicMessage = publicMessage;
        this.safeReason = safeReason;
    }
}

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient() {
    if (geminiClient) return geminiClient;

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        throw new AiGenerationError(MISSING_API_KEY_MESSAGE, MISSING_API_KEY_MESSAGE, MISSING_API_KEY_MESSAGE);
    }

    geminiClient = new GoogleGenAI({ apiKey });
    return geminiClient;
}

function getErrorStatus(error: unknown) {
    if (!error || typeof error !== "object") return undefined;
    const withStatus = error as { status?: unknown; code?: unknown };
    return withStatus.status ?? withStatus.code;
}

export function safeErrorMessage(error: unknown) {
    const status = getErrorStatus(error);
    const rawMessage = error instanceof Error ? error.message : String(error);
    let message = [status ? `status=${String(status)}` : "", rawMessage]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
        message = message.split(apiKey).join("[REDACTED]");
    }

    message = message.replace(/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED_API_KEY]");
    message = message.replace(/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g, "[REDACTED_SECRET]");

    return message.length > 500 ? `${message.slice(0, 500)}...` : message;
}

export function isModelAvailabilityError(error: unknown) {
    const status = getErrorStatus(error);
    const message = safeErrorMessage(error).toLowerCase();

    return status === 404 ||
        status === "404" ||
        message.includes("404") ||
        message.includes("not_found") ||
        message.includes("model was not found") ||
        message.includes("model not found") ||
        message.includes("was not found") ||
        message.includes("not supported") ||
        message.includes("not available") ||
        message.includes("does not have access");
}

function isGeminiAuthError(error: unknown) {
    const message = safeErrorMessage(error).toLowerCase();

    return message.includes("api key not valid") ||
        message.includes("invalid api key") ||
        message.includes("invalid credentials") ||
        message.includes("unauthenticated");
}

export function isAiGenerationError(error: unknown): error is AiGenerationError {
    return error instanceof AiGenerationError;
}

async function generateTextWithModel(model: string, prompt: string) {
    const response = await getGeminiClient().models.generateContent({
        model,
        contents: prompt,
    });
    const text = response.text;

    if (!text) {
        throw new AiGenerationError("AI returned an empty response.", AI_USER_ERROR_MESSAGE, "AI returned an empty response.");
    }

    return text;
}

export async function generateGeminiText(
    prompt: string,
    options: { model?: string; feature?: string } = {}
): Promise<GeminiGenerationResult> {
    const primaryModel = options.model || getPrimaryModel();
    const fallbackModel = getFallbackModel();
    const fallbackEnabled = isAiFallbackEnabled();
    const feature = options.feature;

    if (process.env.NODE_ENV === "development") {
        console.log("Gemini API generation:", {
            feature,
            primaryModel,
            fallbackModel,
            fallbackEnabled,
        });
    }

    try {
        const text = await generateTextWithModel(primaryModel, prompt);
        return {
            text,
            modelUsed: primaryModel,
            fallbackUsed: false,
        };
    } catch (primaryError) {
        if (primaryError instanceof AiGenerationError) {
            throw primaryError;
        }

        const safePrimaryErrorMessage = safeErrorMessage(primaryError);
        if (isGeminiAuthError(primaryError)) {
            throw new AiGenerationError(
                INVALID_API_KEY_MESSAGE,
                INVALID_API_KEY_MESSAGE,
                safePrimaryErrorMessage
            );
        }

        const shouldFallback = fallbackEnabled && primaryModel !== fallbackModel && isModelAvailabilityError(primaryError);

        if (!shouldFallback) {
            throw new AiGenerationError(AI_USER_ERROR_MESSAGE, AI_USER_ERROR_MESSAGE, safePrimaryErrorMessage);
        }

        try {
            const text = await generateTextWithModel(fallbackModel, prompt);

            if (process.env.NODE_ENV === "development") {
                console.warn("Gemini primary model failed; fallback used:", {
                    feature,
                    primaryModel,
                    fallbackModel,
                    reason: safePrimaryErrorMessage,
                });
            }

            return {
                text,
                modelUsed: fallbackModel,
                fallbackUsed: true,
                primaryError: safePrimaryErrorMessage,
            };
        } catch (fallbackError) {
            throw new AiGenerationError(
                BOTH_MODELS_FAILED_MESSAGE,
                AI_USER_ERROR_MESSAGE,
                `${safePrimaryErrorMessage}; fallback: ${safeErrorMessage(fallbackError)}`
            );
        }
    }
}
