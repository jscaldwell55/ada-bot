/**
 * Child Progress Page
 * Detailed analytics, charts, and progress tracking
 */

'use client'

// Force dynamic rendering for this page (prevents static generation issues)
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import type { Child } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, TrendingUp, Target, BarChart3, Calendar, Loader2 } from 'lucide-react'

export default function ChildProgressPage({
  params,
}: {
  params: { childId: string }
}) {
  const router = useRouter()
  const supabase = useSupabase()
  const [child, setChild] = useState<Child | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [parentId, setParentId] = useState<string | null>(null)

  // Check authentication first
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          router.push('/auth/login?redirect=/parent')
          return
        }

        setParentId(user.id)
      } catch (err) {
        console.error('Error checking authentication:', err)
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [supabase, router])

  // Load child once authenticated
  useEffect(() => {
    if (!parentId) return

    async function loadChild() {
      try {
        const { data, error } = await supabase
          .from('children')
          .select('*')
          .eq('id', params.childId)
          .eq('parent_id', parentId!)
          .single()

        if (error) throw error
        setChild(data)
      } catch (err) {
        console.error('Error loading child:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadChild()
  }, [params.childId, supabase, parentId])

  if (isLoading || !parentId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading progress...</p>
        </div>
      </div>
    )
  }

  if (!child) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Child Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/parent')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push(`/parent/${child.id}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {child.nickname}&apos;s Profile
        </Button>

        <div className="flex items-center gap-4">
          <div className="text-6xl">{child.avatar_emoji}</div>
          <div>
            <h2 className="text-3xl font-bold">{child.nickname}&apos;s Progress</h2>
            <p className="text-muted-foreground">
              Detailed analytics and insights
            </p>
          </div>
        </div>
      </div>

      {/* Progress Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sessions
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Emotion Accuracy
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Intensity Delta
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Script Completion
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Over Time</CardTitle>
          <CardDescription>
            Emotion accuracy and regulation improvement
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">
            Charts will appear here after completing sessions
          </p>
        </CardContent>
      </Card>

      {/* Emotion Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Emotion Recognition Breakdown</CardTitle>
          <CardDescription>
            Performance by emotion type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Complete sessions to see emotion-specific insights
          </p>
        </CardContent>
      </Card>

      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>
            Detailed log of all practice sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No sessions yet
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
