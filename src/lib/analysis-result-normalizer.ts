export interface AnalysisResultLike {
    markdown?: string | null;
    profileJson?: unknown;
    parsedJson?: unknown;
    rawResponse?: unknown;
}

export interface NormalizedAnalysisResult {
    profileJson: object | null;
    markdown: string | null;
    compatibilityMode: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readObject(value: unknown): object | null {
    if (isRecord(value)) {
        const nested = value.profileJson ?? value.parsedJson ?? value.analysis ?? value.result;
        return isRecord(nested) ? nested : value;
    }

    if (typeof value !== "string") return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    try {
        const parsed = JSON.parse(trimmed);
        if (!isRecord(parsed)) return null;

        const nested = parsed.profileJson ?? parsed.parsedJson ?? parsed.analysis ?? parsed.result;
        return isRecord(nested) ? nested : parsed;
    } catch {
        return null;
    }
}

function readMarkdown(value: unknown) {
    return typeof value === "string" && value.trim() ? value : null;
}

export function normalizeAnalysisResult(analysis: AnalysisResultLike): NormalizedAnalysisResult {
    const profileJson = readObject(analysis.profileJson) ?? readObject(analysis.parsedJson) ?? readObject(analysis.rawResponse);
    const markdown = readMarkdown(analysis.markdown) ?? readMarkdown(analysis.rawResponse);

    return {
        profileJson,
        markdown,
        compatibilityMode: !profileJson && Boolean(markdown),
    };
}
