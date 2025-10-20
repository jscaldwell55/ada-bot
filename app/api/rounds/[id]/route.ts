/**
 * Emotion Round Update API Route
 * PATCH /api/rounds/[id] - Update an emotion round
 */

import { NextRequest, NextResponse } from 'next/server'

// Disable caching to ensure fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { createServiceClient } from '@/lib/supabase/service'
import { updateRoundSchema } from '@/lib/validation/schemas'
import type { UpdateRoundResponse } from '@/types/api'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roundId = params.id

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateRoundSchema.parse(body)

    const supabase = createServiceClient() as any

    // Fetch the round to verify it exists and get current data
    const { data: existingRound, error: fetchError } = await supabase
      .from('emotion_rounds')
      .select(`
        *,
        sessions!inner(
          id,
          agent_enabled,
          completed_at,
          cumulative_context,
          children(age_band)
        )
      `)
      .eq('id', roundId)
      .single()

    if (fetchError || !existingRound) {
      return NextResponse.json(
        {
          error: 'not_found',
          message: 'Round not found',
        },
        { status: 404 }
      )
    }

    // Check if session is completed
    if (existingRound.sessions.completed_at) {
      return NextResponse.json(
        {
          error: 'session_completed',
          message: 'Cannot update rounds in a completed session',
        },
        { status: 400 }
      )
    }

    // Update the round with validated data
    const { data: updatedRound, error: updateError } = await supabase
      .from('emotion_rounds')
      .update(validatedData)
      .eq('id', roundId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update round:', updateError)
      return NextResponse.json(
        {
          error: 'database_error',
          message: 'Failed to update round',
          details: updateError,
        },
        { status: 500 }
      )
    }

    console.log(`✅ Round ${roundId} updated successfully`)

    // Check if we should trigger Observer agent
    // Trigger only if:
    // 1. post_intensity is being set (round is completing)
    // 2. Session has agents enabled
    // 3. All required data is available
    const isCompletingRound = validatedData.post_intensity !== undefined
    const agentsEnabled = existingRound.sessions.agent_enabled === true

    if (isCompletingRound && agentsEnabled) {
      // Trigger Observer agent asynchronously (fire-and-forget)
      triggerObserverAgent(updatedRound, existingRound.sessions)
        .catch((error) => {
          // Log error but don't fail the request
          console.error('Observer agent failed (non-blocking):', error)
        })
    }

    const response: UpdateRoundResponse = {
      round: updatedRound,
      is_correct: updatedRound.is_correct || false,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Round update error:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Invalid request data',
          details: error,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * Trigger Observer Agent (Non-blocking)
 * Called after round completion when agents are enabled
 */
async function triggerObserverAgent(round: any, session: any): Promise<void> {
  try {
    // Extract story data (agent-generated or static)
    let storyText = ''
    let storyTheme = ''
    let targetEmotion = ''

    if (round.action_agent_story) {
      // Agent-generated story
      storyText = round.action_agent_story.story_text
      storyTheme = round.action_agent_story.theme
      targetEmotion = round.action_agent_story.target_emotion
    } else if (round.story_id) {
      // Static story - fetch from database
      const supabase = createServiceClient() as any
      const { data: story } = await supabase
        .from('stories')
        .select('text, title, emotion')
        .eq('id', round.story_id)
        .single()

      if (story) {
        storyText = story.text
        storyTheme = story.title || 'Unknown theme'
        targetEmotion = story.emotion
      }
    }

    // Get regulation script name
    let scriptName = 'No script used'
    if (round.regulation_script_id) {
      const supabase = createServiceClient() as any
      const { data: script } = await supabase
        .from('regulation_scripts')
        .select('name')
        .eq('id', round.regulation_script_id)
        .single()

      if (script) {
        scriptName = script.name
      }
    }

    // Get previous observer context from cumulative_context
    const previousContext = session.cumulative_context &&
      Array.isArray(session.cumulative_context) &&
      session.cumulative_context.length > 0
      ? session.cumulative_context[round.round_number - 2]
      : null

    // Validate we have all required data
    if (!storyText || !round.labeled_emotion || !round.pre_intensity || !round.post_intensity) {
      console.warn('Missing required data for Observer agent, skipping')
      return
    }

    console.log(`🤖 Triggering Observer agent for round ${round.id}...`)

    // Call Observer agent endpoint (with timeout)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout

    const observerResponse = await fetch(`${baseUrl}/api/agent/observe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        round_id: round.id,
        round_number: round.round_number,
        story_text: storyText,
        story_theme: storyTheme,
        target_emotion: targetEmotion,
        labeled_emotion: round.labeled_emotion,
        pre_intensity: round.pre_intensity,
        post_intensity: round.post_intensity,
        script_name: scriptName,
        reflection_text: null,
        previous_context: previousContext,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (observerResponse.ok) {
      const observerData = await observerResponse.json()
      console.log(`✅ Observer agent completed for round ${round.id}`)

      // Update session cumulative_context
      if (observerData.success && observerData.context) {
        const supabase = createServiceClient() as any
        const currentContext = session.cumulative_context || []
        const updatedContext = [...currentContext]
        updatedContext[round.round_number - 1] = observerData.context

        await supabase
          .from('sessions')
          .update({ cumulative_context: updatedContext })
          .eq('id', session.id)

        console.log(`✅ Updated session cumulative_context`)
      }
    } else {
      console.warn(`Observer agent returned non-OK status: ${observerResponse.status}`)
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Observer agent timed out after 20s')
    } else {
      console.error('Observer agent error:', error)
    }
    // Don't throw - this is fire-and-forget
  }
}
