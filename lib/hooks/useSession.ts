/**
 * useSession Hook
 * Manages session state, fetches session/rounds, handles transitions
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import type {
  Session,
  EmotionRound,
  Story,
} from '@/types/database'
import type { GetSessionResponse } from '@/types/api'

export type { SessionWithRounds } from '@/types/database'

interface UseSessionReturn {
  session: Session | null
  rounds: EmotionRound[]
  stories: Story[]
  currentRound: EmotionRound | null
  currentStory: Story | null
  isLoading: boolean
  error: string | null
  refreshSession: () => Promise<void>
  advanceRound: () => void
  completeSession: () => Promise<void>
}

export function useSession(sessionId: string | null): UseSessionReturn {
  const supabase = useSupabase()
  const [session, setSession] = useState<Session | null>(null)
  const [rounds, setRounds] = useState<EmotionRound[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch session data
  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/sessions/${sessionId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch session')
      }

      const data: GetSessionResponse = await response.json()

      setSession(data.session)
      setRounds(data.session.rounds || [])
      setStories(data.stories)
    } catch (err) {
      console.error('Error fetching session:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  // Initial fetch
  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  // Subscribe to realtime updates for rounds
  useEffect(() => {
    if (!sessionId) return

    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emotion_rounds',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Round updated:', payload)
          fetchSession() // Refresh session data
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, supabase, fetchSession])

  // Get current round and story
  const currentRound = rounds[currentRoundIndex] || null
  const currentStory = currentRound
    ? stories.find((s) => s.id === currentRound.story_id) || null
    : null

  // Advance to next round
  const advanceRound = useCallback(() => {
    if (currentRoundIndex < rounds.length - 1) {
      setCurrentRoundIndex((prev) => prev + 1)
    }
  }, [currentRoundIndex, rounds.length])

  // Complete session
  const completeSession = useCallback(async () => {
    if (!sessionId) return

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed_at: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to complete session')
      }

      await fetchSession()
    } catch (err) {
      console.error('Error completing session:', err)
      setError(err instanceof Error ? err.message : 'Failed to complete session')
    }
  }, [sessionId, fetchSession])

  return {
    session,
    rounds,
    stories,
    currentRound,
    currentStory,
    isLoading,
    error,
    refreshSession: fetchSession,
    advanceRound,
    completeSession,
  }
}

/**
 * useCreateSession Hook
 * Creates a new session for a child
 */
export function useCreateSession() {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createSession = useCallback(async (childId: string) => {
    try {
      setIsCreating(true)
      setError(null)

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: childId }),
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }

      const data = await response.json()
      return data.session
    } catch (err) {
      console.error('Error creating session:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setIsCreating(false)
    }
  }, [])

  return {
    createSession,
    isCreating,
    error,
  }
}
