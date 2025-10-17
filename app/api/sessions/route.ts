/**
 * Sessions API Route
 * POST /api/sessions - Create a new session with random stories
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { createSessionSchema } from '@/lib/validation/schemas'
import { getRandomStories } from '@/lib/services/stories'
import type { CreateSessionResponse } from '@/types/api'
import type { InsertSession } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = createSessionSchema.parse(body)

    // Create Supabase client (temporary workaround for type inference issue)
    const supabase = createServerClient() as any

    // Fetch child to get age_band
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('*')
      .eq('id', validatedData.child_id)
      .single()

    if (childError || !child) {
      return NextResponse.json(
        {
          error: 'not_found',
          message: 'Child not found',
        },
        { status: 404 }
      )
    }

    // Get 5 random stories for the child's age band
    const stories = await getRandomStories(child.age_band, 5)

    if (stories.length < 5) {
      return NextResponse.json(
        {
          error: 'insufficient_content',
          message: 'Not enough stories available for this age band',
        },
        { status: 400 }
      )
    }

    // Create session
    const sessionData: InsertSession = {
      child_id: validatedData.child_id,
      story_ids: stories.map(story => story.id),
      total_rounds: 5,
      completed_rounds: 0,
    }

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single()

    if (sessionError) {
      console.error('Failed to create session:', sessionError)
      return NextResponse.json(
        {
          error: 'database_error',
          message: 'Failed to create session',
          details: sessionError,
        },
        { status: 500 }
      )
    }

    // Return session and stories
    const response: CreateSessionResponse = {
      session,
      stories,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Session creation error:', error)

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
