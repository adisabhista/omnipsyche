import { z } from "zod";

const optionalContextSchema = z.object({
    currentProfile: z.unknown().optional(),
    settings: z.unknown().optional(),
    latestAnalysis: z.unknown().optional(),
}).partial().optional();

export const tipologiExploreRequestSchema = z.object({
    system: z.string().trim().min(1, "Sistem tipologi wajib diisi."),
    typeCode: z.string().trim().min(1, "Kode tipe wajib diisi."),
    typeName: z.string().trim().min(1, "Nama tipe wajib diisi."),
    description: z.string().trim().min(1, "Deskripsi tipe wajib diisi."),
    mistypeWith: z.array(z.string().trim().min(1)).max(8).default([]),
    userText: z.string().trim().max(1200).optional(),
    userContext: optionalContextSchema,
});

export const tipologiExploreResponseSchema = z.object({
    response: z.string().trim().min(1),
    questions: z.array(z.string().trim().min(1)).min(1).max(3),
    distinction_focus: z.array(z.string().trim().min(1)).max(6).default([]),
    warnings: z.array(z.string().trim().min(1)).max(6).default([]),
});

export type TipologiExploreRequest = z.infer<typeof tipologiExploreRequestSchema>;
export type TipologiExploreResponse = z.infer<typeof tipologiExploreResponseSchema>;

export function countWords(text: string) {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

export function trimToWords(text: string, maxWords = 120) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return text.trim();

    return words.slice(0, maxWords).join(" ").replace(/[,.!?;:]+$/, "") + "?";
}
