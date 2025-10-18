/**
 * Action Agent - Story Generation API Route
 * POST /api/agent/generate-story - Generate adaptive, context-aware stories
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { actionAgentStoryInputSchema, actionAgentStoryOutputSchema } from '@/lib/validation/schemas'
import { ACTION_AGENT_STORY_SYSTEM_PROMPT, AGENT_MODEL_CONFIG, FALLBACK_MESSAGES } from '@/lib/agents/prompts'
import { validateStoryOutput } from '@/lib/services/agentSafety'
import { callOpenAIWithTimeout, AGENT_TIMEOUTS, OpenAITimeoutError } from '@/lib/agents/openai-client'
import { logStoryGeneration, logAgentAction, logFallback, logSafetyCheck } from '@/lib/services/agentLogger'
import type { ActionAgentStoryOutput } from '@/types/agents'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Log request started
    logAgentAction('Story Generation Request Started', { timestamp: new Date().toISOString() })

    // Parse and validate request body
    const body = await request.json()
    const validatedInput = actionAgentStoryInputSchema.parse(body)

    // 2. Log input validation
    logAgentAction('Story Generation Input Validated', {
      sessionId: validatedInput.session_id || 'unknown',
      roundNumber: validatedInput.round_number,
      recommendedEmotion: validatedInput.recommended_emotion,
      hasObserverSummary: !!validatedInput.observer_summary,
    })

    const supabase = createClient()

    // Fetch child details
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('age_band, nickname')
      .eq('id', validatedInput.child_id)
      .single()

    if (childError || !child) {
      return NextResponse.json({
        success: false,
        error: 'not_found',
        message: 'Child not found',
      }, { status: 404 })
    }

    // Store child data with explicit typing to help TypeScript
    const childData: { age_band: string; nickname: string } = child

    // Fetch example stories for reference (same age band)
    const { data: exampleStories } = await supabase
      .from('stories')
      .select('*')
      .eq('age_band', childData.age_band)
      .limit(5)

    // Build context for story generation
    const userPrompt = JSON.stringify({
      child_profile: {
        age_band: childData.age_band,
        round_number: validatedInput.round_number,
      },
      observer_guidance: validatedInput.observer_summary ? {
        recommended_theme: validatedInput.observer_summary.recommended_next_theme,
        recommended_emotion: validatedInput.observer_summary.recommended_emotion_focus,
        recommended_complexity: validatedInput.observer_summary.recommended_complexity,
        contextual_insights: validatedInput.observer_summary.contextual_insights,
      } : {
        recommended_theme: validatedInput.recommended_theme || 'everyday challenge',
        recommended_emotion: validatedInput.recommended_emotion || 'happy',
        recommended_complexity: validatedInput.recommended_complexity || 2,
      },
      example_stories_for_reference: exampleStories?.slice(0, 3).map((s: any) => ({
        text: s.text,
        emotion: s.emotion,
        age_band: s.age_band,
      })),
    })

    // Call OpenAI with Action Agent story prompt (with timeout protection)
    const completion = await callOpenAIWithTimeout(
      () => openai.chat.completions.create({
        model: AGENT_MODEL_CONFIG.action_story.model,
        temperature: AGENT_MODEL_CONFIG.action_story.temperature,
        max_tokens: AGENT_MODEL_CONFIG.action_story.max_tokens,
        response_format: AGENT_MODEL_CONFIG.action_story.response_format,
        messages: [
          {
            role: 'system',
            content: ACTION_AGENT_STORY_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
      AGENT_TIMEOUTS.action_story  // 10 second timeout
    )

    const responseContent = completion.choices[0].message.content
    if (!responseContent) {
      throw new Error('Empty response from OpenAI')
    }

    // Parse and validate story output
    const rawOutput = JSON.parse(responseContent)
    const storyOutput = actionAgentStoryOutputSchema.parse(rawOutput)

    // Run safety validation
    const safetyResult = await validateStoryOutput(storyOutput)

    // 3. Log safety check
    logSafetyCheck(storyOutput.story_text, safetyResult.passed, safetyResult.flags || [], {
      agentType: 'action_story',
    })

    if (!safetyResult.passed) {
      console.warn('Generated story failed safety check:', safetyResult.reason)
      logFallback('action_story', 'Safety check failed', {
        flags: safetyResult.flags,
        reason: safetyResult.reason,
      })

      // Fallback to static story
      const { data: fallbackStory }: { data: any } = await supabase
        .from('stories')
        .select('*')
        .eq('age_band', childData.age_band)
        .eq('emotion', validatedInput.recommended_emotion || 'happy')
        .limit(1)
        .single()

      const fallbackOutput: ActionAgentStoryOutput = fallbackStory ? {
        story_text: fallbackStory.text,
        target_emotion: fallbackStory.emotion,
        theme: fallbackStory.title,
        complexity_score: fallbackStory.complexity_score,
      } : {
        story_text: FALLBACK_MESSAGES.story.text,
        target_emotion: FALLBACK_MESSAGES.story.target_emotion,
        theme: FALLBACK_MESSAGES.story.theme,
        complexity_score: FALLBACK_MESSAGES.story.complexity_score,
      }

      return NextResponse.json({
        success: true,
        story: fallbackOutput,
        fallback_used: true,
        safety_result: safetyResult,
        generation_metadata: null, // No metadata for safety fallback
      }, { status: 200 })
    }

    const generationTimeMs = Date.now() - startTime
    const tokensUsed = completion.usage?.total_tokens || null

    // 4. Log to agent_generations table (fire-and-forget)
    // Note: round_id will be added later via POST /api/rounds
    logStoryGeneration(
      validatedInput.session_id || '',
      undefined, // round_id not available yet
      validatedInput,
      storyOutput,
      generationTimeMs,
      safetyResult.flags
    ).catch(() => {}) // Non-blocking

    // Return generation metadata for logging after round creation
    // (We don't have round_id yet, so we can't log to agent_generations here)
    const generationMetadata = {
      agent_type: 'action_story' as const,
      input_context: validatedInput,
      output_content: storyOutput,
      model_version: AGENT_MODEL_CONFIG.action_story.model,
      safety_flags: safetyResult.flags || [],
      generation_time_ms: generationTimeMs,
      tokens_used: tokensUsed,
    }

    return NextResponse.json({
      success: true,
      story: storyOutput,
      fallback_used: false,
      safety_result: safetyResult,
      generation_metadata: generationMetadata, // Return for later logging
    }, { status: 200 })

  } catch (error) {
    const generationTimeMs = Date.now() - startTime
    console.error('Action Agent (Story) error:', error)

    // 5. Log errors
    // Handle timeout errors - fallback to static story
    if (error instanceof OpenAITimeoutError) {
      console.warn('Story generation timed out, using fallback')
      logFallback('action_story', 'OpenAI timeout', { timeMs: generationTimeMs })
      return NextResponse.json({
        success: true,
        story: {
          story_text: FALLBACK_MESSAGES.story.text,
          target_emotion: FALLBACK_MESSAGES.story.target_emotion,
          theme: FALLBACK_MESSAGES.story.theme,
          complexity_score: FALLBACK_MESSAGES.story.complexity_score,
        },
        fallback_used: true,
        safety_result: { passed: false, flags: ['timeout_error'], reason: 'Generation timed out' },
        generation_metadata: null,
      }, { status: 200 })
    }

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      logAgentAction('Story Generation Error', {
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

    // Return fallback story on any error
    logFallback('action_story', 'Generation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timeMs: generationTimeMs,
    })
    return NextResponse.json({
      success: true,
      story: {
        story_text: FALLBACK_MESSAGES.story.text,
        target_emotion: FALLBACK_MESSAGES.story.target_emotion,
        theme: FALLBACK_MESSAGES.story.theme,
        complexity_score: FALLBACK_MESSAGES.story.complexity_score,
      },
      fallback_used: true,
      safety_result: { passed: false, flags: ['error_occurred'], reason: 'Generation failed' },
      generation_metadata: null, // No metadata for fallback
    }, { status: 200 })
  }
}
