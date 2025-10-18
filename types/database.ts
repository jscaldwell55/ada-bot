/**
 * Database Types for Ada Emotion Recognition & Regulation Chatbot
 * Generated from Supabase PostgreSQL schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AgeBand = '6-7' | '8-9' | '10-12'

export type EmotionLabel =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'scared'
  | 'surprised'
  | 'disgusted'
  | 'calm'

export type IntensityLevel = 1 | 2 | 3 | 4 | 5

// ==================== Child ====================
export interface Child {
  id: string
  parent_id: string
  nickname: string
  age_band: AgeBand
  avatar_emoji: string
  created_at: string
  updated_at: string
}

export interface InsertChild {
  id?: string
  parent_id: string
  nickname: string
  age_band: AgeBand
  avatar_emoji: string
  created_at?: string
  updated_at?: string
}

export interface UpdateChild {
  nickname?: string
  age_band?: AgeBand
  avatar_emoji?: string
  updated_at?: string
}

// ==================== Story ====================
export interface Story {
  id: string
  title: string
  text: string
  emotion: EmotionLabel
  age_band: AgeBand
  complexity_score: number
  created_at: string
}

export interface InsertStory {
  id?: string
  title: string
  text: string
  emotion: EmotionLabel
  age_band: AgeBand
  complexity_score: number
  created_at?: string
}

// ==================== Regulation Script ====================
export interface RegulationScriptStep {
  text: string
  emoji?: string
  duration_ms: number
}

export interface RegulationScript {
  id: string
  name: string
  description: string
  icon_emoji: string
  recommended_for_emotions: EmotionLabel[]
  recommended_for_intensities: IntensityLevel[]
  duration_seconds: number
  steps: RegulationScriptStep[]
  created_at: string
}

export interface InsertRegulationScript {
  id?: string
  name: string
  description: string
  icon_emoji: string
  recommended_for_emotions: EmotionLabel[]
  recommended_for_intensities: IntensityLevel[]
  duration_seconds: number
  steps: RegulationScriptStep[]
  created_at?: string
}

// ==================== Session ====================
export interface Session {
  id: string
  child_id: string
  started_at: string
  completed_at: string | null
  total_rounds: number
  completed_rounds: number
  story_ids: string[]
  // Agent architecture columns
  cumulative_context: Json | null
  agent_enabled: boolean
}

export interface InsertSession {
  id?: string
  child_id: string
  started_at?: string
  completed_at?: string | null
  total_rounds?: number
  completed_rounds?: number
  story_ids: string[]
  // Agent architecture columns
  cumulative_context?: Json | null
  agent_enabled?: boolean
}

export interface UpdateSession {
  completed_at?: string | null
  completed_rounds?: number
  // Agent architecture columns
  cumulative_context?: Json | null
  agent_enabled?: boolean
}

// ==================== Emotion Round ====================
export interface EmotionRound {
  id: string
  session_id: string
  round_number: number
  story_id: string
  labeled_emotion: EmotionLabel | null
  pre_intensity: IntensityLevel | null
  regulation_script_id: string | null
  post_intensity: IntensityLevel | null
  praise_message: string | null
  is_correct: boolean | null
  started_at: string
  completed_at: string | null
  // Agent architecture columns
  observer_context: Json | null
  action_agent_story: Json | null
  action_agent_script: Json | null
  action_agent_praise: string | null
  generation_metadata: Json | null
}

export interface InsertEmotionRound {
  id?: string
  session_id: string
  round_number: number
  story_id: string
  labeled_emotion?: EmotionLabel | null
  pre_intensity?: IntensityLevel | null
  regulation_script_id?: string | null
  post_intensity?: IntensityLevel | null
  praise_message?: string | null
  is_correct?: boolean | null
  started_at?: string
  completed_at?: string | null
  // Agent architecture columns
  observer_context?: Json | null
  action_agent_story?: Json | null
  action_agent_script?: Json | null
  action_agent_praise?: string | null
  generation_metadata?: Json | null
}

export interface UpdateEmotionRound {
  labeled_emotion?: EmotionLabel | null
  pre_intensity?: IntensityLevel | null
  regulation_script_id?: string | null
  post_intensity?: IntensityLevel | null
  praise_message?: string | null
  is_correct?: boolean | null
  completed_at?: string | null
  // Agent architecture columns
  observer_context?: Json | null
  action_agent_story?: Json | null
  action_agent_script?: Json | null
  action_agent_praise?: string | null
  generation_metadata?: Json | null
}

// ==================== Safety Alert ====================
export interface SafetyAlert {
  id: string
  child_id: string
  session_id: string | null
  trigger_text: string
  matched_keywords: string[]
  severity: 'low' | 'medium' | 'high'
  parent_notified: boolean
  parent_notified_at: string | null
  created_at: string
}

export interface InsertSafetyAlert {
  id?: string
  child_id: string
  session_id?: string | null
  trigger_text: string
  matched_keywords: string[]
  severity: 'low' | 'medium' | 'high'
  parent_notified?: boolean
  parent_notified_at?: string | null
  created_at?: string
}

export interface UpdateSafetyAlert {
  parent_notified?: boolean
  parent_notified_at?: string | null
}

// ==================== Parent Feedback ====================
export interface ParentFeedback {
  id: string
  child_id: string
  session_id: string
  rating: 1 | 2 | 3 | 4 | 5
  comment: string | null
  created_at: string
}

export interface InsertParentFeedback {
  id?: string
  child_id: string
  session_id: string
  rating: 1 | 2 | 3 | 4 | 5
  comment?: string | null
  created_at?: string
}

// ==================== Agent Generation ====================
export interface AgentGeneration {
  id: string
  round_id: string | null
  session_id: string | null
  agent_type: 'observer' | 'action_story' | 'action_script' | 'action_praise'
  input_context: Json
  output_content: Json
  model_version: string
  safety_flags: string[]
  generation_time_ms: number | null
  tokens_used: number | null
  metadata: Json | null
  created_at: string
}

export interface InsertAgentGeneration {
  id?: string
  round_id?: string | null
  session_id?: string | null
  agent_type: 'observer' | 'action_story' | 'action_script' | 'action_praise'
  input_context: Json
  output_content: Json
  model_version: string
  safety_flags?: string[]
  generation_time_ms?: number | null
  tokens_used?: number | null
  metadata?: Json | null
  created_at?: string
}

// ==================== Database Schema ====================
export interface Database {
  __InternalSupabase?: {
    PostgrestVersion: '12'
  }
  public: {
    Tables: {
      children: {
        Row: Child
        Insert: InsertChild
        Update: UpdateChild
      }
      stories: {
        Row: Story
        Insert: InsertStory
        Update: Partial<Story>
      }
      regulation_scripts: {
        Row: RegulationScript
        Insert: InsertRegulationScript
        Update: Partial<RegulationScript>
      }
      sessions: {
        Row: Session
        Insert: InsertSession
        Update: UpdateSession
      }
      emotion_rounds: {
        Row: EmotionRound
        Insert: InsertEmotionRound
        Update: UpdateEmotionRound
      }
      safety_alerts: {
        Row: SafetyAlert
        Insert: InsertSafetyAlert
        Update: UpdateSafetyAlert
      }
      parent_feedback: {
        Row: ParentFeedback
        Insert: InsertParentFeedback
        Update: Partial<ParentFeedback>
      }
      agent_generations: {
        Row: AgentGeneration
        Insert: InsertAgentGeneration
        Update: Partial<AgentGeneration>
      }
    }
  }
}

// ==================== Query Filters ====================
export interface StoryFilters {
  emotion?: EmotionLabel
  age_band?: AgeBand
  min_complexity?: number
  max_complexity?: number
}

export interface SessionFilters {
  child_id?: string
  completed?: boolean
  start_date?: string
  end_date?: string
}

export interface EmotionRoundFilters {
  session_id?: string
  emotion?: EmotionLabel
  is_correct?: boolean
}

export interface SafetyAlertFilters {
  child_id?: string
  severity?: 'low' | 'medium' | 'high'
  parent_notified?: boolean
  start_date?: string
  end_date?: string
}

// ==================== Extended Types with Relations ====================
export interface SessionWithRounds extends Session {
  rounds: EmotionRound[]
}

export interface EmotionRoundWithStory extends EmotionRound {
  story: Story
  regulation_script: RegulationScript | null
}

export interface ChildWithStats extends Child {
  total_sessions: number
  completed_sessions: number
  total_rounds: number
  correct_labels: number
  accuracy_percentage: number
  average_intensity_delta: number
  last_session_date: string | null
}
