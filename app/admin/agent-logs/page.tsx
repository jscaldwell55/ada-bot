/**
 * Admin Agent Logs Page
 * View and analyze AI agent generation logs
 */

'use client'

import AgentLogsDashboard from '@/components/admin/AgentLogsDashboard'

export default function AgentLogsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AgentLogsDashboard />
    </div>
  )
}
