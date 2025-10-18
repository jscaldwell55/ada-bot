'use client'

/**
 * useVapi React Hook
 * React hook for Vapi voice interactions
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { vapiService } from '@/lib/services/vapi'
import type { VapiSpeakOptions, VapiMessage } from '@/types/vapi'

export interface UseVapiReturn {
  /**
   * Make the assistant speak specific text
   */
  speak: (text: string, options?: Partial<VapiSpeakOptions>) => Promise<void>

  /**
   * Start a voice session with the assistant
   */
  startSession: () => Promise<void>

  /**
   * Stop the current voice session
   */
  stopSession: () => Promise<void>

  /**
   * Whether the service is connected
   */
  isConnected: boolean

  /**
   * Whether the assistant is currently speaking
   */
  isSpeaking: boolean

  /**
   * Messages from the conversation
   */
  messages: VapiMessage[]

  /**
   * Error message if any
   */
  error: string | null
}

/**
 * React hook for managing Vapi voice interactions
 *
 * @example
 * ```tsx
 * const { speak, startSession, isConnected, isSpeaking } = useVapi()
 *
 * // Start session when component mounts
 * useEffect(() => {
 *   startSession()
 * }, [])
 *
 * // Speak with emotion
 * <button onClick={() => speak("Great job!", { emotion: 'happy' })}>
 *   Praise
 * </button>
 * ```
 */
export function useVapi(): UseVapiReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [messages, setMessages] = useState<VapiMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  // Initialize Vapi service on mount
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID

    if (!apiKey || !assistantId) {
      console.warn('[useVapi] Missing Vapi credentials in environment variables')
      setError('Vapi credentials not configured')
      return
    }

    // Initialize the service
    vapiService.initialize({
      apiKey,
      assistantId,
    })

    // Set up message subscription
    const unsubscribe = vapiService.onMessage((message) => {
      if (isMountedRef.current) {
        setMessages((prev) => [...prev, message])
      }
    })

    // Poll state every 200ms to update React state
    const pollInterval = setInterval(() => {
      if (!isMountedRef.current) return

      const state = vapiService.getState()
      setIsConnected(state.connectionState === 'connected')
      setIsSpeaking(state.isSpeaking)
      setError(state.error)
    }, 200)

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false
      clearInterval(pollInterval)
      unsubscribe()

      // Stop session if connected
      if (vapiService.isAvailable()) {
        vapiService.stopSession().catch((err) => {
          console.warn('[useVapi] Failed to stop session on unmount:', err)
        })
      }
    }
  }, [])

  const startSession = useCallback(async () => {
    if (!isMountedRef.current) return

    try {
      setError(null)
      await vapiService.startSession()
      console.log('[useVapi] Session started successfully')
    } catch (err) {
      console.error('[useVapi] Failed to start session:', err)
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to start session')
      }
      throw err
    }
  }, [])

  const stopSession = useCallback(async () => {
    try {
      await vapiService.stopSession()
      if (isMountedRef.current) {
        setMessages([])
      }
      console.log('[useVapi] Session stopped successfully')
    } catch (err) {
      console.error('[useVapi] Failed to stop session:', err)
      throw err
    }
  }, [])

  const speak = useCallback(
    async (text: string, options?: Partial<VapiSpeakOptions>) => {
      if (!isMountedRef.current) return

      try {
        await vapiService.speak({
          text,
          ...options,
        })
      } catch (err) {
        console.error('[useVapi] Failed to speak:', err)
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to speak')
        }
        throw err
      }
    },
    []
  )

  return {
    speak,
    startSession,
    stopSession,
    isConnected,
    isSpeaking,
    messages,
    error,
  }
}
