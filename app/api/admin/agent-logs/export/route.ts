/**
 * Admin API - Export Agent Logs
 * GET /api/admin/agent-logs/export - Export logs as CSV
 */

import { NextRequest, NextResponse } from 'next/server'
import { exportSessionLogs } from '@/lib/services/agentLogger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id parameter is required' },
        { status: 400 }
      )
    }

    // Fetch logs for the session
    const logs = await exportSessionLogs(sessionId)

    if (logs.length === 0) {
      return NextResponse.json(
        { error: 'No logs found for this session' },
        { status: 404 }
      )
    }

    // Convert to CSV
    const csvHeader = 'agent_type,created_at,generation_time_ms,model_version,round_id,session_id,safety_flags\n'
    const csvRows = logs.map(log =>
      `${log.agent_type},${log.created_at || ''},${log.generation_time_ms || 0},${log.model_version},${log.round_id || ''},${log.session_id || ''},"${(log.safety_flags || []).join(', ')}"`
    ).join('\n')

    const csv = csvHeader + csvRows

    // Return as downloadable CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="agent-logs-${sessionId}.csv"`,
      },
    })

  } catch (error) {
    console.error('[Admin API] Failed to export logs:', error)
    return NextResponse.json(
      {
        error: 'Failed to export logs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
