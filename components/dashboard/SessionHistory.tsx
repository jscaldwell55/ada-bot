/**
 * Session History Component
 * Table/list of past sessions with details and view button
 */

'use client'

import type { Session } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, CheckCircle, Circle } from 'lucide-react'

interface SessionHistoryProps {
  sessions: Session[]
  childNickname?: string
}

export default function SessionHistory({
  sessions,
  childNickname,
}: SessionHistoryProps) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>
            {childNickname
              ? `${childNickname}'s past practice sessions`
              : 'Past practice sessions'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Circle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No sessions yet</p>
            <p className="text-sm mt-2">
              Start a session to see history here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session History</CardTitle>
        <CardDescription>
          {childNickname
            ? `${childNickname}'s past practice sessions`
            : `${sessions.length} total sessions`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {sessions.map((session) => {
            const isComplete = session.completed_at !== null
            const completionPercentage = Math.round(
              (session.completed_rounds / session.total_rounds) * 100
            )

            return (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {/* Session Info */}
                <div className="flex items-center gap-4">
                  <div>
                    {isComplete ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : (
                      <Circle className="h-8 w-8 text-gray-400" />
                    )}
                  </div>

                  <div>
                    <p className="font-medium">
                      {new Date(session.started_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {session.completed_rounds} of {session.total_rounds} rounds
                      {isComplete && ' " Completed'}
                    </p>
                  </div>
                </div>

                {/* Stats & Action */}
                <div className="flex items-center gap-4">
                  {/* Progress */}
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {completionPercentage}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Complete
                    </p>
                  </div>

                  {/* View Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Navigate to session details (not yet implemented)
                      console.log('View session:', session.id)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Load More (if needed) */}
        {sessions.length >= 10 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
