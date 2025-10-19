/**
 * Zod Validation Schemas for API Routes
 */

import { z } from 'zod'

// ==================== Base Types ====================
export const emotionLabelSchema = z.enum([
  'happy',
  'sad',
  'angry',
  'scared',
  'surprised',
  'disgusted',
  'calm',
])

export const intensityLevelSchema = z.number().int().min(1).max(5)

export const ageBandSchema = z.enum(['6-7', '8-9', '10-12'])

// ==================== Session Schemas ====================
export const createSessionSchema = z.object({
  child_id: z.string().uuid('Invalid child ID format'),
})

export const updateSessionSchema = z.object({
  completed_at: z.string().datetime().optional().nullable(),
  completed_rounds: z.number().int().min(0).max(5).optional(),
})

// ==================== Round Schemas ====================
export const createRoundSchema = z.object({
  session_id: z.string().uuid('Invalid session ID format'),
  round_number: z.number().int().min(1).max(5),
  // story_id is optional/nullable when agents are enabled (story generated dynamically)
  // Required only when using static stories (agent_enabled: false)
  story_id: z.string().uuid('Invalid story ID format').optional().nullable(),
})

export const labelEmotionSchema = z.object({
  labeled_emotion: emotionLabelSchema,
})

export const rateIntensitySchema = z.object({
  pre_intensity: intensityLevelSchema,
})

export const selectScriptSchema = z.object({
  regulation_script_id: z.string().min(1, 'Script ID is required'), // String ID, not UUID
})

export const reflectIntensitySchema = z.object({
  post_intensity: intensityLevelSchema,
})

export const updateRoundSchema = z.object({
  labeled_emotion: emotionLabelSchema.optional(),
  pre_intensity: intensityLevelSchema.optional(),
  regulation_script_id: z.string().optional().nullable(), // String ID, not UUID
  post_intensity: intensityLevelSchema.optional(),
  praise_message: z.string().optional().nullable(),
  is_correct: z.boolean().optional().nullable(),
  completed_at: z.string().datetime().optional().nullable(),
})

export const completeRegulationSchema = z.object({
  regulation_script_id: z.string().min(1, 'Script ID is required'), // String ID, not UUID
  post_intensity: intensityLevelSchema,
})

// ==================== Praise Generation Schema ====================
export const generatePraiseSchema = z.object({
  child_nickname: z
    .string()
    .min(1, 'Nickname is required')
    .max(50, 'Nickname too long'),
  emotion: emotionLabelSchema,
  is_correct: z.boolean(),
  pre_intensity: intensityLevelSchema,
  post_intensity: intensityLevelSchema,
  round_number: z.number().int().min(1).max(5),
  total_rounds: z.number().int().min(1).max(10).default(5),
})

// ==================== Child Schemas ====================
export const createChildSchema = z.object({
  parent_id: z.string().uuid('Invalid parent ID format'),
  nickname: z
    .string()
    .min(1, 'Nickname is required')
    .max(50, 'Nickname must be 50 characters or less')
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      'Nickname can only contain letters, numbers, spaces, hyphens, and underscores'
    ),
  age_band: ageBandSchema,
  avatar_emoji: z
    .string()
    .min(1, 'Avatar emoji is required')
    .max(10, 'Avatar emoji is too long'),
})

export const updateChildSchema = z.object({
  nickname: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9\s\-_]+$/)
    .optional(),
  age_band: ageBandSchema.optional(),
  avatar_emoji: z.string().min(1).max(10).optional(),
})

// ==================== Safety Alert Schemas ====================
export const createSafetyAlertSchema = z.object({
  child_id: z.string().uuid(),
  session_id: z.string().uuid().optional().nullable(),
  trigger_text: z.string().min(1).max(1000),
  matched_keywords: z.array(z.string()),
  severity: z.enum(['low', 'medium', 'high']),
})

// ==================== Parent Feedback Schema ====================
export const createParentFeedbackSchema = z.object({
  child_id: z.string().uuid(),
  session_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable(),
})

// ==================== Query Param Schemas ====================
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const dateRangeSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
})

// ==================== Agent Schemas ====================

// Observer Agent Schemas
export const observerAgentInputSchema = z.object({
  round_id: z.string().uuid(),
  round_number: z.number().int().min(1).max(5),
  story_text: z.string().min(1),
  story_theme: z.string().min(1),
  target_emotion: emotionLabelSchema,
  labeled_emotion: emotionLabelSchema,
  pre_intensity: intensityLevelSchema,
  post_intensity: intensityLevelSchema,
  script_name: z.string().min(1),
  reflection_text: z.string().optional().nullable(),
  previous_context: z.any().optional().nullable(), // JSONB from previous round
})

export const observerAgentOutputSchema = z.object({
  round_id: z.string().uuid(),
  story_theme: z.string(),
  emotion_trajectory: z.object({
    start: emotionLabelSchema,
    end: emotionLabelSchema.nullable(),
  }),
  intensity_delta: z.number().int().min(-4).max(4),
  regulation_effectiveness: z.enum(['high', 'medium', 'low']),
  contextual_insights: z.array(z.string()),
  recommended_next_theme: z.string(),
  recommended_emotion_focus: emotionLabelSchema,
  recommended_complexity: z.number().int().min(1).max(5),
  confidence_score: z.number().min(0).max(1),
})

// Action Agent - Story Generation Schemas
export const actionAgentStoryInputSchema = z.object({
  child_id: z.string().uuid(),
  session_id: z.string().uuid().optional(), // For logging purposes
  age_band: ageBandSchema,
  observer_summary: z.any().optional().nullable(), // ObserverAgentOutput
  recommended_emotion: emotionLabelSchema.optional(),
  recommended_theme: z.string().optional(),
  recommended_complexity: z.number().int().min(1).max(5).optional(),
  previous_successful_themes: z.array(z.string()).optional(),
  round_number: z.number().int().min(1).max(5),
})

export const actionAgentStoryOutputSchema = z.object({
  story_text: z.string().min(10).max(500), // 2-3 sentences
  target_emotion: emotionLabelSchema,
  theme: z.string(),
  complexity_score: z.number().int().min(1).max(5),
  contextual_tie: z.string().optional(),
})

// Action Agent - Script Generation Schemas
export const actionAgentScriptInputSchema = z.object({
  child_id: z.string().uuid(),
  age_band: ageBandSchema,
  labeled_emotion: emotionLabelSchema,
  pre_intensity: intensityLevelSchema,
  observer_insights: z.any().optional().nullable(), // ObserverAgentOutput
  effective_scripts_history: z.array(z.string()).optional(),
  round_number: z.number().int().min(1).max(5),
})

export const actionAgentScriptOutputSchema = z.object({
  primary_script: z.object({
    name: z.string(),
    steps: z.array(z.string()).min(4).max(7),
    duration_seconds: z.number().int().min(30).max(120),
    adaptation_note: z.string(),
  }),
  alternative_scripts: z.array(
    z.object({
      name: z.string(),
      brief_description: z.string(),
    })
  ).max(3),
})

// Action Agent - Praise Generation Schemas
export const actionAgentPraiseInputSchema = z.object({
  child_nickname: z.string().min(1).max(50),
  age_band: ageBandSchema,
  observer_analysis: z.any().optional().nullable(), // ObserverAgentOutput
  labeled_emotion: emotionLabelSchema,
  is_correct: z.boolean(),
  pre_intensity: intensityLevelSchema,
  post_intensity: intensityLevelSchema,
  intensity_delta: z.number().int().min(-4).max(4),
  script_used: z.string(),
  round_number: z.number().int().min(1).max(5),
  total_rounds: z.number().int().min(1).max(10).default(5),
})

export const actionAgentPraiseOutputSchema = z.object({
  praise_message: z.string().min(10).max(500),
  highlights: z.array(z.string()),
  encouragement_focus: z.string(),
  badge_emoji: z.string().optional(),
})

// Agent Generation Metadata Schema
export const generationMetadataSchema = z.object({
  agent_type: z.enum(['observer', 'action_story', 'action_script', 'action_praise']),
  model_version: z.string(),
  generation_timestamp: z.string().datetime(),
  generation_time_ms: z.number().int().min(0),
  tokens_used: z.number().int().min(0).optional(),
  safety_flags: z.array(z.string()),
  fallback_used: z.boolean(),
  error_message: z.string().optional(),
})

// Safety Check Result Schema
export const safetyCheckResultSchema = z.object({
  passed: z.boolean(),
  flags: z.array(z.string()),
  toxicity_score: z.number().min(0).max(1).optional(),
  keyword_violations: z.array(z.string()).optional(),
  reason: z.string().optional(),
})

// ==================== Type Exports ====================
export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>
export type CreateRoundInput = z.infer<typeof createRoundSchema>
export type LabelEmotionInput = z.infer<typeof labelEmotionSchema>
export type UpdateRoundInput = z.infer<typeof updateRoundSchema>
export type CompleteRegulationInput = z.infer<typeof completeRegulationSchema>
export type GeneratePraiseInput = z.infer<typeof generatePraiseSchema>
export type CreateChildInput = z.infer<typeof createChildSchema>
export type UpdateChildInput = z.infer<typeof updateChildSchema>
export type CreateSafetyAlertInput = z.infer<typeof createSafetyAlertSchema>
export type CreateParentFeedbackInput = z.infer<typeof createParentFeedbackSchema>

// Agent Type Exports
export type ObserverAgentInput = z.infer<typeof observerAgentInputSchema>
export type ObserverAgentOutput = z.infer<typeof observerAgentOutputSchema>
export type ActionAgentStoryInput = z.infer<typeof actionAgentStoryInputSchema>
export type ActionAgentStoryOutput = z.infer<typeof actionAgentStoryOutputSchema>
export type ActionAgentScriptInput = z.infer<typeof actionAgentScriptInputSchema>
export type ActionAgentScriptOutput = z.infer<typeof actionAgentScriptOutputSchema>
export type ActionAgentPraiseInput = z.infer<typeof actionAgentPraiseInputSchema>
export type ActionAgentPraiseOutput = z.infer<typeof actionAgentPraiseOutputSchema>
export type GenerationMetadata = z.infer<typeof generationMetadataSchema>
export type SafetyCheckResult = z.infer<typeof safetyCheckResultSchema>
