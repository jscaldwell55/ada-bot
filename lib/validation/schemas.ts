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
  story_id: z.string().uuid('Invalid story ID format'),
})

export const labelEmotionSchema = z.object({
  labeled_emotion: emotionLabelSchema,
})

export const rateIntensitySchema = z.object({
  pre_intensity: intensityLevelSchema,
})

export const selectScriptSchema = z.object({
  regulation_script_id: z.string().uuid('Invalid script ID format'),
})

export const reflectIntensitySchema = z.object({
  post_intensity: intensityLevelSchema,
})

export const updateRoundSchema = z.object({
  labeled_emotion: emotionLabelSchema.optional(),
  pre_intensity: intensityLevelSchema.optional(),
  regulation_script_id: z.string().uuid().optional().nullable(),
  post_intensity: intensityLevelSchema.optional(),
  praise_message: z.string().optional().nullable(),
  is_correct: z.boolean().optional().nullable(),
  completed_at: z.string().datetime().optional().nullable(),
})

export const completeRegulationSchema = z.object({
  regulation_script_id: z.string().uuid('Invalid script ID format'),
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
