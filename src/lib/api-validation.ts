import { z } from "zod";

const enneagramValueSchema = z.union([z.number().int().min(1).max(9), z.literal("unknown")]);

export const bigFiveSchema = z.union([
    z.literal("unknown"),
    z.object({
        openness: z.number().min(0).max(100),
        conscientiousness: z.number().min(0).max(100),
        extraversion: z.number().min(0).max(100),
        agreeableness: z.number().min(0).max(100),
        neuroticism: z.number().min(0).max(100),
    }),
]);

export const profileSchema = z.object({
    name: z.string().trim().min(1, "Nama wajib diisi."),
    bigFive: bigFiveSchema.default("unknown"),
    mbti: z.string().trim().default("unknown"),
    enneagram: z.object({
        type: enneagramValueSchema.default("unknown"),
        wing: enneagramValueSchema.default("unknown"),
        tritype: z.string().trim().default(""),
    }).default({ type: "unknown", wing: "unknown", tritype: "" }),
    attitudinalPsyche: z.string().trim().default("unknown"),
    instinctualVariant: z.string().trim().default("unknown"),
    socionics: z.string().trim().default("unknown"),
    temperament: z.string().trim().default("unknown"),
    riasec: z.string().trim().default(""),
});

export const partialProfileSchema = profileSchema.partial().extend({
    enneagram: profileSchema.shape.enneagram.optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type PartialProfileInput = z.infer<typeof partialProfileSchema>;

export const profileRequestSchema = z.union([
    profileSchema,
    z.object({ profile: profileSchema }),
]).transform((value) => "profile" in value ? value.profile : value);

export const profilePatchRequestSchema = z.union([
    partialProfileSchema,
    z.object({ profile: partialProfileSchema }),
]).transform((value) => "profile" in value ? value.profile : value);

export const analyzeRequestSchema = z.union([
    z.object({ profileId: z.string().min(1, "ID profil wajib diisi.") }),
    z.object({ profile: profileSchema }),
]);

export const narrativeRequestSchema = z.object({
    text: z.string().trim().min(1, "Teks narasi wajib diisi."),
    profileId: z.string().min(1).optional(),
});

export const registerRequestSchema = z.object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter."),
    email: z.string().trim().email("Email tidak valid.").toLowerCase(),
    password: z.string().min(8, "Kata sandi minimal 8 karakter."),
});

export const loginRequestSchema = z.object({
    email: z.string().trim().email("Email tidak valid.").toLowerCase(),
    password: z.string().min(1, "Kata sandi wajib diisi."),
});

export const bookStatusSchema = z.enum(["owned", "reading", "finished", "wishlist"]);

export const bookLookupRequestSchema = z.object({
    title: z.string().trim().min(1, "Judul buku wajib diisi."),
    author: z.string().trim().optional(),
});

export const bookCollectionCreateSchema = z.object({
    title: z.string().trim().min(1, "Judul buku wajib diisi."),
    author: z.string().trim().optional(),
    description: z.string().trim().optional(),
    categories: z.array(z.string().trim().min(1)).optional(),
    thumbnail: z.string().trim().url("URL sampul tidak valid.").optional(),
    isbn10: z.string().trim().optional(),
    isbn13: z.string().trim().optional(),
    publishedAt: z.string().trim().optional(),
    source: z.string().trim().optional(),
    sourceId: z.string().trim().optional(),
    status: bookStatusSchema.default("owned"),
});

export const bookCollectionUpdateSchema = z.object({
    status: bookStatusSchema.optional(),
    rating: z.number().int().min(1, "Rating minimal 1.").max(5, "Rating maksimal 5.").nullable().optional(),
    notes: z.string().trim().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, {
    message: "Tidak ada data yang diperbarui.",
});

export const idParamSchema = z.object({
    id: z.string().min(1, "ID wajib diisi."),
});

export const listQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    profileId: z.string().min(1).optional(),
});

export function getValidationError(error: unknown, fallback = "Data permintaan tidak valid.") {
    if (error instanceof z.ZodError) {
        return error.issues[0]?.message || fallback;
    }

    return fallback;
}

export function isValidationError(error: unknown) {
    return error instanceof z.ZodError;
}
