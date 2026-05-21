import "server-only";

import { GoogleGenAI } from "@google/genai";

const DEFAULT_LOCATION = "us-central1";
const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_USE_VERTEX_AI = "true";
const MISSING_PROJECT_MESSAGE = "Konfigurasi Vertex AI belum lengkap. Isi GOOGLE_VERTEX_AI_PROJECT_ID atau GOOGLE_CLOUD_PROJECT di .env.local, lalu restart server.";
const DISABLED_VERTEX_AI_MESSAGE = "Konfigurasi Vertex AI belum lengkap. Isi GOOGLE_GENAI_USE_VERTEXAI=true di .env.local, lalu restart server.";
const MODEL_NOT_FOUND_MESSAGE = "Model Vertex AI tidak ditemukan atau belum tersedia di project/region ini. Gunakan gemini-2.5-flash atau gemini-2.0-flash.";

let client: GoogleGenAI | null = null;

function getVertexConfig() {
    const project = process.env.GOOGLE_VERTEX_AI_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT_ID;
    const useVertexAi = process.env.GOOGLE_GENAI_USE_VERTEXAI || DEFAULT_USE_VERTEX_AI;

    if (!project) {
        throw new Error(MISSING_PROJECT_MESSAGE);
    }

    if (useVertexAi.toLowerCase() !== "true") {
        throw new Error(DISABLED_VERTEX_AI_MESSAGE);
    }

    return {
        project,
        location: process.env.GOOGLE_VERTEX_AI_LOCATION || process.env.GOOGLE_CLOUD_LOCATION || DEFAULT_LOCATION,
        model: process.env.GEMINI_PERSONALITY_MODEL || process.env.VERTEX_AI_MODEL || DEFAULT_MODEL,
    };
}

export function getConfiguredVertexModel() {
    return getVertexConfig().model;
}

function getClient() {
    if (client) {
        return client;
    }

    const { project, location } = getVertexConfig();

    client = new GoogleGenAI({
        vertexai: true,
        project,
        location,
    });

    return client;
}

function isModelNotFoundError(error: unknown) {
    if (!(error instanceof Error)) {
        return false;
    }

    const errorWithStatus = error as Error & { status?: unknown; code?: unknown };
    const status = errorWithStatus.status || errorWithStatus.code;
    const message = error.message.toLowerCase();

    return status === 404 ||
        status === "404" ||
        message.includes("not_found") ||
        message.includes("was not found") ||
        message.includes("model") && message.includes("not found");
}

async function generateText(prompt: string) {
    const { model } = getVertexConfig();
    let response;

    try {
        response = await getClient().models.generateContent({
            model,
            contents: prompt,
        });
    } catch (error) {
        if (isModelNotFoundError(error)) {
            throw new Error(MODEL_NOT_FOUND_MESSAGE);
        }

        throw error;
    }

    const text = response.text;

    if (!text) {
        throw new Error("Vertex AI returned an empty response.");
    }

    return text;
}

export async function generatePersonalitySynthesis(prompt: string): Promise<string> {
    return generateText(prompt);
}

export async function generateNarrativePrediction(prompt: string): Promise<string> {
    return generateText(prompt);
}

export async function generateProfileValidation(prompt: string): Promise<string> {
    return generateText(prompt);
}

export async function generateTipologiExploration(prompt: string): Promise<string> {
    return generateText(prompt);
}
