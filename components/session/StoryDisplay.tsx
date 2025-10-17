'use client'

/**
 * Story Display Component
 * Card with story text and age-appropriate presentation
 */

import type { Story } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EMOTIONS } from '@/lib/utils/constants'
import { BookOpen } from 'lucide-react'

interface StoryDisplayProps {
  story: Story
}

export default function StoryDisplay({ story }: StoryDisplayProps) {
  const emotionConfig = EMOTIONS[story.emotion]

  return (
    <div className="space-y-4">
      {/* Story Header */}
      <div className="flex items-center justify-center gap-3 text-primary">
        <BookOpen className="h-8 w-8" />
        <h2 className="text-2xl font-bold">Story Time</h2>
      </div>

      {/* Story Card */}
      <Card className="border-4 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-center text-2xl">
            {story.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Story Text */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed text-center px-4">
              {story.text}
            </p>
          </div>

          {/* Visual Separator */}
          <div className="flex justify-center gap-2 py-4">
            <div className="h-1 w-12 bg-primary/20 rounded"></div>
            <div className="h-1 w-12 bg-primary/40 rounded"></div>
            <div className="h-1 w-12 bg-primary/20 rounded"></div>
          </div>

          {/* Story Metadata (for parents/debug - can be hidden in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reading Tip */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <p className="text-sm text-center text-blue-900 dark:text-blue-100">
            =¡ Read the story carefully and think about how the character might be feeling!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
