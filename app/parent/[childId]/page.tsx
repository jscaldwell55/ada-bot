/**
 * Child Detail Page
 * Shows individual child profile, recent sessions, and quick actions
 */

'use client'

// Force dynamic rendering for this page (prevents static generation issues)
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import type { Child } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Play, TrendingUp, Calendar, AlertCircle, Loader2 } from 'lucide-react'

export default function ChildDetailPage({
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
          <p className="text-gray-600">Loading child profile...</p>
        </div>
      </div>
    )
  }

  if (!child) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Child Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The child profile you&apos;re looking for could not be found.
            </p>
            <Button className="mt-4" onClick={() => router.push('/parent')}>
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
          onClick={() => router.push('/parent')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex items-center gap-4">
          <div className="text-6xl">{child.avatar_emoji}</div>
          <div>
            <h2 className="text-3xl font-bold">{child.nickname}</h2>
            <p className="text-muted-foreground">
              Age: {child.age_band} years
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Start New Session
            </CardTitle>
            <CardDescription>
              Begin a new emotion practice session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="lg"
              className="w-full"
              onClick={() => router.push(`/child/${child.id}`)}
            >
              Start Session
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              View Progress
            </CardTitle>
            <CardDescription>
              See detailed progress and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              asChild
            >
              <Link href={`/parent/${child.id}/progress`}>
                View Progress
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stats Summary */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sessions
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Start the first session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Emotion Accuracy
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Complete sessions to see stats
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Regulation
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Complete sessions to see stats
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>
            Session history and progress over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No sessions yet. Start the first session to begin tracking progress!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
