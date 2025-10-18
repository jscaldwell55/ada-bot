'use client'

/**
 * Story Display Component
 * Clean, child-friendly story presentation
 * Optional debug info for therapist/parent review
 */

import type { Story } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EMOTIONS } from '@/lib/utils/constants'

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
          <CardTitle className="text-center text-2xl">
            {story.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Story Text - Highlighted Box */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
            <p className="text-lg leading-relaxed text-center">
              {story.text}
            </p>
          </div>

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
