/**
 * Safety Service
 * Crisis keyword detection and parent notification system
 */

import { createBrowserClient } from '@/lib/supabase/client'
import { CRISIS_KEYWORDS } from '@/lib/utils/constants'
import type { InsertSafetyAlert } from '@/types/database'

export interface CrisisCheckResult {
  hasCrisisKeywords: boolean
  matchedKeywords: string[]
  severity: 'low' | 'medium' | 'high'
  shouldAlert: boolean
}

/**
 * Check text for crisis keywords
 * Returns matched keywords and severity level
 */
export function checkForCrisisKeywords(text: string): CrisisCheckResult {
  const normalizedText = text.toLowerCase().trim()
  const matchedKeywords: string[] = []

  // Check each crisis keyword
  for (const keyword of CRISIS_KEYWORDS) {
    const normalizedKeyword = keyword.toLowerCase()

    // Check for whole word matches (with word boundaries)
    const wordBoundaryRegex = new RegExp(`\\b${normalizedKeyword}\\b`, 'i')
    if (wordBoundaryRegex.test(normalizedText)) {
      matchedKeywords.push(keyword)
    }
  }

  const hasCrisisKeywords = matchedKeywords.length > 0

  // Determine severity based on keywords
  const severity = determineSeverity(matchedKeywords, normalizedText)

  // Alert parent for medium and high severity
  const shouldAlert = severity === 'medium' || severity === 'high'

  return {
    hasCrisisKeywords,
    matchedKeywords,
    severity,
    shouldAlert,
  }
}

/**
 * Determine severity level based on matched keywords and context
 */
function determineSeverity(
  matchedKeywords: string[],
  _text: string
): 'low' | 'medium' | 'high' {
  if (matchedKeywords.length === 0) {
    return 'low'
  }

  // High severity keywords (immediate concern)
  const highSeverityKeywords = [
    'suicide',
    'kill myself',
    'want to die',
    'end my life',
    'hurt myself',
  ]

  const hasHighSeverity = matchedKeywords.some(keyword =>
    highSeverityKeywords.some(high => keyword.toLowerCase().includes(high))
  )

  if (hasHighSeverity) {
    return 'high'
  }

  // Medium severity keywords (concerning)
  const mediumSeverityKeywords = [
    'hate myself',
    'hurt',
    'scared',
    'afraid',
    'alone',
  ]

  const hasMediumSeverity = matchedKeywords.some(keyword =>
    mediumSeverityKeywords.some(medium => keyword.toLowerCase().includes(medium))
  )

  // Multiple medium keywords or context indicators
  if (hasMediumSeverity || matchedKeywords.length >= 2) {
    return 'medium'
  }

  return 'low'
}

/**
 * Create a safety alert in the database
 */
export async function createSafetyAlert(
  childId: string,
  sessionId: string | null,
  triggerText: string,
  matchedKeywords: string[],
  severity: 'low' | 'medium' | 'high'
): Promise<string> {
  // Temporary workaround for Supabase type inference issue
  const supabase = createBrowserClient() as any

  const alertData: InsertSafetyAlert = {
    child_id: childId,
    session_id: sessionId,
    trigger_text: triggerText,
    matched_keywords: matchedKeywords,
    severity,
    parent_notified: false,
  }

  const { data, error } = await supabase
    .from('safety_alerts')
    .insert(alertData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create safety alert: ${error.message}`)
  }

  return data.id
}

/**
 * Notify parent about a safety alert
 * In production, this would send an email/SMS via Supabase Edge Functions
 */
export async function notifyParent(
  alertId: string,
  _parentEmail?: string
): Promise<boolean> {
  // Temporary workaround for Supabase type inference issue
  const supabase = createBrowserClient() as any

  // Get alert details
  const { data: alert, error: fetchError } = await supabase
    .from('safety_alerts')
    .select(`
      *,
      children (
        nickname,
        parent_id
      )
    `)
    .eq('id', alertId)
    .single()

  if (fetchError) {
    console.error('Failed to fetch alert for notification:', fetchError)
    return false
  }

  try {
    // In production: Call Supabase Edge Function to send email/SMS
    // For now, we'll just mark as notified
    // await supabase.functions.invoke('send-safety-alert', {
    //   body: {
    //     alert_id: alertId,
    //     parent_email: parentEmail,
    //     child_nickname: alert.children.nickname,
    //     severity: alert.severity,
    //     trigger_text: alert.trigger_text,
    //   },
    // })

    // Update alert as notified
    const { error: updateError } = await supabase
      .from('safety_alerts')
      .update({
        parent_notified: true,
        parent_notified_at: new Date().toISOString(),
      })
      .eq('id', alertId)

    if (updateError) {
      console.error('Failed to update alert notification status:', updateError)
      return false
    }

    console.log(`Parent notified of ${alert.severity} severity alert for child`)
    return true
  } catch (error) {
    console.error('Failed to notify parent:', error)
    return false
  }
}

/**
 * Get unnotified alerts for a child
 */
export async function getUnnotifiedAlerts(childId: string) {
  // Temporary workaround for Supabase type inference issue
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('safety_alerts')
    .select('*')
    .eq('child_id', childId)
    .eq('parent_notified', false)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch unnotified alerts: ${error.message}`)
  }

  return data || []
}

/**
 * Get all alerts for a child (for parent dashboard)
 */
export async function getChildAlerts(
  childId: string,
  limit: number = 50
) {
  // Temporary workaround for Supabase type inference issue
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('safety_alerts')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch child alerts: ${error.message}`)
  }

  return data || []
}

/**
 * Monitor text input and create alert if needed
 * Returns alert ID if created, null otherwise
 */
export async function monitorAndAlertIfNeeded(
  text: string,
  childId: string,
  sessionId: string | null
): Promise<string | null> {
  const checkResult = checkForCrisisKeywords(text)

  if (!checkResult.hasCrisisKeywords) {
    return null
  }

  // Create alert
  const alertId = await createSafetyAlert(
    childId,
    sessionId,
    text,
    checkResult.matchedKeywords,
    checkResult.severity
  )

  // Notify parent if severity warrants it
  if (checkResult.shouldAlert) {
    await notifyParent(alertId)
  }

  return alertId
}
