import { z } from "zod";

const riskSchema = z.enum(["low", "medium", "high"]);
const supportLevelSchema = z.enum(["strong", "moderate", "weak", "insufficient_data"]);
const frameworkSchema = z.enum([
    "MBTI",
    "Enneagram",
    "Tritype",
    "Instinctual Variant",
    "Socionics",
    "Attitudinal Psyche",
    "RIASEC",
    "Big Five",
    "Temperament",
]);
const evidenceSourceSchema = z.enum([
    "profile",
    "analysis",
    "settings",
    "book_collection",
    "book_status",
    "career_interest",
    "narrative",
    "book_recommendation",
]);
const weightSchema = z.enum(["low", "medium", "high"]);

export const profileValidationSchema = z.object({
    summary: z.string().min(1),
    profile_consistency_score: z.number().min(0).max(100),
    mistype_risk: riskSchema,
    confidence: riskSchema,
    data_quality: z.object({
        profile_available: z.boolean(),
        analysis_available: z.boolean(),
        settings_available: z.boolean(),
        book_collection_count: z.number().int().min(0),
        finished_books_count: z.number().int().min(0),
        unfinished_books_count: z.number().int().min(0),
        career_data_available: z.boolean(),
        narrative_data_available: z.boolean(),
        limitations: z.array(z.string()),
    }),
    framework_assessment: z.array(z.object({
        framework: frameworkSchema,
        current_type: z.string().nullable(),
        support_level: supportLevelSchema,
        consistency_notes: z.string().min(1),
        possible_alternatives: z.array(z.object({
            type: z.string().min(1),
            reason: z.string().min(1),
            confidence: z.enum(["low", "medium"]),
        })),
    })),
    evidence: z.array(z.object({
        source: evidenceSourceSchema,
        observation: z.string().min(1),
        supports: z.array(z.string()),
        potential_conflicts: z.array(z.string()),
        weight: weightSchema,
    })),
    mistype_indicators: z.array(z.object({
        area: z.string().min(1),
        indicator: z.string().min(1),
        why_it_matters: z.string().min(1),
        severity: riskSchema,
    })),
    validation_questions: z.array(z.object({
        question: z.string().min(1),
        purpose: z.string().min(1),
        related_framework: z.string().min(1),
    })),
    recommendations: z.array(z.object({
        action: z.string().min(1),
        reason: z.string().min(1),
    })),
    warnings: z.array(z.string()),
});

export type ProfileValidationResult = z.infer<typeof profileValidationSchema>;
