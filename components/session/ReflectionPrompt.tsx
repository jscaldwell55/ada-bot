'use client'

/**
 * Reflection Prompt Component
 * Reuses IntensitySlider for post-regulation rating with comparison
 */

import { useState } from 'react'
import IntensitySlider from './IntensitySlider'
import type { IntensityLevel } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'

interface ReflectionPromptProps {
  preIntensity: IntensityLevel
  onReflectionComplete: (postIntensity: IntensityLevel) => void
}

export default function ReflectionPrompt({
  preIntensity,
  onReflectionComplete,
}: ReflectionPromptProps) {
  const [postIntensity, setPostIntensity] = useState<IntensityLevel | null>(null)

  const handleIntensityChange = (intensity: IntensityLevel) => {
    setPostIntensity(intensity)
    onReflectionComplete(intensity)
  }

  const getDeltaMessage = () => {
    if (postIntensity === null) return null

    const delta = postIntensity - preIntensity

    if (delta < 0) {
      return {
        icon: <TrendingDown className="h-6 w-6 text-green-500" />,
        text: 'Your feeling got smaller!',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
      }
    } else if (delta > 0) {
      return {
        icon: <TrendingUp className="h-6 w-6 text-blue-500" />,
        text: 'Your feeling got bigger. That\'s okay!',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      }
    } else {
      return {
        icon: <Minus className="h-6 w-6 text-gray-500" />,
        text: 'Your feeling stayed the same.',
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      }
    }
  }

  const deltaMessage = getDeltaMessage()

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            Let&apos;s check in! How are you feeling now?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Before the activity, your feeling was at level <span className="font-bold text-primary">{preIntensity}</span>.
            <br />
            Move the slider to show how you feel now.
          </p>
        </CardContent>
      </Card>

      {/* Intensity Slider */}
      <IntensitySlider
        value={postIntensity || preIntensity}
        onChange={handleIntensityChange}
        label="How do you feel now?"
        showConfirmButton={true}
      />

      {/* Delta Comparison */}
      {deltaMessage && (
        <Card className={deltaMessage.bgColor}>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              {deltaMessage.icon}
              <p className={`text-lg font-semibold ${deltaMessage.color}`}>
                {deltaMessage.text}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 text-sm">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Before</div>
                <div className="text-2xl font-bold">{preIntensity}</div>
              </div>
              <div className="text-2xl text-muted-foreground">�</div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">After</div>
                <div className="text-2xl font-bold">{postIntensity}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
