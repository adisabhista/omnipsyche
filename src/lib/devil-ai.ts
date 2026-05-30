import "server-only";

import {
    checkTestResponseSchema,
    devilNewTestResponseSchema,
    type CheckTestResponse,
} from "@/lib/devil-ai-schema";
import { z } from "zod";

const CONFIG_MISSING_MESSAGE = "Konfigurasi Devil.ai belum lengkap.";
const UNREACHABLE_MESSAGE = "Gagal menghubungi Devil.ai.";
const INVALID_RESPONSE_MESSAGE = "Respons Devil.ai tidak sesuai format.";

interface DevilAiConfig {
    apiKey: string;
    baseUrl: string;
}

interface DevilAiRawResponse {
    json: unknown;
    httpStatus: number;
    ok: boolean;
    contentType: string | null;
    rawText: string;
}

export function getDevilAiConfig(): DevilAiConfig | null {
    const apiKey = process.env.DEVIL_AI_API_KEY?.trim();
    const baseUrl = (process.env.DEVIL_AI_BASE_URL || "https://api.devil.ai/v1").replace(/\/$/, "");

    if (!apiKey) return null;

    return { apiKey, baseUrl };
}

function logDevilAiDiagnostic(
    label: string,
    details: {
        httpStatus: number;
        ok: boolean;
        contentType: string | null;
        zodIssues?: z.ZodIssue[];
    },
) {
    if (process.env.NODE_ENV !== "development") return;

    console.error(label, {
        httpStatus: details.httpStatus,
        ok: details.ok,
        contentType: details.contentType,
        zodIssues: details.zodIssues,
    });
}

function errorMessageForStatus(status: number): string {
    if (status === 401 || status === 403) {
        return "API key Devil.ai tidak valid atau tidak memiliki akses.";
    }

    if (status === 429) {
        return "Limit Devil.ai tercapai. Coba lagi nanti.";
    }

    return UNREACHABLE_MESSAGE;
}

function sortRecordValuesByKey(record: Record<string, string>): string[] {
    return Object.entries(record)
        .sort(([a], [b]) => {
            const numericA = Number(a);
            const numericB = Number(b);

            if (Number.isFinite(numericA) && Number.isFinite(numericB)) {
                return numericA - numericB;
            }

            return a.localeCompare(b);
        })
        .map(([, value]) => value);
}

function stripHtmlTags(value: string): string {
    return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function normalizeDevilMatches(matches: unknown): string[] {
    if (Array.isArray(matches)) {
        return matches
            .filter((match): match is string => typeof match === "string")
            .map(stripHtmlTags)
            .filter(Boolean);
    }

    if (matches && typeof matches === "object") {
        return sortRecordValuesByKey(matches as Record<string, string>)
            .filter((match): match is string => typeof match === "string")
            .map(stripHtmlTags)
            .filter(Boolean);
    }

    return [];
}

async function requestDevilAi(
    config: DevilAiConfig,
    endpoint: string,
    params: Record<string, string>,
): Promise<DevilAiRawResponse> {
    const url = new URL(`${config.baseUrl}/${endpoint}`);
    url.searchParams.set("api_key", config.apiKey);

    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }

    let res: Response;
    try {
        res = await fetch(url, {
            method: "POST",
        });
    } catch {
        throw new Error(UNREACHABLE_MESSAGE);
    }

    const contentType = res.headers.get("content-type");
    const rawText = await res.text();

    if (!res.ok) {
        throw new Error(errorMessageForStatus(res.status));
    }

    let json: unknown;
    try {
        json = JSON.parse(rawText);
    } catch {
        logDevilAiDiagnostic("Devil.ai response JSON parse failed:", {
            httpStatus: res.status,
            ok: res.ok,
            contentType,
        });
        throw new Error(INVALID_RESPONSE_MESSAGE);
    }

    return {
        json,
        httpStatus: res.status,
        ok: res.ok,
        contentType,
        rawText,
    };
}

export async function createDevilAiTest(
    name: string,
    options?: { askGender?: boolean; askAge?: boolean },
): Promise<{ testId: string; testUrl: string }> {
    const config = getDevilAiConfig();
    if (!config) throw new Error(CONFIG_MISSING_MESSAGE);

    if (process.env.NODE_ENV === "development") {
        console.info("Calling Devil.ai new_test", {
            baseUrl: config.baseUrl,
        });
    }

    const lang = process.env.DEVIL_AI_LANG?.trim() || "en";
    const params: Record<string, string> = {
        name_of_tester: name,
    };

    if (lang) {
        params.lang = lang;
    }

    if (options?.askGender === true) {
        params.ask_gender = "1";
    }
    if (options?.askAge === true) {
        params.ask_age = "1";
    }

    const raw = await requestDevilAi(config, "new_test", params);

    const parsed = devilNewTestResponseSchema.safeParse(raw.json);
    if (!parsed.success) {
        logDevilAiDiagnostic("Devil.ai new_test schema validation failed:", {
            httpStatus: raw.httpStatus,
            ok: raw.ok,
            contentType: raw.contentType,
            zodIssues: parsed.error.issues,
        });
        throw new Error(INVALID_RESPONSE_MESSAGE);
    }

    return {
        testId: parsed.data.data.test_id,
        testUrl: parsed.data.data.test_url,
    };
}

export async function checkMbtiTest(testId: string): Promise<CheckTestResponse> {
    const config = getDevilAiConfig();
    if (!config) throw new Error(CONFIG_MISSING_MESSAGE);

    const raw = await requestDevilAi(config, "check_test", {
        test_id: testId,
    });

    const parsed = checkTestResponseSchema.safeParse(raw.json);
    if (!parsed.success) {
        logDevilAiDiagnostic("Devil.ai check_test schema validation failed:", {
            httpStatus: raw.httpStatus,
            ok: raw.ok,
            contentType: raw.contentType,
            zodIssues: parsed.error.issues,
        });
        throw new Error(INVALID_RESPONSE_MESSAGE);
    }

    const data = parsed.data.data;
    const prediction = data?.prediction;

    if (!prediction) {
        return {
            completed: false,
            test_id: data?.test_id ?? testId,
        };
    }

    return {
        completed: true,
        prediction,
        predictions: data?.predictions,
        trait_order_conscious: data?.trait_order_conscious
            ? sortRecordValuesByKey(data.trait_order_conscious)
            : [],
        trait_order_shadow: data?.trait_order_shadow
            ? sortRecordValuesByKey(data.trait_order_shadow)
            : [],
        matches: normalizeDevilMatches(data?.matches),
        results_page: data?.results_page,
        result_date: data?.result_date,
        test_id: data?.test_id ?? testId,
    };
}

export const checkDevilAiTest = checkMbtiTest;
