/**
 * Regulation Scripts Service
 * Functions for fetching and filtering regulation scripts from Supabase
 */

import { createBrowserClient } from '@/lib/supabase/client'
import type {
  RegulationScript,
  EmotionLabel,
  IntensityLevel,
} from '@/types/database'

/**
 * Get recommended scripts based on emotion and intensity
 * Returns 2-3 best-matching scripts sorted by relevance
 */
export async function getRecommendedScripts(
  emotion: EmotionLabel,
  intensity: IntensityLevel
): Promise<RegulationScript[]> {
  // Temporary workaround for Supabase type inference issue
  const supabase = createBrowserClient() as any

  // Fetch all scripts that match the emotion and intensity
  const { data: allScripts, error } = await supabase
    .from('regulation_scripts')
    .select('*')
    .contains('recommended_for_emotions', [emotion])
    .contains('recommended_for_intensities', [intensity])

  if (error) {
    throw new Error(`Failed to fetch regulation scripts: ${error.message}`)
  }

  // If we have scripts that match both criteria, return up to 3
  if (allScripts && allScripts.length > 0) {
    return allScripts.slice(0, 3)
  }

  // Fallback: Get scripts that match just the emotion
  const { data: emotionScripts, error: emotionError } = await supabase
    .from('regulation_scripts')
    .select('*')
    .contains('recommended_for_emotions', [emotion])

  if (emotionError) {
    throw new Error(`Failed to fetch emotion-based scripts: ${emotionError.message}`)
  }

  if (emotionScripts && emotionScripts.length > 0) {
    return emotionScripts.slice(0, 3)
  }

  // Final fallback: Return any 3 scripts
  const { data: fallbackScripts, error: fallbackError } = await supabase
    .from('regulation_scripts')
    .select('*')
    .limit(3)

  if (fallbackError) {
    throw new Error(`Failed to fetch fallback scripts: ${fallbackError.message}`)
  }

  return fallbackScripts || []
}

/**
 * Get a specific script by ID
 */
export async function getScriptById(id: string): Promise<RegulationScript | null> {
  // Temporary workaround for Supabase type inference issue
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('regulation_scripts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    throw new Error(`Failed to fetch script: ${error.message}`)
  }

  return data
}

/**
 * Get all available scripts (for admin/parent reference)
 */
export async function getAllScripts(): Promise<RegulationScript[]> {
  // Temporary workaround for Supabase type inference issue
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('regulation_scripts')
    .select('*')
    .order('name')

  if (error) {
    throw new Error(`Failed to fetch all scripts: ${error.message}`)
  }

  return data || []
}

/**
 * Get scripts by emotion (all intensities)
 */
export async function getScriptsByEmotion(
  emotion: EmotionLabel
): Promise<RegulationScript[]> {
  // Temporary workaround for Supabase type inference issue
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('regulation_scripts')
    .select('*')
    .contains('recommended_for_emotions', [emotion])

  if (error) {
    throw new Error(`Failed to fetch scripts for emotion: ${error.message}`)
  }

  return data || []
}

/**
 * Get scripts suitable for high intensity (4-5)
 * Useful for showing more intensive regulation techniques
 */
export async function getHighIntensityScripts(): Promise<RegulationScript[]> {
  // Temporary workaround for Supabase type inference issue
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('regulation_scripts')
    .select('*')
    .or('recommended_for_intensities.cs.{4,5}')

  if (error) {
    throw new Error(`Failed to fetch high intensity scripts: ${error.message}`)
  }

  return data || []
}

/**
 * Get scripts by duration range (for time-constrained sessions)
 */
export async function getScriptsByDuration(
  minSeconds: number,
  maxSeconds: number
): Promise<RegulationScript[]> {
  // Temporary workaround for Supabase type inference issue
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('regulation_scripts')
    .select('*')
    .gte('duration_seconds', minSeconds)
    .lte('duration_seconds', maxSeconds)

  if (error) {
    throw new Error(`Failed to fetch scripts by duration: ${error.message}`)
  }

  return data || []
}

/**
 * Calculate total duration of a script in milliseconds
 */
export function calculateScriptDuration(script: RegulationScript): number {
  return script.steps.reduce((total, step) => total + step.duration_ms, 0)
}

/**
 * Check if a script is recommended for given emotion and intensity
 */
export function isScriptRecommended(
  script: RegulationScript,
  emotion: EmotionLabel,
  intensity: IntensityLevel
): boolean {
  const matchesEmotion = script.recommended_for_emotions.includes(emotion)
  const matchesIntensity = script.recommended_for_intensities.includes(intensity)

  return matchesEmotion && matchesIntensity
}

/**
 * Get script statistics (for analytics)
 */
export async function getScriptUsageStats(): Promise<
  Array<{
    script_id: string
    script_name: string
    usage_count: number
    avg_intensity_delta: number
  }>
> {
  // Temporary workaround for Supabase type inference issue
  const supabase = createBrowserClient() as any

  // This would require joining with emotion_rounds table
  // For now, return basic script info
  const { data: scripts, error } = await supabase
    .from('regulation_scripts')
    .select('id, name')

  if (error) {
    throw new Error(`Failed to fetch script stats: ${error.message}`)
  }

  // In a full implementation, you'd query emotion_rounds to get actual usage stats
  // This is a placeholder structure
  return (scripts || []).map((script: any) => ({
    script_id: script.id,
    script_name: script.name,
    usage_count: 0,
    avg_intensity_delta: 0,
  }))
}
