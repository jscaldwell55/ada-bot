/**
 * API Request/Response Types for Ada
 */

import type {
  EmotionLabel,
  IntensityLevel,
  Session,
  EmotionRound,
  Story,
  SessionWithRounds,
  EmotionRoundWithStory,
} from './database'

export type { RegulationScript } from './database'

// ==================== Sessions API ====================
export interface CreateSessionRequest {
  child_id: string
}

export interface CreateSessionResponse {
  session: Session
  stories: Story[]
}

export interface GetSessionResponse {
  session: SessionWithRounds
  stories: Story[]
}

// ==================== Rounds API ====================
export interface CreateRoundRequest {
  session_id: string
  round_number: number
  story_id: string
}

export interface CreateRoundResponse {
  round: EmotionRound
}

export interface UpdateRoundRequest {
  labeled_emotion?: EmotionLabel
  pre_intensity?: IntensityLevel
  regulation_script_id?: string
  post_intensity?: IntensityLevel
  praise_message?: string
}

export interface UpdateRoundResponse {
  round: EmotionRoundWithStory
  is_correct: boolean
}

// ==================== Praise Generation API ====================
export interface GeneratePraiseRequest {
  child_nickname: string
  emotion: EmotionLabel
  is_correct: boolean
  pre_intensity: IntensityLevel
  post_intensity: IntensityLevel
  round_number: number
  total_rounds: number
}

export interface GeneratePraiseResponse {
  message: string
  badge_emoji?: string
  is_safe: boolean
}

// ==================== Error Responses ====================
export interface ApiError {
  error: string
  message: string
  details?: unknown
}

export interface ValidationError extends ApiError {
  error: 'validation_error'
  validation_errors: Array<{
    field: string
    message: string
  }>
}

// ==================== Safety API ====================
export interface SafetyCheckResult {
  is_safe: boolean
  matched_keywords: string[]
  severity: 'low' | 'medium' | 'high' | null
  should_alert_parent: boolean
}

// ==================== Statistics ====================
export interface SessionStatistics {
  total_rounds: number
  completed_rounds: number
  correct_labels: number
  accuracy_percentage: number
  average_pre_intensity: number
  average_post_intensity: number
  average_intensity_delta: number
  emotions_practiced: EmotionLabel[]
  scripts_used: string[]
}

// ==================== Dashboard ====================
export interface DashboardStats {
  total_children: number
  total_sessions: number
  sessions_this_week: number
  average_accuracy: number
  recent_alerts: number
}

export interface ChildDashboardStats {
  child_id: string
  nickname: string
  avatar_emoji: string
  total_sessions: number
  completed_sessions: number
  accuracy_percentage: number
  average_intensity_delta: number
  last_session_date: string | null
  recent_emotions: EmotionLabel[]
}
