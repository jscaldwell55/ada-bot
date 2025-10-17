/**
 * Emotion Round Update API Route
 * PATCH /api/rounds/[id] - Update emotion round with labeled emotion, intensities, etc.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { updateRoundSchema } from '@/lib/validation/schemas'
import type { UpdateRoundResponse } from '@/types/api'
import type { UpdateEmotionRound, IntensityLevel } from '@/types/database'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roundId = params.id

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(roundId)) {
      return NextResponse.json(
        {
          error: 'invalid_id',
          message: 'Invalid round ID format',
        },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateRoundSchema.parse(body)

    // Temporary workaround for Supabase type inference issue
    const supabase = createServerClient() as any

    // Fetch current round to check if it exists and get story info
    const { data: currentRound, error: fetchError } = await supabase
      .from('emotion_rounds')
      .select(
        `
        *,
        story:stories(*)
      `
      )
      .eq('id', roundId)
      .single()

    if (fetchError || !currentRound) {
      return NextResponse.json(
        {
          error: 'not_found',
          message: 'Emotion round not found',
        },
        { status: 404 }
      )
    }

    // Build update data - cast intensity levels to proper type
    const updateData: UpdateEmotionRound = {
      labeled_emotion: validatedData.labeled_emotion,
      pre_intensity: validatedData.pre_intensity as IntensityLevel | undefined,
      regulation_script_id: validatedData.regulation_script_id,
      post_intensity: validatedData.post_intensity as IntensityLevel | undefined,
      praise_message: validatedData.praise_message,
      is_correct: validatedData.is_correct,
      completed_at: validatedData.completed_at,
    }

    // If labeled_emotion is provided, check if it's correct
    if (validatedData.labeled_emotion && currentRound.story) {
      updateData.is_correct =
        validatedData.labeled_emotion === currentRound.story.emotion
    }

    // Update the round
    const { data: updatedRound, error: updateError } = await supabase
      .from('emotion_rounds')
      .update(updateData)
      .eq('id', roundId)
      .select(
        `
        *,
        story:stories(*),
        regulation_script:regulation_scripts(*)
      `
      )
      .single()

    if (updateError) {
      console.error('Failed to update round:', updateError)
      return NextResponse.json(
        {
          error: 'database_error',
          message: 'Failed to update emotion round',
          details: updateError,
        },
        { status: 500 }
      )
    }

    // If round is completed, update session completed_rounds count
    if (validatedData.completed_at) {
      const { data: session } = await supabase
        .from('sessions')
        .select('completed_rounds, total_rounds')
        .eq('id', currentRound.session_id)
        .single()

      if (session) {
        const newCompletedRounds = session.completed_rounds + 1
        const sessionUpdate: any = {
          completed_rounds: newCompletedRounds,
        }

        // If all rounds completed, mark session as complete
        if (newCompletedRounds >= session.total_rounds) {
          sessionUpdate.completed_at = new Date().toISOString()
        }

        await supabase
          .from('sessions')
          .update(sessionUpdate)
          .eq('id', currentRound.session_id)
      }
    }

    const response: UpdateRoundResponse = {
      round: updatedRound,
      is_correct: updatedRound.is_correct ?? false,
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
