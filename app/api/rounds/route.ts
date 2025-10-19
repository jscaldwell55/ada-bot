/**
 * Emotion Rounds API Route
 * POST /api/rounds - Create a new emotion round
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { createRoundSchema } from '@/lib/validation/schemas'
import type { CreateRoundResponse } from '@/types/api'
import type { InsertEmotionRound } from '@/types/database'
import { logStoryGeneration } from '@/lib/services/agentLogger'

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = createRoundSchema.parse(body)

    // Temporary workaround for Supabase type inference issue
    const supabase = createServerClient() as any

    // IDEMPOTENCY CHECK: Check if round already exists first
    const { data: existingRound } = await supabase
      .from('emotion_rounds')
      .select()
      .eq('session_id', validatedData.session_id)
      .eq('round_number', validatedData.round_number)
      .maybeSingle()

    if (existingRound) {
      console.log(`✓ Round ${validatedData.round_number} already exists for session ${validatedData.session_id}, returning existing`)
      const response: CreateRoundResponse = {
        round: existingRound,
      }
      return NextResponse.json(response, { status: 200 })
    }

    // Verify session exists and get agent settings + child age_band
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, completed_at, agent_enabled, child_id, cumulative_context, children(age_band)')
      .eq('id', validatedData.session_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        {
          error: 'not_found',
          message: 'Session not found',
        },
        { status: 404 }
      )
    }

    // Extract age_band from the joined children table
    const childAgeBand = (session.children as any)?.age_band || '8-9'

    if (session.completed_at) {
      return NextResponse.json(
        {
          error: 'session_completed',
          message: 'Cannot add rounds to a completed session',
        },
        { status: 400 }
      )
    }

    let storyId: string | null = validatedData.story_id || null
    let generatedStory = null

    // If agents are enabled, generate a story dynamically
    if (session.agent_enabled) {
      try {
        // Get Observer context from previous round
        const previousContext = session.cumulative_context &&
                               (session.cumulative_context as any[]).length > 0
                               ? (session.cumulative_context as any[])[validatedData.round_number - 2]
                               : null

        console.log(`🤖 Generating adaptive story for round ${validatedData.round_number}...`)

        // Call story generation API with timeout protection
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

        const storyGenResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/agent/generate-story`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              child_id: session.child_id,
              session_id: validatedData.session_id, // Add session_id for logging
              age_band: childAgeBand,
              observer_summary: previousContext,
              round_number: validatedData.round_number,
            }),
            signal: controller.signal,
          }
        )

        clearTimeout(timeoutId)
        const storyGenData = await storyGenResponse.json()

        if (storyGenData.success && storyGenData.story) {
          generatedStory = storyGenData.story
          console.log(`✅ Generated adaptive story: "${generatedStory.story_text.substring(0, 50)}..."`)
          // Store generation metadata for later logging
          if (storyGenData.generation_metadata) {
            // We'll log this after round creation
            (body as any).storyGenerationMetadata = storyGenData.generation_metadata
          }
        } else {
          console.log('⚠️ Story generation used fallback')
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.error('Story generation timed out after 15s, using static fallback')
        } else {
          console.error('Story generation failed, using static fallback:', error)
        }
        // Continue with static story selection
      }
    }

    // If no generated story (agents disabled or generation failed), use fallback
    if (!generatedStory) {
      if (session.agent_enabled) {
        // Agent was enabled but generation failed - use a hardcoded fallback story
        console.log('Using hardcoded fallback story after agent generation failure')
        generatedStory = {
          story_text: "You're walking to school and you notice a friend sitting alone on a bench. They look a bit sad. What would you do?",
          target_emotion: "empathy",
          theme: "helping a friend",
          complexity_score: 2,
        }
      } else {
        // Agents disabled - story_id is required
        if (!storyId) {
          return NextResponse.json(
            {
              error: 'validation_error',
              message: 'story_id is required when agents are disabled',
            },
            { status: 400 }
          )
        }

        const { data: story, error: storyError } = await supabase
          .from('stories')
          .select('id')
          .eq('id', storyId)
          .single()

        if (storyError || !story) {
          return NextResponse.json(
            {
              error: 'not_found',
              message: 'Story not found',
            },
            { status: 404 }
          )
        }
      }
    }

    console.log(`📝 Creating round ${validatedData.round_number} for session ${validatedData.session_id}...`)

    // Create emotion round - let TypeScript infer the type
    const roundData = {
      session_id: validatedData.session_id,
      round_number: validatedData.round_number,
      ...(storyId && { story_id: storyId }), // Only include if not null
      action_agent_story: generatedStory,
    } as InsertEmotionRound

    const { data: round, error: roundError } = await supabase
      .from('emotion_rounds')
      .insert(roundData)
      .select()
      .single()

    if (roundError) {
      // Handle duplicate key error - race condition
      if (roundError.code === '23505') {
        console.log('⚠️ Race condition detected, fetching existing round...')
        const { data: racedRound, error: fetchError } = await supabase
          .from('emotion_rounds')
          .select()
          .eq('session_id', validatedData.session_id)
          .eq('round_number', validatedData.round_number)
          .single()

        if (fetchError || !racedRound) {
          console.error('Failed to fetch existing round:', fetchError)
          return NextResponse.json(
            {
              error: 'database_error',
              message: 'Round already exists but could not be retrieved',
            },
            { status: 500 }
          )
        }

        // Return existing round with 200 (not 201 since we didn't create it)
        const response: CreateRoundResponse = {
          round: racedRound,
        }
        return NextResponse.json(response, { status: 200 })
      }

      console.error('Failed to create round:', roundError)
      return NextResponse.json(
        {
          error: 'database_error',
          message: 'Failed to create emotion round',
          details: roundError,
        },
        { status: 500 }
      )
    }

    console.log(`✅ Round ${validatedData.round_number} created successfully`)

    // Log story generation with proper round_id now that round is created
    if (generatedStory && (body as any).storyGenerationMetadata) {
      const metadata = (body as any).storyGenerationMetadata
      logStoryGeneration(
        validatedData.session_id,
        round.id, // Now we have the round_id
        metadata.input_context,
        metadata.output_content,
        metadata.generation_time_ms,
        metadata.safety_flags
      ).catch(() => {}) // Fire-and-forget
    }

    const response: CreateRoundResponse = {
      round,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Round creation error:', error)

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