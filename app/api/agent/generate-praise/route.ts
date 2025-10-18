/**
 * Action Agent - Praise Generation API Route
 * POST /api/agent/generate-praise - Generate personalized, context-aware praise
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { actionAgentPraiseInputSchema, actionAgentPraiseOutputSchema } from '@/lib/validation/schemas'
import { ACTION_AGENT_PRAISE_SYSTEM_PROMPT, AGENT_MODEL_CONFIG, FALLBACK_MESSAGES } from '@/lib/agents/prompts'
import { validatePraiseOutput } from '@/lib/services/agentSafety'
import { callOpenAIWithTimeout, AGENT_TIMEOUTS, OpenAITimeoutError } from '@/lib/agents/openai-client'
import { logPraiseGeneration, logAgentAction, logFallback, logSafetyCheck } from '@/lib/services/agentLogger'
import type { ActionAgentPraiseOutput } from '@/types/agents'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Log request started
    logAgentAction('Praise Generation Request Started', { timestamp: new Date().toISOString() })

    // Parse and validate request body
    const body = await request.json()
    const validatedInput = actionAgentPraiseInputSchema.parse(body)

    // 2. Log input validation
    logAgentAction('Praise Generation Input Validated', {
      roundId: body.round_id,
      nickname: validatedInput.child_nickname,
      isCorrect: validatedInput.is_correct,
      intensityDelta: validatedInput.intensity_delta,
    })

    // Build context for praise generation
    const userPrompt = JSON.stringify({
      child: {
        nickname: validatedInput.child_nickname,
        age_band: validatedInput.age_band,
      },
      performance: {
        labeled_emotion: validatedInput.labeled_emotion,
        is_correct: validatedInput.is_correct,
        pre_intensity: validatedInput.pre_intensity,
        post_intensity: validatedInput.post_intensity,
        intensity_delta: validatedInput.intensity_delta,
        script_used: validatedInput.script_used,
      },
      context: {
        round_number: validatedInput.round_number,
        total_rounds: validatedInput.total_rounds,
        is_last_round: validatedInput.round_number >= validatedInput.total_rounds,
      },
      observer_insights: validatedInput.observer_analysis ? {
        regulation_effectiveness: validatedInput.observer_analysis.regulation_effectiveness,
        contextual_insights: validatedInput.observer_analysis.contextual_insights,
        confidence_score: validatedInput.observer_analysis.confidence_score,
      } : null,
    })

    // Call OpenAI with Action Agent praise prompt (with timeout protection)
    const completion = await callOpenAIWithTimeout(
      () => openai.chat.completions.create({
        model: AGENT_MODEL_CONFIG.action_praise.model,
        temperature: AGENT_MODEL_CONFIG.action_praise.temperature,
        max_tokens: AGENT_MODEL_CONFIG.action_praise.max_tokens,
        response_format: AGENT_MODEL_CONFIG.action_praise.response_format,
        messages: [
          {
            role: 'system',
            content: ACTION_AGENT_PRAISE_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
      AGENT_TIMEOUTS.action_praise  // 5 second timeout
    )

    const responseContent = completion.choices[0].message.content
    if (!responseContent) {
      throw new Error('Empty response from OpenAI')
    }

    // Parse and validate praise output
    const rawOutput = JSON.parse(responseContent)
    const praiseOutput: ActionAgentPraiseOutput = actionAgentPraiseOutputSchema.parse(rawOutput)

    // Run safety validation
    const safetyResult = await validatePraiseOutput(praiseOutput)

    // 3. Log safety check
    logSafetyCheck(praiseOutput.praise_message, safetyResult.passed, safetyResult.flags || [], {
      agentType: 'action_praise',
    })

    if (!safetyResult.passed) {
      console.warn('Generated praise failed safety check:', safetyResult.reason)
      logFallback('action_praise', 'Safety check failed', {
        flags: safetyResult.flags,
        reason: safetyResult.reason,
      })

      // Fallback to generic praise
      const fallbackMessage = FALLBACK_MESSAGES.praise(validatedInput.child_nickname)

      const fallbackOutput: ActionAgentPraiseOutput = {
        praise_message: fallbackMessage,
        highlights: validatedInput.is_correct ? ['Identified the emotion'] : ['Tried hard'],
        encouragement_focus: 'Keep practicing!',
        badge_emoji: validatedInput.is_correct && validatedInput.intensity_delta < 0 ? '🏆' : '✨',
      }

      return NextResponse.json({
        success: true,
        praise: fallbackOutput,
        fallback_used: true,
        safety_result: safetyResult,
      }, { status: 200 })
    }

    const generationTimeMs = Date.now() - startTime

    // 4. Log to agent_generations table (fire-and-forget)
    // Note: round_id is available in the body if provided
    if (body.round_id) {
      logPraiseGeneration(
        body.round_id,
        validatedInput,
        praiseOutput,
        generationTimeMs,
        safetyResult.flags
      ).catch(() => {}) // Non-blocking
    } else {
      // Just console log if no round_id
      logAgentAction('Praise Generation Complete', {
        praiseLength: praiseOutput.praise_message.length,
        badgeEmoji: praiseOutput.badge_emoji,
        timeMs: generationTimeMs,
      })
    }

    return NextResponse.json({
      success: true,
      praise: praiseOutput,
      fallback_used: false,
      safety_result: safetyResult,
    }, { status: 200 })

  } catch (error) {
    const generationTimeMs = Date.now() - startTime
    console.error('Action Agent (Praise) error:', error)

    const body = await request.json().catch(() => ({}))
    const fallbackNickname = body.child_nickname || 'friend'
    const fallbackMessage = FALLBACK_MESSAGES.praise(fallbackNickname)

    // 5. Log errors
    // Handle timeout errors - fallback to generic praise
    if (error instanceof OpenAITimeoutError) {
      console.warn('Praise generation timed out, using fallback')
      logFallback('action_praise', 'OpenAI timeout', { timeMs: generationTimeMs })
      return NextResponse.json({
        success: true,
        praise: {
          praise_message: fallbackMessage,
          highlights: ['Completed the activity'],
          encouragement_focus: 'Keep practicing!',
          badge_emoji: '✨',
        },
        fallback_used: true,
        safety_result: { passed: false, flags: ['timeout_error'], reason: 'Generation timed out' },
      }, { status: 200 })
    }

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      logAgentAction('Praise Generation Error', {
        error: 'validation_error',
        message: error.message,
        timeMs: generationTimeMs,
      }, 'error')
      return NextResponse.json({
        success: false,
        error: 'validation_error',
        message: 'Invalid request data or response format',
        details: error,
      }, { status: 400 })
    }

    // Return fallback praise on any error
    logFallback('action_praise', 'Generation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timeMs: generationTimeMs,
    })
    return NextResponse.json({
      success: true,
      praise: {
        praise_message: fallbackMessage,
        highlights: ['Participated in the activity'],
        encouragement_focus: 'Keep going!',
        badge_emoji: '🎉',
      },
      fallback_used: true,
      safety_result: { passed: false, flags: ['error_occurred'], reason: 'Generation failed' },
    }, { status: 200 })
  }
}
