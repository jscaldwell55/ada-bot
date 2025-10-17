'use client'

/**
 * Emotion Picker Component
 * 3-column grid of emotion cards for selection
 */

import { useState } from 'react'
import { EMOTIONS } from '@/lib/utils/constants'
import type { EmotionLabel } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

interface EmotionPickerProps {
  onEmotionSelect: (emotion: EmotionLabel) => void
  selectedEmotion?: EmotionLabel
  disabled?: boolean
}

export default function EmotionPicker({
  onEmotionSelect,
  selectedEmotion,
  disabled = false,
}: EmotionPickerProps) {
  const [hoveredEmotion, setHoveredEmotion] = useState<EmotionLabel | null>(null)

  const handleSelect = (emotion: EmotionLabel) => {
    if (!disabled) {
      onEmotionSelect(emotion)
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Object.entries(EMOTIONS).map(([emotion, config]) => {
        const emotionKey = emotion as EmotionLabel
        const isSelected = selectedEmotion === emotionKey
        const isHovered = hoveredEmotion === emotionKey

        return (
          <Card
            key={emotion}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:scale-105',
              isSelected && 'ring-4 ring-primary ring-offset-2',
              isHovered && !isSelected && 'shadow-lg',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            style={{
              borderColor: isSelected ? config.color : undefined,
              backgroundColor: isSelected
                ? `${config.color}15`
                : undefined,
            }}
            onClick={() => handleSelect(emotionKey)}
            onMouseEnter={() => setHoveredEmotion(emotionKey)}
            onMouseLeave={() => setHoveredEmotion(null)}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={`Select ${config.label} emotion`}
            aria-pressed={isSelected}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                e.preventDefault()
                handleSelect(emotionKey)
              }
            }}
          >
            <CardContent className="p-6 text-center space-y-3">
              <div className="text-5xl" aria-hidden="true">
                {config.emoji}
              </div>
              <div>
                <h3
                  className="text-xl font-semibold"
                  style={{ color: config.color }}
                >
                  {config.label}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {config.description}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
