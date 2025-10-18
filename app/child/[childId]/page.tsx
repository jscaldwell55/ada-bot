/**
 * Child Welcome Screen
 * Shows child profile and "Begin Practice" button to start new session
 */

'use client'

// Force dynamic rendering for this page (prevents static generation issues)
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { useCreateSession } from '@/lib/hooks/useSession'
import type { Child } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles } from 'lucide-react'

export default function ChildWelcomePage({
  params,
}: {
  params: { childId: string }
}) {
  const router = useRouter()
  const supabase = useSupabase()
  const { createSession, isCreating } = useCreateSession()
  const [child, setChild] = useState<Child | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadChild() {
      try {
        const { data, error: fetchError } = await supabase
          .from('children')
          .select('*')
          .eq('id', params.childId)
          .single()

        if (fetchError) throw fetchError
        setChild(data)
      } catch (err) {
        console.error('Error loading child:', err)
        setError('Could not find child profile')
      } finally {
        setIsLoading(false)
      }
    }

    loadChild()
  }, [params.childId, supabase])

  const handleStartSession = async () => {
    if (!child) return

    const session = await createSession(child.id)

    if (session) {
      router.push(`/child/${child.id}/session/${session.id}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !child) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || 'Child not found'}</p>
            <Button className="mt-4" onClick={() => router.push('/')}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Welcome Card */}
          <Card className="border-4 border-primary">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="text-9xl">{child.avatar_emoji}</div>
              </div>
              <CardTitle className="text-4xl mb-2">
                Hi {child.nickname}!
              </CardTitle>
              <p className="text-xl text-muted-foreground">
                Ready to practice understanding emotions?
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* What to Expect */}
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  What we&apos;ll do today:
                </h3>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start gap-2">
                    <span className="text-2xl">📖</span>
                    <span>Read 5 short stories about different emotions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-2xl">🤔</span>
                    <span>Guess how the characters are feeling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-2xl">🧘</span>
                    <span>Try fun calming activities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-2xl">🏆</span>
                    <span>Get praise and celebrate your progress!</span>
                  </li>
                </ul>
              </div>

              {/* Begin Button */}
              <Button
                size="lg"
                className="w-full text-xl py-6"
                onClick={handleStartSession}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Getting ready...
                  </>
                ) : (
                  <>Begin Practice</>
                )}
              </Button>

              {/* Parent Link */}
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/parent')}
                >
                  Parent View
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
