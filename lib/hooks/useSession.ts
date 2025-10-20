/**
 * useSession Hook
 * Manages session state, fetches session/rounds, handles transitions
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import type {
  SessionWithRounds,
  EmotionRound,
  Story,
} from '@/types/database'
import type { GetSessionResponse } from '@/types/api'

export type { SessionWithRounds } from '@/types/database'

interface UseSessionReturn {
  session: SessionWithRounds | null
  rounds: EmotionRound[]
  stories: Story[]
  currentRound: EmotionRound | null
  currentStory: Story | null
  isLoading: boolean
  error: string | null
  refreshSession: (silent?: boolean) => Promise<void>
  advanceRound: () => void
  completeSession: () => Promise<void>
}

export function useSession(sessionId: string | null): UseSessionReturn {
  const supabase = useSupabase()
  const [session, setSession] = useState<SessionWithRounds | null>(null)
  const [rounds, setRounds] = useState<EmotionRound[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Track if we're currently fetching to prevent overlapping requests
  const isFetching = useRef(false)
  const lastFetchTime = useRef(0)
  const realtimeDebounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Fetch session data
  const fetchSession = useCallback(async (silent = false) => {
    if (!sessionId) {
      setIsLoading(false)
      return
    }

    // Prevent overlapping fetches
    if (isFetching.current) {
      console.log('[useSession] Already fetching, skipping...')
      return
    }

    // Rate limiting: Don't fetch more than once per 500ms
    const now = Date.now()
    if (silent && now - lastFetchTime.current < 500) {
      console.log('[useSession] Rate limited, skipping fetch (too soon)')
      return
    }

    try {
      isFetching.current = true
      lastFetchTime.current = now
      
      if (!silent) {
        setIsLoading(true)
      }
      setError(null)

      console.log('[useSession] Fetching session:', sessionId)
      const response = await fetch(`/api/sessions/${sessionId}`, {
        cache: 'no-store', // Disable caching to get fresh rounds data
      })

      if (!response.ok) {
        throw new Error('Failed to fetch session')
      }

      const data: GetSessionResponse = await response.json()

      console.log('[useSession] Session fetched, emotion_rounds:', data.session.emotion_rounds?.length || 0)

      setSession(data.session)
      setRounds(data.session.emotion_rounds || [])
      setStories(data.stories)
    } catch (err) {
      console.error('[useSession] Error fetching session:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      isFetching.current = false
      if (!silent) {
        setIsLoading(false)
      }
    }
  }, [sessionId])

  // Initial fetch
  useEffect(() => {
    console.log('[useSession] Initial fetch for session:', sessionId)
    fetchSession()
  }, [fetchSession])

  // Subscribe to realtime updates for rounds
  useEffect(() => {
    if (!sessionId) return

    console.log('[useSession] Setting up realtime subscription for session:', sessionId)
    
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
          console.log('[useSession] Round updated via realtime:', payload)

          // Debounce realtime updates - wait 1 second before fetching
          // This prevents rapid-fire updates if multiple changes happen at once
          if (realtimeDebounceTimer.current) {
            clearTimeout(realtimeDebounceTimer.current)
          }

          realtimeDebounceTimer.current = setTimeout(() => {
            console.log('[useSession] Debounced realtime fetch executing...')
            fetchSession(true)
          }, 1000)
        }
      )
      .subscribe((status) => {
        console.log('[useSession] Realtime subscription status:', status)
      })

    return () => {
      console.log('[useSession] Cleaning up realtime subscription')
      if (realtimeDebounceTimer.current) {
        clearTimeout(realtimeDebounceTimer.current)
      }
      supabase.removeChannel(channel)
    }
  }, [sessionId, supabase, fetchSession])

  // Get current round and story
  const currentRound = rounds[currentRoundIndex] || null
  
  // FIXED: Extract story from either agent-generated or static location
  const currentStory = currentRound
    ? extractStoryFromRound(currentRound, stories)
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
        cache: 'no-store', // Disable caching
      })

      if (!response.ok) {
        throw new Error('Failed to complete session')
      }

      await fetchSession()
    } catch (err) {
      console.error('[useSession] Error completing session:', err)
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
 * Helper: Extract story from round (agent-generated or static)
 */
function extractStoryFromRound(round: EmotionRound, stories: Story[]): Story | null {
  // Priority 1: Agent-generated story
  if (round.action_agent_story) {
    const agentStory = round.action_agent_story as any
    return {
      id: 'agent-generated',
      title: agentStory.theme || 'Story',
      text: agentStory.story_text,
      emotion: agentStory.target_emotion,
      age_band: '8-9', // Default, doesn't matter for display
      complexity_score: agentStory.complexity_score || 2,
      created_at: new Date().toISOString(),
    }
  }

  // Priority 2: Static story from database
  if (round.story_id) {
    return stories.find((s) => s.id === round.story_id) || null
  }

  return null
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
        cache: 'no-store', // Disable caching
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }

      const data = await response.json()
      return data.session
    } catch (err) {
      console.error('[useCreateSession] Error creating session:', err)
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