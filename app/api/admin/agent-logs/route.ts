/**
 * Admin API - Agent Logs
 * GET /api/admin/agent-logs - Fetch agent generation logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const agentType = searchParams.get('agent_type')
    const sessionId = searchParams.get('session_id')
    const roundId = searchParams.get('round_id')

    // Build query (type assertion needed for RLS-enabled table)
    let query = (supabase as any)
      .from('agent_generations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 1000)) // Cap at 1000

    // Apply filters
    if (agentType) {
      query = query.eq('agent_type', agentType)
    }
    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }
    if (roundId) {
      query = query.eq('round_id', roundId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Admin API] Failed to fetch agent logs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate stats
    const logs: any[] = data || []
    const stats = {
      total: logs.length,
      observer: logs.filter((l: any) => l.agent_type === 'observer').length,
      action_story: logs.filter((l: any) => l.agent_type === 'action_story').length,
      action_script: logs.filter((l: any) => l.agent_type === 'action_script').length,
      action_praise: logs.filter((l: any) => l.agent_type === 'action_praise').length,
      avg_time_ms: logs.length > 0
        ? Math.round(logs.reduce((sum: number, l: any) => sum + (l.generation_time_ms || 0), 0) / logs.length)
        : 0,
      with_safety_flags: logs.filter((l: any) => l.safety_flags && l.safety_flags.length > 0).length,
    }

    return NextResponse.json({
      logs,
      stats,
      metadata: {
        limit,
        filters: {
          agent_type: agentType || 'all',
          session_id: sessionId || null,
          round_id: roundId || null,
        },
      },
    })

  } catch (error) {
    console.error('[Admin API] Failed to fetch agent logs:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch logs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
