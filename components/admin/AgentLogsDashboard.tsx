'use client'

/**
 * Agent Logs Dashboard
 * Admin interface for viewing and analyzing AI agent generation logs
 */

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Types
interface AgentLog {
  id: string
  agent_type: 'observer' | 'action_story' | 'action_script' | 'action_praise'
  round_id?: string
  session_id?: string
  input_context: Record<string, any>
  output_content: Record<string, any>
  model_version: string
  generation_time_ms: number
  safety_flags: string[]
  metadata?: Record<string, any>
  created_at: string
}

interface LogStats {
  total: number
  observer: number
  action_story: number
  action_script: number
  action_praise: number
  avg_time_ms: number
  with_safety_flags: number
}

export default function AgentLogsDashboard() {
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [stats, setStats] = useState<LogStats>({
    total: 0,
    observer: 0,
    action_story: 0,
    action_script: 0,
    action_praise: 0,
    avg_time_ms: 0,
    with_safety_flags: 0,
  })
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  // Fetch on mount and when filter changes
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (filter !== 'all') {
          params.append('agent_type', filter)
        }

        const response = await fetch(`/api/admin/agent-logs?${params}`)
        const data = await response.json()

        setLogs(data.logs || [])
        setStats(data.stats || {})
      } catch (error) {
        console.error('Failed to fetch logs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [filter])

  // Manual refresh function
  const refreshLogs = () => {
    setFilter(filter) // Trigger useEffect
  }

  // Agent type badge colors
  const getAgentBadgeColor = (type: string) => {
    switch (type) {
      case 'observer':
        return 'bg-blue-100 text-blue-800'
      case 'action_story':
        return 'bg-purple-100 text-purple-800'
      case 'action_script':
        return 'bg-green-100 text-green-800'
      case 'action_praise':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  // Toggle log expansion
  const toggleExpand = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agent Logs Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor AI agent generation activity</p>
        </div>
        <Button onClick={refreshLogs} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Logs</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Observer</div>
          <div className="text-2xl font-bold text-blue-600">{stats.observer}</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Stories</div>
          <div className="text-2xl font-bold text-purple-600">{stats.action_story}</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Scripts</div>
          <div className="text-2xl font-bold text-green-600">{stats.action_script}</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Praise</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.action_praise}</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Avg Time</div>
          <div className="text-2xl font-bold">{stats.avg_time_ms}ms</div>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'observer' ? 'default' : 'outline'}
          onClick={() => setFilter('observer')}
        >
          Observer
        </Button>
        <Button
          variant={filter === 'action_story' ? 'default' : 'outline'}
          onClick={() => setFilter('action_story')}
        >
          Stories
        </Button>
        <Button
          variant={filter === 'action_script' ? 'default' : 'outline'}
          onClick={() => setFilter('action_script')}
        >
          Scripts
        </Button>
        <Button
          variant={filter === 'action_praise' ? 'default' : 'outline'}
          onClick={() => setFilter('action_praise')}
        >
          Praise
        </Button>
      </div>

      {/* Logs List */}
      {loading ? (
        <Card className="p-8 text-center text-gray-500">
          Loading logs...
        </Card>
      ) : logs.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          No logs found matching the selected filter.
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id} className="p-4">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(log.id)}
              >
                {/* Header Row */}
                <div className="flex items-center gap-3">
                  {/* Agent Type Badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getAgentBadgeColor(
                      log.agent_type
                    )}`}
                  >
                    {log.agent_type}
                  </span>

                  {/* Timestamp */}
                  <span className="text-sm text-gray-600">
                    {formatTimestamp(log.created_at)}
                  </span>

                  {/* Generation Time */}
                  <span className="text-sm font-medium">
                    {log.generation_time_ms}ms
                  </span>

                  {/* Model */}
                  <span className="text-xs text-gray-500">{log.model_version}</span>

                  {/* Safety Flags */}
                  {log.safety_flags && log.safety_flags.length > 0 && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                      {log.safety_flags.length} flags
                    </span>
                  )}
                </div>

                {/* Expand Indicator */}
                <div className="text-gray-400">
                  {expandedLog === log.id ? '▼' : '▶'}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedLog === log.id && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  {/* IDs */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {log.round_id && (
                      <div>
                        <span className="text-gray-600">Round ID:</span>
                        <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                          {log.round_id}
                        </code>
                      </div>
                    )}
                    {log.session_id && (
                      <div>
                        <span className="text-gray-600">Session ID:</span>
                        <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                          {log.session_id}
                        </code>
                      </div>
                    )}
                  </div>

                  {/* Safety Flags */}
                  {log.safety_flags && log.safety_flags.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Safety Flags:
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {log.safety_flags.map((flag, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input Context */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Input Context:
                    </div>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.input_context, null, 2)}
                    </pre>
                  </div>

                  {/* Output Content */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Output Content:
                    </div>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.output_content, null, 2)}
                    </pre>
                  </div>

                  {/* Metadata */}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Metadata:
                      </div>
                      <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
