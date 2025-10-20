/**
 * Session Details API Route
 * GET /api/sessions/[id] - Fetch session with rounds and stories
 */

import { NextRequest, NextResponse } from 'next/server'

// Disable caching to avoid stale empty rounds
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { createServiceClient } from '@/lib/supabase/service'
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

    // Use service role client to bypass RLS
    const supabase = createServiceClient() as any // ← Add type assertion

    // Verify service client is working - test a direct count query
    const { count: totalRoundsCount, error: countError } = await supabase
      .from('emotion_rounds')
      .select('*', { count: 'exact', head: true })

    console.log('[API] Total rounds in database:', { totalRoundsCount, countError })

    // Fetch session with emotion_rounds (no alias!)
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(
        `
        *,
        emotion_rounds (
          id,
          session_id,
          round_number,
          story_id,
          action_agent_story,
          labeled_emotion,
          pre_intensity,
          post_intensity,
          regulation_script_id,
          observer_context,
          generation_metadata,
          started_at,
          completed_at,
          is_correct,
          praise_message
        )
      `
      )
      .eq('id', sessionId)
      .single()

    console.log('[API] Session fetched:', {
      sessionId: session?.id,
      roundsCount: session?.emotion_rounds?.length || 0,
      roundsData: session?.emotion_rounds,
      rawSession: session,
    })

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

    // FALLBACK: If emotion_rounds array is empty or missing, fetch them separately
    if (!session.emotion_rounds || session.emotion_rounds.length === 0) {
      console.log('[API] No rounds in join, fetching separately...')
      console.log('[API] Query params:', { sessionId, sessionIdType: typeof sessionId })

      const { data: roundsData, error: roundsError } = await supabase
        .from('emotion_rounds')
        .select('*')
        .eq('session_id', sessionId)
        .order('round_number', { ascending: true })

      console.log('[API] Fallback query result:', {
        error: roundsError,
        dataLength: roundsData?.length || 0,
        data: roundsData,
      })

      if (!roundsError && roundsData) {
        console.log(`[API] ✅ Fetched ${roundsData.length} rounds separately`)
        session.emotion_rounds = roundsData
      } else {
        console.error('[API] ❌ Failed to fetch rounds separately:', roundsError)
      }
    }

    // Fetch stories
    const stories = await getStoriesByIds(session.story_ids || [])

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