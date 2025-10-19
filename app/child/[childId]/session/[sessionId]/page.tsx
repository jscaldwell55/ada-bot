/**
 * Session Page
 * Main session UI integrating ChatInterface with XState machine for all 5 rounds
 */

'use client'

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
  const [needsRefresh, setNeedsRefresh] = useState(false)

  // Use refs instead of state to prevent re-renders when toggling locks/counters
  const isCreatingRound = useRef(false)
  const roundCreationAttempts = useRef(0)

  const {
    session,
    stories,
    isLoading: sessionLoading,
    error: sessionError,
    refreshSession,
  } = useSession(params.sessionId)

  // Derive current round from session data
  const currentRound = useMemo(
    () => session?.rounds?.find(r => r.round_number === currentRoundNumber),
    [session?.rounds, currentRoundNumber]
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

  // Separate one-shot refresh effect after round creation
  // This prevents infinite loops in the main effect
  useEffect(() => {
    if (!needsRefresh) return

    (async () => {
      try {
        console.log('🔄 Triggering session refresh after round creation…')
        await refreshSession()
        console.log('✅ Session refreshed')
      } finally {
        // Important: reset the flag so this effect does not loop
        setNeedsRefresh(false)
      }
    })()
  }, [needsRefresh, refreshSession])

  // Create round if needed for agent-enabled sessions
  useEffect(() => {
    // Only run when we *know* the intended round is missing
    if (isCreatingRound.current) return
    if (currentRound) return // ← prevents duplicates
    if (!session?.id) return
    if (!session.agent_enabled) return
    if (!child) return

    // Optional cap to avoid runaway logs
    if (roundCreationAttempts.current >= 3) {
      console.error(`Failed to create round ${currentRoundNumber} after 3 attempts`)
      return
    }

    (async () => {
      isCreatingRound.current = true
      roundCreationAttempts.current += 1

      try {
        console.log(`Creating round ${currentRoundNumber} for session ${session.id}...`)
        const res = await fetch('/api/rounds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: session.id,
            round_number: currentRoundNumber,
            story_id: null, // Not needed for agent-enabled sessions
            age_band: child.age_band,
          }),
        })

        if (!res.ok) {
          // Retry only on 5xx if desired; 4xx should throw
          const status = res.status
          if (status >= 500) {
            console.warn(`Round create attempt ${roundCreationAttempts.current} failed with ${status}; will retry if under cap.`)
            return // effect may run again
          }
          const text = await res.text().catch(() => '')
          throw new Error(`Create round failed: ${status} ${text}`)
        }

        // Success on 200 or 201
        console.log(`✅ Round ${currentRoundNumber} request completed (${res.status})`)
        roundCreationAttempts.current = 0

        // Instead of refreshing here (which loops), trigger a one-shot refresh if needed:
        setNeedsRefresh(true)
      } catch (err) {
        console.error('Error creating round:', err)
      } finally {
        isCreatingRound.current = false
      }
    })()
  }, [currentRound, currentRoundNumber, session?.id, session?.agent_enabled, child])

  const handleRoundComplete = () => {
    console.log('Round complete, current round:', currentRoundNumber)

    if (currentRoundNumber >= 5) {
      // Session complete - mark as completed
      console.log('Session complete!')
      return
    }

    // Move to next round
    const nextRound = currentRoundNumber + 1
    console.log('Moving to round:', nextRound)
    setCurrentRoundNumber(nextRound)
    // Reset retry counter for new round
    roundCreationAttempts.current = 0
  }

  if (sessionLoading || !child) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  // Error check: only show error if there's an actual error or missing session
  // Note: stories can be empty if agent mode is enabled (stories generated per round)
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

  // Check if stories are required (non-agent mode) but missing
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
    // For agent-enabled sessions, get story from round data (dynamically generated)
    const currentRound = session.rounds?.[currentRoundNumber - 1]

    if (currentRound?.action_agent_story) {
      // Transform agent story format to Story format
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
    // For non-agent sessions, use pre-selected stories
    currentStory = stories[currentRoundNumber - 1]
  }

  // Wait for story to load
  if (!currentStory) {
    const loadingMessage = session.agent_enabled && isCreatingRound.current
      ? `Creating a personalized story for round ${currentRoundNumber}...`
      : `Loading story for round ${currentRoundNumber}...`

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{loadingMessage}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            {session.agent_enabled && isCreatingRound.current && (
              <p className="text-sm text-muted-foreground text-center">
                This may take a few moments...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-8">
      {/* KEY PROP FORCES RE-RENDER WHEN ROUND CHANGES */}
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