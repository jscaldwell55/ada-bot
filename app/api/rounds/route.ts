/**
 * Emotion Rounds API Route
 * POST /api/rounds - Create a new emotion round
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { createRoundSchema } from '@/lib/validation/schemas'
import type { CreateRoundResponse } from '@/types/api'
import type { InsertEmotionRound } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = createRoundSchema.parse(body)

    // Temporary workaround for Supabase type inference issue
    const supabase = createServerClient() as any

    // Verify session exists
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, completed_at')
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

    if (session.completed_at) {
      return NextResponse.json(
        {
          error: 'session_completed',
          message: 'Cannot add rounds to a completed session',
        },
        { status: 400 }
      )
    }

    // Verify story exists
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id')
      .eq('id', validatedData.story_id)
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

    // Create emotion round
    const roundData: InsertEmotionRound = {
      session_id: validatedData.session_id,
      round_number: validatedData.round_number,
      story_id: validatedData.story_id,
    }

    const { data: round, error: roundError } = await supabase
      .from('emotion_rounds')
      .insert(roundData)
      .select()
      .single()

    if (roundError) {
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
