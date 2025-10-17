/**
 * Session Page
 * Main session UI integrating ChatInterface with XState machine for all 5 rounds
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { useSession } from '@/lib/hooks/useSession'
import ChatInterface from '@/components/session/ChatInterface'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Home, PartyPopper } from 'lucide-react'
import type { Child } from '@/types/database'

export default function SessionPage({
  params,
}: {
  params: { childId: string; sessionId: string }
}) {
  const router = useRouter()
  const supabase = useSupabase()
  const [child, setChild] = useState<Child | null>(null)
  const [currentRoundNumber, setCurrentRoundNumber] = useState(1)

  const {
    session,
    stories,
    isLoading: sessionLoading,
    error: sessionError,
  } = useSession(params.sessionId)

  // Load child data
  useEffect(() => {
    async function loadChild() {
      const { data } = await supabase
        .from('children')
        .select('*')
        .eq('id', params.childId)
        .single()

      if (data) setChild(data)
    }

    loadChild()
  }, [params.childId, supabase])

  const handleRoundComplete = () => {
    if (currentRoundNumber >= 5) {
      // Session complete, don't advance
      return
    }
    setCurrentRoundNumber((prev) => prev + 1)
  }

  if (sessionLoading || !child) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (sessionError || !session || stories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{sessionError || 'Failed to load session'}</p>
            <Button onClick={() => router.push(`/child/${params.childId}`)}>
              <Home className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if session is complete
  const isSessionComplete = session.completed_at !== null || currentRoundNumber > 5

  if (isSessionComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-2xl border-4 border-yellow-500">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <PartyPopper className="h-24 w-24 text-yellow-500" />
            </div>
            <CardTitle className="text-4xl mb-2">
              Amazing Work, {child.nickname}!
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 text-center">
            <div className="text-6xl mb-4">🏆✨🎉</div>

            <p className="text-xl">
              You completed all 5 rounds of emotion practice!
            </p>

            <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-6">
              <h3 className="font-semibold mb-2">What you learned today:</h3>
              <ul className="space-y-2">
                <li> Recognized emotions in different stories</li>
                <li> Practiced calming activities</li>
                <li> Learned about your feelings</li>
                <li> Built important life skills!</li>
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              <Button
                size="lg"
                onClick={() => router.push(`/child/${params.childId}`)}
              >
                Practice Again
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push('/parent')}
              >
                Parent View
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get current story for this round
  const currentStory = stories[currentRoundNumber - 1]

  if (!currentStory) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <ChatInterface
        sessionId={session.id}
        roundNumber={currentRoundNumber}
        totalRounds={5}
        childNickname={child.nickname}
        story={currentStory}
        onRoundComplete={handleRoundComplete}
      />
    </div>
  )
}
