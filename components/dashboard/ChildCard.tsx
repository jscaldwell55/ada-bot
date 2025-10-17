/**
 * Child Card Component
 * Displays child profile with stats and action buttons
 */

'use client'

import { useRouter } from 'next/navigation'
import type { Child } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, BarChart3 } from 'lucide-react'

interface ChildCardProps {
  child: Child
}

export default function ChildCard({ child }: ChildCardProps) {
  const router = useRouter()

  // In a real app, fetch these stats from the database
  const stats = {
    totalSessions: 0,
    completedSessions: 0,
    accuracyPercentage: 0,
    averageIntensityDelta: 0,
    lastSessionDate: null as string | null,
  }

  const handleStartSession = () => {
    router.push(`/child/${child.id}`)
  }

  const handleViewDetails = () => {
    // Navigate to detailed child stats page (not yet implemented)
    router.push(`/parent/children/${child.id}`)
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="text-6xl">{child.avatar_emoji}</div>
            <div>
              <CardTitle className="text-2xl">{child.nickname}</CardTitle>
              <CardDescription>
                Age {child.age_band}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Sessions</p>
            <p className="text-2xl font-bold">{stats.totalSessions}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Accuracy</p>
            <p className="text-2xl font-bold">
              {stats.totalSessions > 0
                ? `${stats.accuracyPercentage}%`
                : '--'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold">{stats.completedSessions}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Last Session</p>
            <p className="text-sm font-medium">
              {stats.lastSessionDate
                ? new Date(stats.lastSessionDate).toLocaleDateString()
                : 'Never'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-4">
          <Button
            onClick={handleStartSession}
            className="w-full"
          >
            <Play className="mr-2 h-4 w-4" />
            Start Session
          </Button>

          <Button
            onClick={handleViewDetails}
            variant="outline"
            className="w-full"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            View Progress
          </Button>
        </div>

        {/* Quick Info */}
        {stats.totalSessions === 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              No sessions yet. Start the first session to begin tracking progress!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
