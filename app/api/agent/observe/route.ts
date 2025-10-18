/**
 * Observer Agent API Route
 * POST /api/agent/observe - Analyze child's emotional learning trajectory
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { observerAgentInputSchema, observerAgentOutputSchema } from '@/lib/validation/schemas'
import { OBSERVER_AGENT_SYSTEM_PROMPT, AGENT_MODEL_CONFIG } from '@/lib/agents/prompts'
import { callOpenAIWithTimeout, AGENT_TIMEOUTS, OpenAITimeoutError } from '@/lib/agents/openai-client'
import { logObserverAnalysis, logAgentAction, logFallback } from '@/lib/services/agentLogger'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Log request started
    logAgentAction('Observer Request Started', { timestamp: new Date().toISOString() })

    // Parse and validate request body
    const body = await request.json()
    const validatedInput = observerAgentInputSchema.parse(body)

    // 2. Log input validation
    logAgentAction('Observer Input Validated', {
      roundId: validatedInput.round_id,
      roundNumber: validatedInput.round_number,
      emotion: validatedInput.labeled_emotion,
      intensityChange: validatedInput.post_intensity - validatedInput.pre_intensity,
    })

    // Call OpenAI with Observer prompt (with timeout protection)
    const completion = await callOpenAIWithTimeout(
      () => openai.chat.completions.create({
        model: AGENT_MODEL_CONFIG.observer.model,
        temperature: AGENT_MODEL_CONFIG.observer.temperature,
        max_tokens: AGENT_MODEL_CONFIG.observer.max_tokens,
        response_format: AGENT_MODEL_CONFIG.observer.response_format,
        messages: [
          {
            role: 'system',
            content: OBSERVER_AGENT_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: JSON.stringify({
              round_id: validatedInput.round_id,
              round_number: validatedInput.round_number,
              story: {
                text: validatedInput.story_text,
                theme: validatedInput.story_theme,
                target_emotion: validatedInput.target_emotion,
              },
              child_response: {
                labeled_emotion: validatedInput.labeled_emotion,
                pre_intensity: validatedInput.pre_intensity,
                post_intensity: validatedInput.post_intensity,
                script_used: validatedInput.script_name,
                reflection: validatedInput.reflection_text || null,
              },
              previous_context: validatedInput.previous_context || null,
            }),
          },
        ],
      }),
      AGENT_TIMEOUTS.observer  // 15 second timeout
    )

    const responseContent = completion.choices[0].message.content
    if (!responseContent) {
      throw new Error('Empty response from OpenAI')
    }

    // Parse and validate Observer output
    const rawOutput = JSON.parse(responseContent)
    const observerOutput = observerAgentOutputSchema.parse(rawOutput)

    const generationTimeMs = Date.now() - startTime
    const tokensUsed = completion.usage?.total_tokens || null

    // 3. Log to agent_generations table (fire-and-forget)
    logObserverAnalysis(
      validatedInput.round_id,
      validatedInput,
      observerOutput,
      generationTimeMs
    ).catch(() => {}) // Non-blocking

    // Store in database
    const supabase = createClient()

    // Update emotion_rounds with observer context
    const { error: updateError } = await supabase
      .from('emotion_rounds')
      // @ts-ignore - Supabase type inference issue with complex nested objects
      .update({
        observer_context: observerOutput as any,
        generation_metadata: {
          agent_type: 'observer',
          model_version: AGENT_MODEL_CONFIG.observer.model,
          generation_timestamp: new Date().toISOString(),
          generation_time_ms: generationTimeMs,
          tokens_used: tokensUsed,
          safety_flags: ['schema_validated'],
          fallback_used: false,
        }
      })
      .eq('id', validatedInput.round_id)

    if (updateError) {
      console.error('Failed to update emotion_rounds with observer context:', updateError)
      // Continue even if update fails - we'll return the context
    }

    // Update session cumulative context
    try {
      const { data: round }: { data: any } = await supabase
        .from('emotion_rounds')
        .select('session_id')
        .eq('id', validatedInput.round_id)
        .single()

      if (round) {
        const { data: session }: { data: any } = await supabase
          .from('sessions')
          .select('cumulative_context')
          .eq('id', round.session_id)
          .single()

        const cumulativeContext = (session?.cumulative_context as any[]) || []
        cumulativeContext.push(observerOutput)

        await supabase
          .from('sessions')
          // @ts-ignore - Supabase type inference issue
          .update({ cumulative_context: cumulativeContext as any })
          .eq('id', round.session_id)
      }
    } catch (error) {
      console.error('Failed to update cumulative context:', error)
      // Continue even if cumulative update fails
    }

    return NextResponse.json({
      success: true,
      context: observerOutput,
    }, { status: 200 })

  } catch (error) {
    const generationTimeMs = Date.now() - startTime
    console.error('Observer Agent error:', error)

    // 4. Log errors
    // Handle timeout errors
    if (error instanceof OpenAITimeoutError) {
      logFallback('observer', 'OpenAI timeout', { timeMs: generationTimeMs })
      return NextResponse.json({
        success: false,
        error: 'timeout_error',
        message: 'Observer analysis timed out - please try again',
        details: error.message,
      }, { status: 504 })  // 504 Gateway Timeout
    }

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      logAgentAction('Observer Error', {
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

    // Handle OpenAI errors
    if (error instanceof Error && error.message.includes('OpenAI')) {
      logAgentAction('Observer Error', {
        error: 'openai_error',
        message: error.message,
        timeMs: generationTimeMs,
      }, 'error')
      return NextResponse.json({
        success: false,
        error: 'openai_error',
        message: 'Failed to generate Observer analysis',
        details: error.message,
      }, { status: 500 })
    }

    // Generic error
    logAgentAction('Observer Error', {
      error: 'internal_error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timeMs: generationTimeMs,
    }, 'error')
    return NextResponse.json({
      success: false,
      error: 'internal_error',
      message: 'An unexpected error occurred',
    }, { status: 500 })
  }
}
