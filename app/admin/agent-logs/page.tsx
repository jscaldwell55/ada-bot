// app/admin/agent-logs/page.tsx
// Admin dashboard for viewing agent generation logs

import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

async function getAgentLogs() {
  const supabase = createServiceClient()

  // Fetch agent generation logs
  // Note: Using service client to bypass RLS for admin access
  const { data, error } = await supabase
    .from('agent_generations')
    .select(`
      id,
      agent_type,
      model_version,
      safety_flags,
      generation_time_ms,
      tokens_used,
      created_at,
      round_id,
      session_id,
      emotion_rounds (
        round_number,
        labeled_emotion
      ),
      sessions (
        children (
          nickname
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[Admin] Error fetching logs:', error)
    return []
  }

  // Type assertion for logs with nested relations
  // Using 'any' for nested relations to simplify type checking
  const logs = (data || []) as Array<{
    id: string
    agent_type: string
    model_version: string
    safety_flags: string[] | null
    generation_time_ms: number | null
    tokens_used: number | null
    created_at: string
    round_id: string | null
    session_id: string | null
    emotion_rounds?: any
    sessions?: any
  }>

  return logs
}

async function getLogStats() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('agent_generations')
    .select('agent_type, generation_time_ms, tokens_used, safety_flags')

  if (error || !data || data.length === 0) {
    return {
      totalGenerations: 0,
      avgGenerationTime: 0,
      totalTokens: 0,
      safetyFlags: 0,
    }
  }

  // Type assertion for stats array
  const stats = data as Array<{
    agent_type: string
    generation_time_ms: number | null
    tokens_used: number | null
    safety_flags: string[] | null
  }>

  const totalGenerations = stats.length
  const avgGenerationTime = stats.reduce((sum, log) => sum + (log.generation_time_ms || 0), 0) / totalGenerations
  const totalTokens = stats.reduce((sum, log) => sum + (log.tokens_used || 0), 0)
  const safetyFlags = stats.filter(log => log.safety_flags && log.safety_flags.length > 0).length

  return {
    totalGenerations,
    avgGenerationTime: Math.round(avgGenerationTime),
    totalTokens,
    safetyFlags,
  }
}

function getAgentTypeBadge(agentType: string) {
  const variants = {
    observer: 'default',
    action_story: 'secondary',
    action_script: 'outline',
    action_praise: 'default',
  } as const

  const labels = {
    observer: 'Observer',
    action_story: 'Story',
    action_script: 'Script',
    action_praise: 'Praise',
  }

  return (
    <Badge variant={variants[agentType as keyof typeof variants] || 'default'}>
      {labels[agentType as keyof typeof labels] || agentType}
    </Badge>
  )
}

function formatDuration(ms: number | null) {
  if (!ms) return 'N/A'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export default async function AgentLogsPage() {
  const logs = await getAgentLogs()
  const stats = await getLogStats()

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Agent Generation Logs</h1>
        <p className="text-muted-foreground mt-2">
          Monitor AI agent activity, performance, and safety
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Generations</CardDescription>
            <CardTitle className="text-3xl">{stats.totalGenerations}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Generation Time</CardDescription>
            <CardTitle className="text-3xl">{formatDuration(stats.avgGenerationTime)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tokens Used</CardDescription>
            <CardTitle className="text-3xl">{stats.totalTokens.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Safety Flags</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.safetyFlags}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Generations</CardTitle>
          <CardDescription>Last 100 agent generations</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No agent generations yet</p>
              <p className="text-sm mt-2">Logs will appear here once children start using Ada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Agent Type</TableHead>
                    <TableHead>Child</TableHead>
                    <TableHead>Round</TableHead>
                    <TableHead>Emotion</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Safety</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const round = Array.isArray(log.emotion_rounds) ? log.emotion_rounds[0] : log.emotion_rounds
                    // Get session from either emotion_round or directly from agent_generation
                    const session = Array.isArray(log.sessions) ? log.sessions[0] : log.sessions
                    const child = Array.isArray(session?.children) ? session.children[0] : session?.children
                    const hasSafetyFlags = log.safety_flags && log.safety_flags.length > 0

                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {getAgentTypeBadge(log.agent_type)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {child?.nickname || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {round?.round_number || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {round?.labeled_emotion || 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.model_version || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDuration(log.generation_time_ms)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.tokens_used?.toLocaleString() || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {hasSafetyFlags ? (
                            <Badge variant="destructive" className="text-xs">
                              {log.safety_flags?.length || 0} flag{(log.safety_flags?.length || 0) !== 1 ? 's' : ''}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              ✓ Safe
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">About Agent Logs</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Observer Agent:</strong> Analyzes child&apos;s emotional patterns and provides therapeutic insights
          </p>
          <p>
            <strong>Story Generation:</strong> Creates adaptive stories based on child&apos;s demonstrated needs
          </p>
          <p>
            <strong>Script Adaptation:</strong> Personalizes regulation scripts (breathing, grounding, movement)
          </p>
          <p>
            <strong>Praise Generation:</strong> Generates context-aware, growth-focused affirmations
          </p>
          <p className="pt-2 border-t">
            <strong>Safety Flags:</strong> All AI-generated content passes through multi-layer validation.
            Flags indicate content that triggered safety checks (automatically falls back to static content).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
