import { z } from "zod";

export const themeModeSchema = z.enum(["light", "dark", "system"]);

const optionalTextSchema = z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().nullable().optional()
);

const optionalNumberSchema = z.preprocess(
    (value) => {
        if (value === "" || value === null || value === undefined) return null;
        if (typeof value === "string") return Number(value);
        return value;
    },
    z.number().int().min(1900, "Tahun lahir tidak valid.").max(new Date().getFullYear(), "Tahun lahir tidak valid.").nullable().optional()
);

export const settingsPayloadSchema = z.object({
    themeMode: themeModeSchema.default("system"),
    displayName: optionalTextSchema,
    birthYear: optionalNumberSchema,
    ageRange: optionalTextSchema,
    gender: optionalTextSchema,
    location: optionalTextSchema,
    shortBio: optionalTextSchema,
    educationLevel: optionalTextSchema,
    fieldOfStudy: optionalTextSchema,
    institution: optionalTextSchema,
    graduationStatus: optionalTextSchema,
    learningGoals: z.array(z.string().trim().min(1)).default([]),
    currentStatus: optionalTextSchema,
    currentRole: optionalTextSchema,
    targetCareer: optionalTextSchema,
    careerInterests: z.array(z.string().trim().min(1)).default([]),
    preferredWorkStyle: optionalTextSchema,
    hobbies: z.array(z.string().trim().min(1)).default([]),
    interests: z.array(z.string().trim().min(1)).default([]),
    favoriteTopics: z.array(z.string().trim().min(1)).default([]),
    favoriteBookGenres: z.array(z.string().trim().min(1)).default([]),
    skillsToImprove: z.array(z.string().trim().min(1)).default([]),
    dislikedTopics: z.array(z.string().trim().min(1)).default([]),
});

export type SettingsPayload = z.infer<typeof settingsPayloadSchema>;

export const defaultSettings: SettingsPayload = {
    themeMode: "system",
    displayName: null,
    birthYear: null,
    ageRange: null,
    gender: null,
    location: null,
    shortBio: null,
    educationLevel: null,
    fieldOfStudy: null,
    institution: null,
    graduationStatus: null,
    learningGoals: [],
    currentStatus: null,
    currentRole: null,
    targetCareer: null,
    careerInterests: [],
    preferredWorkStyle: null,
    hobbies: [],
    interests: [],
    favoriteTopics: [],
    favoriteBookGenres: [],
    skillsToImprove: [],
    dislikedTopics: [],
};

export function parseCommaSeparated(value: string) {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

export function toCommaSeparated(value: string[] | null | undefined) {
    return value?.join(", ") ?? "";
}

export function normalizeSettingsPayload(input: unknown) {
    return settingsPayloadSchema.parse(input);
}
