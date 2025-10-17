/**
 * Session Details API Route
 * GET /api/sessions/[id] - Fetch session with rounds and stories
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { getStoriesByIds } from '@/lib/services/stories'
import type { GetSessionResponse } from '@/types/api'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json(
        {
          error: 'invalid_id',
          message: 'Invalid session ID format',
        },
        { status: 400 }
      )
    }

    // Temporary workaround for Supabase type inference issue
    const supabase = createServerClient() as any

    // Fetch session with rounds
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(
        `
        *,
        rounds:emotion_rounds(*)
      `
      )
      .eq('id', sessionId)
      .single()

    if (sessionError) {
      if (sessionError.code === 'PGRST116') {
        return NextResponse.json(
          {
            error: 'not_found',
            message: 'Session not found',
          },
          { status: 404 }
        )
      }

      console.error('Failed to fetch session:', sessionError)
      return NextResponse.json(
        {
          error: 'database_error',
          message: 'Failed to fetch session',
          details: sessionError,
        },
        { status: 500 }
      )
    }

    // Fetch stories
    const stories = await getStoriesByIds(session.story_ids)

    // Return session with rounds and stories
    const response: GetSessionResponse = {
      session,
      stories,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Session fetch error:', error)

    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
