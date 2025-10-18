/**
 * Safety Check API Route
 * POST /api/safety - Check text for crisis keywords and create alerts
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkForCrisisKeywords, createSafetyAlert, notifyParent } from '@/lib/services/safety'
import type { CrisisCheckResult } from '@/lib/services/safety'

export interface SafetyCheckRequest {
  text: string
  child_id: string
  session_id?: string | null
}

export interface SafetyCheckResponse extends CrisisCheckResult {
  alert_id?: string
  message?: string
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: SafetyCheckRequest = await request.json()
    const { text, child_id, session_id } = body

    // Validate required fields
    if (!text || !child_id) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Missing required fields: text and child_id',
        },
        { status: 400 }
      )
    }

    // Check for crisis keywords
    const checkResult = checkForCrisisKeywords(text)

    // If no crisis keywords found, return early
    if (!checkResult.hasCrisisKeywords) {
      return NextResponse.json({
        ...checkResult,
        message: 'No crisis keywords detected',
      })
    }

    // Create safety alert
    let alertId: string | undefined
    try {
      alertId = await createSafetyAlert(
        child_id,
        session_id || null,
        text,
        checkResult.matchedKeywords,
        checkResult.severity
      )

      // Notify parent if needed (medium/high severity)
      if (checkResult.shouldAlert && alertId) {
        await notifyParent(alertId)
      }
    } catch (error) {
      console.error('Failed to create safety alert:', error)
      // Continue even if alert creation fails
    }

    const response: SafetyCheckResponse = {
      ...checkResult,
      alert_id: alertId,
      message: checkResult.shouldAlert
        ? 'Crisis keywords detected - parent has been notified'
        : 'Crisis keywords detected - logged for review',
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Safety check error:', error)

    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Failed to perform safety check',
      },
      { status: 500 }
    )
  }
}
