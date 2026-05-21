import { z } from "zod";

export const devilNewTestResponseSchema = z
    .object({
        meta: z.object({}).passthrough().optional(),
        data: z
            .object({
                test_id: z.string(),
                test_url: z.string().url(),
            })
            .passthrough(),
    })
    .passthrough();

export type DevilNewTestResponse = z.infer<typeof devilNewTestResponseSchema>;

export const newTestResponseSchema = devilNewTestResponseSchema;
export type NewTestResponse = DevilNewTestResponse;

const stringRecordSchema = z.record(z.string(), z.string());

const matchesSchema = z.union([
    z.array(z.string()),
    stringRecordSchema,
]);

export const devilCheckTestResponseSchema = z
    .object({
        meta: z
            .object({
                success: z.boolean().optional(),
            })
            .passthrough()
            .optional(),
        data: z
            .object({
                prediction: z.string().optional(),
                predictions: z.record(z.string(), z.number()).optional(),
                trait_order_conscious: stringRecordSchema.optional(),
                trait_order_shadow: stringRecordSchema.optional(),
                matches: matchesSchema.optional(),
                results_page: z.string().url().optional(),
                result_date: z.string().optional(),
                test_id: z.string().optional(),
            })
            .passthrough()
            .optional(),
    })
    .passthrough();

export const checkTestResponseSchema = devilCheckTestResponseSchema;
export type DevilCheckTestResponse = z.infer<typeof devilCheckTestResponseSchema>;

export interface CheckTestResponse {
    completed: boolean;
    prediction?: string;
    predictions?: Record<string, number>;
    trait_order_conscious?: string[];
    trait_order_shadow?: string[];
    matches?: string[];
    results_page?: string;
    result_date?: string;
    test_id?: string;
}
