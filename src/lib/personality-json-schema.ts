import { z } from "zod";

export const personalityAnalysisSchema = z.object({
  profile_data: z.object({
    mbti: z.string().nullable(),
    enneagram: z.object({
      type: z.number().nullable(),
      wing: z.string().nullable(),
      wing_source: z.enum(["explicit", "inferred"]).nullable(),
      tritype: z.string().nullable(),
      instinctual_variant: z.string().nullable(),
    }),
    socionics: z.object({
      type: z.string().nullable(),
      notes: z.string(),
    }),
    attitudinal_psyche: z.string().nullable(),
    riasec: z.string().nullable(),
  }),
  archetype: z.object({
    title: z.string(),
    summary: z.string(),
  }),
  cognitive_dynamics: z.object({
    mbti_stack: z.array(z.string()),
    loop_description: z.string(),
    cross_framework_synthesis: z.string(),
  }),
  social_volitional: z.object({
    description: z.string(),
    ap_breakdown: z.object({
      position_1: z.string(),
      position_2: z.string(),
      position_3: z.string(),
      position_4: z.string(),
    }),
  }),
  instinctual_drive: z.string(),
  shadow_work: z.object({
    blind_spots: z.array(z.string()),
    growth_edges: z.array(z.string()),
  }),
  career: z.object({
    recommended_majors: z.array(
      z.object({
        name: z.string(),
        rationale: z.string(),
      })
    ),
    career_paths: z.array(
      z.object({
        title: z.string(),
        fit_score: z.enum(["high", "medium"]),
        rationale: z.string(),
      })
    ),
    ideal_environment: z.array(z.string()),
  }),
  growth_recommendations: z.array(
    z.object({
      area: z.string(),
      practice: z.string(),
    })
  ),
  consistency_audit: z.object({
    frameworks_used: z.array(z.string()),
    inferred_fields: z.array(z.string()),
    warnings: z.array(z.string()),
  }),
});

export type PersonalityAnalysis = z.infer<typeof personalityAnalysisSchema>;
