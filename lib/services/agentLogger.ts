/**
 * Agent Logging Service
 *
 * Provides centralized logging for all AI agent operations:
 * - Console logging (development) - Structured, timestamped logs
 * - Database logging (production) - Persistent audit trail in agent_generations table
 *
 * Design Principles:
 * - Non-blocking: Logging failures never break the app
 * - Fire-and-forget: Database inserts don't await in critical path
 * - Graceful degradation: Errors are logged to console but suppressed
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Creates a Supabase client with service role for logging
 * This bypasses RLS policies to ensure logs are always written
 */
function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ============================================================================
// Types
// ============================================================================

export type AgentType = 'observer' | 'action_story' | 'action_script' | 'action_praise'

export interface AgentLogEntry {
  agent_type: AgentType
  round_id?: string
  session_id?: string
  input_context: Record<string, any>
  output_content: Record<string, any>
  model_version: string
  generation_time_ms: number
  safety_flags?: string[]
  metadata?: Record<string, any>
  created_at?: string
}

// ============================================================================
// Console Logging
// ============================================================================

/**
 * Logs agent actions to console with structured format
 * Format: [Agent {Action}] {timestamp} {data}
 */
export function logAgentAction(
  action: string,
  data: Record<string, any>,
  level: 'info' | 'warn' | 'error' = 'info'
): void {
  const timestamp = new Date().toISOString()
  const prefix = `[Agent ${action}]`
  const logData = { timestamp, ...data }

  switch (level) {
    case 'warn':
      console.warn(prefix, logData)
      break
    case 'error':
      console.error(prefix, logData)
      break
    default:
      console.log(prefix, logData)
  }
}

// ============================================================================
// Database Logging
// ============================================================================

/**
 * Core database logging function
 * Inserts record into agent_generations table
 * Never throws errors - logging failures are non-critical
 *
 * Note: Uses type assertion due to Supabase client type inference limitations
 * with RLS policies. The insertData is properly typed before assertion.
 */
export async function logAgentGeneration(entry: AgentLogEntry): Promise<void> {
  try {
    const supabase = createServiceClient()

    type AgentGenerationInsert = Database['public']['Tables']['agent_generations']['Insert']

    const insertData: AgentGenerationInsert = {
      agent_type: entry.agent_type,
      round_id: entry.round_id || null,
      session_id: entry.session_id || null,
      input_context: entry.input_context,
      output_content: entry.output_content,
      model_version: entry.model_version,
      generation_time_ms: entry.generation_time_ms,
      safety_flags: entry.safety_flags || [],
      metadata: entry.metadata || {},
    }

    // Type assertion needed for RLS-enabled table
    const { error } = await (supabase as any)
      .from('agent_generations')
      .insert(insertData)

    if (error) {
      console.error('[Agent Logger] Database insert failed:', error.message)
    } else {
      console.log(`[Agent Logger] ✅ Logged ${entry.agent_type} generation (${entry.generation_time_ms}ms)`)
    }
  } catch (error) {
    // Silently fail - logging is non-critical
    console.error('[Agent Logger] Unexpected error:', error instanceof Error ? error.message : 'Unknown')
  }
}

// ============================================================================
// Specific Agent Loggers
// ============================================================================

/**
 * Logs Observer Agent analysis
 * Extracts key metrics: emotion trajectory, regulation effectiveness, recommended theme
 */
export async function logObserverAnalysis(
  roundId: string,
  input: Record<string, any>,
  output: Record<string, any>,
  timeMs: number
): Promise<void> {
  // Console logging with key metrics
  logAgentAction('Observer Analysis Complete', {
    roundId,
    regulationEffectiveness: output.regulation_effectiveness,
    recommendedTheme: output.recommended_next_theme,
    confidenceScore: output.confidence_score,
    timeMs,
  })

  // Database logging
  const entry: AgentLogEntry = {
    agent_type: 'observer',
    round_id: roundId,
    input_context: input,
    output_content: output,
    model_version: 'gpt-4',
    generation_time_ms: timeMs,
    metadata: {
      regulation_effectiveness: output.regulation_effectiveness,
      recommended_theme: output.recommended_next_theme,
      confidence_score: output.confidence_score,
    },
  }

  await logAgentGeneration(entry).catch(() => {}) // Fire-and-forget
}

/**
 * Logs Action Agent story generation
 * Extracts: theme, target emotion, complexity, story length
 */
export async function logStoryGeneration(
  sessionId: string,
  roundId: string | undefined,
  input: Record<string, any>,
  output: Record<string, any>,
  timeMs: number,
  safetyFlags?: string[]
): Promise<void> {
  // Console logging
  logAgentAction('Story Generation Complete', {
    sessionId,
    roundId,
    theme: output.theme,
    targetEmotion: output.target_emotion,
    complexityScore: output.complexity_score,
    storyLength: output.story_text?.length || 0,
    timeMs,
    safetyFlags: safetyFlags?.length ? safetyFlags : undefined,
  })

  // Database logging
  const entry: AgentLogEntry = {
    agent_type: 'action_story',
    round_id: roundId,
    session_id: sessionId,
    input_context: input,
    output_content: output,
    model_version: 'gpt-4',
    generation_time_ms: timeMs,
    safety_flags: safetyFlags || [],
    metadata: {
      theme: output.theme,
      target_emotion: output.target_emotion,
      complexity_score: output.complexity_score,
      story_length: output.story_text?.length || 0,
    },
  }

  await logAgentGeneration(entry).catch(() => {})
}

/**
 * Logs Action Agent script adaptation
 * Extracts: base script name, adapted name, step count, duration
 */
export async function logScriptAdaptation(
  roundId: string,
  input: Record<string, any>,
  output: Record<string, any>,
  timeMs: number,
  safetyFlags?: string[]
): Promise<void> {
  // Console logging
  logAgentAction('Script Adaptation Complete', {
    roundId,
    baseScript: input.base_script_name,
    adaptedName: output.name,
    stepCount: output.steps?.length || 0,
    durationSeconds: output.duration_seconds,
    timeMs,
    safetyFlags: safetyFlags?.length ? safetyFlags : undefined,
  })

  // Database logging
  const entry: AgentLogEntry = {
    agent_type: 'action_script',
    round_id: roundId,
    input_context: input,
    output_content: output,
    model_version: 'gpt-4',
    generation_time_ms: timeMs,
    safety_flags: safetyFlags || [],
    metadata: {
      base_script: input.base_script_name,
      adapted_name: output.name,
      step_count: output.steps?.length || 0,
      duration_seconds: output.duration_seconds,
    },
  }

  await logAgentGeneration(entry).catch(() => {})
}

/**
 * Logs Action Agent praise generation
 * Extracts: intensity delta, correctness, praise length
 */
export async function logPraiseGeneration(
  roundId: string,
  input: Record<string, any>,
  output: Record<string, any>,
  timeMs: number,
  safetyFlags?: string[]
): Promise<void> {
  // Console logging
  logAgentAction('Praise Generation Complete', {
    roundId,
    intensityDelta: input.intensity_delta,
    isCorrect: input.is_correct,
    praiseLength: output.praise_message?.length || 0,
    timeMs,
    safetyFlags: safetyFlags?.length ? safetyFlags : undefined,
  })

  // Database logging
  const entry: AgentLogEntry = {
    agent_type: 'action_praise',
    round_id: roundId,
    input_context: input,
    output_content: output,
    model_version: 'gpt-4o-mini',
    generation_time_ms: timeMs,
    safety_flags: safetyFlags || [],
    metadata: {
      intensity_delta: input.intensity_delta,
      is_correct: input.is_correct,
      praise_length: output.praise_message?.length || 0,
    },
  }

  await logAgentGeneration(entry).catch(() => {})
}

// ============================================================================
// Safety & Fallback Logging
// ============================================================================

/**
 * Logs safety pipeline results
 * Uses 'warn' level if safety check failed
 */
export function logSafetyCheck(
  content: string,
  passed: boolean,
  flags: string[],
  context?: Record<string, any>
): void {
  logAgentAction(
    'Safety Check',
    {
      passed,
      flags,
      contentLength: content.length,
      ...context,
    },
    passed ? 'info' : 'warn'
  )
}

/**
 * Logs when static fallback content is used
 * Uses 'warn' level
 */
export function logFallback(
  agentType: AgentType,
  reason: string,
  context?: Record<string, any>
): void {
  logAgentAction(
    'Fallback Used',
    {
      agentType,
      reason,
      ...context,
    },
    'warn'
  )
}

// ============================================================================
// Export & Analysis
// ============================================================================

/**
 * Queries all agent generations for a session
 * Returns array of log entries ordered by timestamp
 * Used for clinical analysis and reporting
 *
 * Note: Uses type assertion due to Supabase client type inference limitations
 * with RLS policies.
 */
export async function exportSessionLogs(sessionId: string): Promise<AgentLogEntry[]> {
  try {
    const supabase = createServiceClient()

    // Type assertion needed for RLS-enabled table
    const { data, error } = await (supabase as any)
      .from('agent_generations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[Agent Logger] Failed to export session logs:', error.message)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[Agent Logger] Export error:', error instanceof Error ? error.message : 'Unknown')
    return []
  }
}
