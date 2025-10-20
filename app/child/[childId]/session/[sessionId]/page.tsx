'use client'

/**
 * Session Page
 * Main session UI integrating ChatInterface with XState machine for all 5 rounds
 */

// Force dynamic rendering for this page (prevents static generation issues)
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useMemo } from 'react'
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
  const hasCreatedRound = useRef(false)
  const pollInterval = useRef<NodeJS.Timeout | null>(null)

  const {
    session,
    stories,
    isLoading: sessionLoading,
    error: sessionError,
    refreshSession,
  } = useSession(params.sessionId)

  // Derive current round from session data
  const currentRound = useMemo(
    () => session?.emotion_rounds?.find(r => r.round_number === currentRoundNumber),
    [session?.emotion_rounds, currentRoundNumber]
  )

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

  // Create round when needed
  useEffect(() => {
    if (currentRound) {
      console.log(`[SessionPage] Round ${currentRoundNumber} exists`)
      hasCreatedRound.current = false // Reset for next round
      // Clear polling if it exists
      if (pollInterval.current) {
        clearTimeout(pollInterval.current) // Changed from clearInterval
        pollInterval.current = null
      }
      return
    }

    if (hasCreatedRound.current) {
      console.log('[SessionPage] Already created round, waiting for it to appear...')
      return
    }

    if (!session?.id || !child || !session.agent_enabled) {
      return
    }

    (async () => {
      hasCreatedRound.current = true

      try {
        console.log(`[SessionPage] Creating round ${currentRoundNumber}...`)
        
        const res = await fetch('/api/rounds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: session.id,
            round_number: currentRoundNumber,
            story_id: null,
            age_band: child.age_band,
          }),
          cache: 'no-store', // Disable caching
        })

        if (!res.ok) {
          throw new Error(`Failed to create round: ${res.status}`)
        }

        const data = await res.json()
        
        // FIX: Access round.id instead of data.id
        console.log(`[SessionPage] ✅ Round created:`, data.round?.id || data.id)

        // Start polling with exponential backoff (fallback if realtime doesn't work)
        console.log('[SessionPage] Starting poll for round...')
        let attempts = 0
        let currentDelay = 1000 // Start at 1 second

        const schedulePoll = () => {
          pollInterval.current = setTimeout(async () => {
            attempts++
            console.log(`[SessionPage] Polling attempt ${attempts} (delay: ${currentDelay}ms)...`)
            await refreshSession(true)

            // Stop after 10 attempts (~30 seconds total)
            if (attempts >= 10) {
              console.warn('[SessionPage] Polling timeout after 10 attempts')
              pollInterval.current = null
            } else {
              // Exponential backoff: 1s, 2s, 4s, 8s, 8s, 8s...
              currentDelay = Math.min(currentDelay * 2, 8000)
              schedulePoll()
            }
          }, currentDelay)
        }

        schedulePoll()
        
      } catch (err) {
        console.error('[SessionPage] Error creating round:', err)
        hasCreatedRound.current = false
      }
    })()
  }, [currentRound, currentRoundNumber, session?.id, session?.agent_enabled, child, refreshSession])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollInterval.current) {
        clearTimeout(pollInterval.current) // Changed from clearInterval
      }
    }
  }, [])

  const handleRoundComplete = () => {
    console.log('[SessionPage] Round complete')

    if (currentRoundNumber >= 5) {
      console.log('[SessionPage] Session complete!')
      return
    }

    setCurrentRoundNumber(currentRoundNumber + 1)
  }

  if (sessionLoading || !child) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (sessionError || !session) {
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

  if (!session.agent_enabled && stories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>No stories available for this session</p>
            <Button onClick={() => router.push(`/child/${params.childId}`)}>
              <Home className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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
                <li>✅ Recognized emotions in different stories</li>
                <li>✅ Practiced calming activities</li>
                <li>✅ Learned about your feelings</li>
                <li>✅ Built important life skills!</li>
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
  let currentStory = null

  if (session.agent_enabled) {
    if (currentRound?.action_agent_story) {
      const agentStory = currentRound.action_agent_story as any
      
      currentStory = {
        id: `agent-story-${currentRound.id}`,
        text: agentStory.story_text,
        emotion: agentStory.target_emotion,
        title: agentStory.theme,
        complexity_score: agentStory.complexity_score,
        age_band: child?.age_band || '8-9',
        created_at: currentRound.started_at,
      }
    }
  } else {
    currentStory = stories[currentRoundNumber - 1]
  }

  if (!currentStory) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Creating your story...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground text-center">
              This may take 5-10 seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <ChatInterface
        key={`round-${currentRoundNumber}`}
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