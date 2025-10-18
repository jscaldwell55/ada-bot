'use client'

/**
 * Story Display Component
 * Clean, child-friendly story presentation
 * Optional debug info for therapist/parent review
 */

import { useEffect } from 'react'
import type { Story } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Volume2, VolumeX, Loader2 } from 'lucide-react'
import { EMOTIONS } from '@/lib/utils/constants'
import { useVapi } from '@/lib/hooks/useVapi'
import type { VapiEmotion } from '@/types/vapi'

interface StoryDisplayProps {
  story: Story
}

/**
 * Debug component - only visible when NEXT_PUBLIC_SHOW_DEBUG=true
 * For therapist/parent review mode
 */
function StoryDebugInfo({ story }: { story: Story }) {
  const showDebug = process.env.NEXT_PUBLIC_SHOW_DEBUG === 'true'

  if (!showDebug) return null

  const emotionConfig = EMOTIONS[story.emotion]

  return (
    <Card className="mt-4 border-dashed border-2 border-gray-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">
          Debug Info (Therapist/Parent Review)
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
          <div>
            <span className="font-semibold">Target Emotion:</span>{' '}
            <span style={{ color: emotionConfig.color }}>
              {emotionConfig.emoji} {emotionConfig.label}
            </span>
          </div>
          <div>
            <span className="font-semibold">Age Band:</span> {story.age_band}
          </div>
          <div>
            <span className="font-semibold">Complexity:</span> {story.complexity_score}/5
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function StoryDisplay({ story }: StoryDisplayProps) {
  const { speak, startSession, stopSession, isConnected, isSpeaking } = useVapi()

  // Auto-connect when component mounts
  useEffect(() => {
    startSession().catch((err) => {
      console.warn('[StoryDisplay] Failed to start Vapi session:', err)
    })

    // Cleanup: stop session on unmount
    return () => {
      stopSession().catch((err) => {
        console.warn('[StoryDisplay] Failed to stop session:', err)
      })
    }
  }, [startSession, stopSession])

  const handleToggleVoice = () => {
    if (isSpeaking) {
      // Cannot stop mid-speech with Vapi, but we could disconnect
      stopSession()
    } else if (isConnected) {
      // Map story emotion to Vapi emotion
      const emotion = (story.emotion || 'calm') as VapiEmotion
      speak(story.text, { emotion })
    }
  }

  return (
    <div className="space-y-4">
      {/* Story Header - Clean & Child-Friendly */}
      <div className="flex items-center justify-center gap-3">
        <span className="text-5xl">📖</span>
        <h2 className="text-3xl font-bold text-primary">Story Time</h2>
      </div>

      {/* Story Card */}
      <Card className="border-4 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-center text-2xl flex-1">
              {story.title}
            </CardTitle>

            {/* Voice Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleVoice}
              disabled={!isConnected}
              className="ml-2 shrink-0"
              title={
                !isConnected
                  ? 'Connecting...'
                  : isSpeaking
                  ? 'Stop reading'
                  : 'Read story aloud'
              }
            >
              {!isConnected ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isSpeaking ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Story Text - Highlighted Box */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
            <p className="text-lg leading-relaxed text-center">
              {story.text}
            </p>
          </div>

          {/* Speaking Indicator */}
          {isSpeaking && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
              <Volume2 className="h-4 w-4" />
              <span>Reading story...</span>
            </div>
          )}

          {/* Connection Status */}
          {!isConnected && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Connecting to voice...</span>
            </div>
          )}

          {/* Gentle Prompt */}
          <div className="text-center">
            <p className="text-base text-muted-foreground italic">
              How do you think the character is feeling? 💭
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Optional Debug Info */}
      <StoryDebugInfo story={story} />
    </div>
  )
}
