/**
 * Type Definitions for Two-Agent Architecture
 * Observer Agent (Reflector/Analyzer) + Action Agent (Generator/Facilitator)
 */

import type { EmotionLabel, IntensityLevel, AgeBand } from './database'

// ==================== Observer Agent Types ====================

/**
 * Observer Agent analyzes child's emotional learning trajectory
 * and provides context for Action Agent
 */
export interface ObserverAgentInput {
  round_id: string
  round_number: number
  story_text: string
  story_theme: string
  target_emotion: EmotionLabel
  labeled_emotion: EmotionLabel
  pre_intensity: IntensityLevel
  post_intensity: IntensityLevel
  script_name: string
  reflection_text?: string | null
  previous_context?: ObserverAgentOutput | null
}

export type RegulationEffectiveness = 'high' | 'medium' | 'low'

export interface EmotionTrajectory {
  start: EmotionLabel
  end: EmotionLabel | null
}

export interface ObserverAgentOutput {
  round_id: string
  story_theme: string
  emotion_trajectory: EmotionTrajectory
  intensity_delta: number // post - pre (-4 to +4)
  regulation_effectiveness: RegulationEffectiveness
  contextual_insights: string[] // e.g., ["Child struggles with sibling themes"]
  recommended_next_theme: string // e.g., "cooperation" or "patience building"
  recommended_emotion_focus: EmotionLabel
  recommended_complexity: 1 | 2 | 3 | 4 | 5
  confidence_score: number // 0-1, how certain the analysis is
}

// ==================== Action Agent - Story Types ====================

export interface ActionAgentStoryInput {
  child_id: string
  age_band: AgeBand
  observer_summary?: ObserverAgentOutput | null
  recommended_emotion?: EmotionLabel
  recommended_theme?: string
  recommended_complexity?: number
  previous_successful_themes?: string[]
  round_number: number
}

export interface ActionAgentStoryOutput {
  story_text: string // 2-3 sentences, age-appropriate
  target_emotion: EmotionLabel // intended emotion for child to practice
  theme: string // e.g., "sharing toys", "first day of school"
  complexity_score: 1 | 2 | 3 | 4 | 5
  contextual_tie?: string // How this builds on previous round
}

// ==================== Action Agent - Script Types ====================

export interface ActionAgentScriptInput {
  child_id: string
  age_band: AgeBand
  labeled_emotion: EmotionLabel
  pre_intensity: IntensityLevel
  observer_insights?: ObserverAgentOutput | null
  effective_scripts_history?: string[] // Scripts that worked before
  round_number: number
}

export interface AdaptedRegulationScript {
  name: string // e.g., "Calm Breathing (Adapted)"
  steps: string[] // Generated steps, inspired by static script
  duration_seconds: number
  adaptation_note: string // Why this variation matters for this child
}

export interface ActionAgentScriptOutput {
  primary_script: AdaptedRegulationScript
  alternative_scripts: Array<{
    name: string
    brief_description: string
  }>
}

// ==================== Action Agent - Praise Types ====================

export interface ActionAgentPraiseInput {
  child_nickname: string
  age_band: AgeBand
  observer_analysis?: ObserverAgentOutput | null
  labeled_emotion: EmotionLabel
  is_correct: boolean
  pre_intensity: IntensityLevel
  post_intensity: IntensityLevel
  intensity_delta: number
  script_used: string
  round_number: number
  total_rounds: number
}

export interface ActionAgentPraiseOutput {
  praise_message: string // 1-2 sentences
  highlights: string[] // Specific achievements
  encouragement_focus: string // Future-oriented guidance
  badge_emoji?: string
}

// ==================== Agent Generation Metadata ====================

export interface GenerationMetadata {
  agent_type: 'observer' | 'action_story' | 'action_script' | 'action_praise'
  model_version: string
  generation_timestamp: string
  generation_time_ms: number
  tokens_used?: number
  safety_flags: string[] // e.g., ['passed_keyword_filter', 'passed_toxicity_check']
  fallback_used: boolean
  error_message?: string
}

// ==================== Database Schema Updates ====================

/**
 * Extended EmotionRound with agent data
 */
export interface EmotionRoundWithAgents {
  id: string
  session_id: string
  round_number: number
  story_id: string

  // Original fields
  labeled_emotion: EmotionLabel | null
  pre_intensity: IntensityLevel | null
  regulation_script_id: string | null
  post_intensity: IntensityLevel | null
  praise_message: string | null
  is_correct: boolean | null
  started_at: string
  completed_at: string | null

  // New agent fields
  observer_context?: ObserverAgentOutput | null
  action_agent_story?: ActionAgentStoryOutput | null
  action_agent_script?: ActionAgentScriptOutput | null
  action_agent_praise?: string | null
  generation_metadata?: GenerationMetadata | null
}

/**
 * Extended Session with cumulative context
 */
export interface SessionWithAgents {
  id: string
  child_id: string
  started_at: string
  completed_at: string | null
  total_rounds: number
  completed_rounds: number
  story_ids: string[]

  // New agent fields
  cumulative_context?: ObserverAgentOutput[] | null
  agent_enabled: boolean
}

/**
 * Agent Generation Audit Record
 */
export interface AgentGeneration {
  id: string
  round_id: string
  agent_type: 'observer' | 'action_story' | 'action_script' | 'action_praise'
  input_context: Record<string, any>
  output_content: Record<string, any>
  model_version: string
  safety_flags: string[]
  generation_time_ms: number | null
  tokens_used: number | null
  created_at: string
}

export interface InsertAgentGeneration {
  id?: string
  round_id: string
  agent_type: 'observer' | 'action_story' | 'action_script' | 'action_praise'
  input_context: Record<string, any>
  output_content: Record<string, any>
  model_version: string
  safety_flags?: string[]
  generation_time_ms?: number | null
  tokens_used?: number | null
  created_at?: string
}

// ==================== Safety Pipeline Types ====================

export interface SafetyCheckResult {
  passed: boolean
  flags: string[]
  toxicity_score?: number
  keyword_violations?: string[]
  reason?: string
}

export interface ContentValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// ==================== API Request/Response Types ====================

export interface ObserveAgentRequest {
  round_id: string
  round_number: number
  story_text: string
  story_theme: string
  target_emotion: EmotionLabel
  labeled_emotion: EmotionLabel
  pre_intensity: IntensityLevel
  post_intensity: IntensityLevel
  script_name: string
  reflection_text?: string | null
  previous_context?: ObserverAgentOutput | null
}

export interface ObserveAgentResponse {
  success: boolean
  context: ObserverAgentOutput
  generation_id?: string
  error?: string
}

export interface GenerateStoryRequest {
  child_id: string
  age_band: AgeBand
  observer_summary?: ObserverAgentOutput | null
  recommended_emotion?: EmotionLabel
  recommended_theme?: string
  round_number: number
}

export interface GenerateStoryResponse {
  success: boolean
  story: ActionAgentStoryOutput
  fallback_used: boolean
  safety_result?: SafetyCheckResult
  generation_id?: string
  error?: string
}

export interface GenerateScriptRequest {
  child_id: string
  age_band: AgeBand
  labeled_emotion: EmotionLabel
  pre_intensity: IntensityLevel
  observer_insights?: ObserverAgentOutput | null
  round_number: number
}

export interface GenerateScriptResponse {
  success: boolean
  script: ActionAgentScriptOutput
  fallback_used: boolean
  safety_result?: SafetyCheckResult
  generation_id?: string
  error?: string
}

export interface GeneratePraiseRequest {
  child_nickname: string
  age_band: AgeBand
  observer_analysis?: ObserverAgentOutput | null
  labeled_emotion: EmotionLabel
  is_correct: boolean
  pre_intensity: IntensityLevel
  post_intensity: IntensityLevel
  script_used: string
  round_number: number
  total_rounds: number
}

export interface GeneratePraiseResponse {
  success: boolean
  praise: ActionAgentPraiseOutput
  fallback_used: boolean
  safety_result?: SafetyCheckResult
  generation_id?: string
  error?: string
}
