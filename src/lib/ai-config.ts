import "server-only";

export type AiProvider = "gemini-api";

const DEFAULT_PRIMARY_MODEL = "gemini-3.5-flash";
const DEFAULT_FALLBACK_MODEL = "gemini-2.5-flash";

function readEnv(name: string) {
    const value = process.env[name];
    return value && value.trim().length > 0 ? value.trim() : undefined;
}

export function getAiProvider(): AiProvider {
    return "gemini-api";
}

export function getPrimaryModel() {
    return readEnv("GEMINI_API_PRIMARY_MODEL") ||
        readEnv("GEMINI_PERSONALITY_MODEL") ||
        DEFAULT_PRIMARY_MODEL;
}

export function getFallbackModel() {
    return readEnv("GEMINI_API_FALLBACK_MODEL") || DEFAULT_FALLBACK_MODEL;
}

export function isAiFallbackEnabled() {
    return readEnv("ENABLE_AI_MODEL_FALLBACK")?.toLowerCase() !== "false";
}

export function getGeminiApiKey() {
    return readEnv("GEMINI_API_KEY");
}
