import "server-only";

import { getPrimaryModel } from "@/lib/ai-config";
import { generateTextWithFallback } from "@/lib/ai-generate";

// Legacy name; now uses Gemini API, not Vertex AI.
export function getConfiguredVertexModel() {
    return getPrimaryModel();
}

export async function generatePersonalitySynthesis(prompt: string): Promise<string> {
    return (await generateTextWithFallback(prompt, { feature: "analysis" })).text;
}

export async function generateNarrativePrediction(prompt: string): Promise<string> {
    return (await generateTextWithFallback(prompt, { feature: "narrative-prediction" })).text;
}

export async function generateProfileValidation(prompt: string): Promise<string> {
    return (await generateTextWithFallback(prompt, { feature: "profile-validation" })).text;
}

export async function generateTipologiExploration(prompt: string): Promise<string> {
    return (await generateTextWithFallback(prompt, { feature: "tipologi-exploration" })).text;
}
