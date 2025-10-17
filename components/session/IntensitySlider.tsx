'use client'

/**
 * Intensity Slider Component
 * Custom slider 1-5 with visual feedback and labels
 */

import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { INTENSITY_LEVELS } from '@/lib/utils/constants'
import type { IntensityLevel } from '@/types/database'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface IntensitySliderProps {
  value: IntensityLevel
  onChange: (value: IntensityLevel) => void
  label?: string
  disabled?: boolean
  showConfirmButton?: boolean
}

export default function IntensitySlider({
  value,
  onChange,
  label = 'How strong is the feeling?',
  disabled = false,
  showConfirmButton = true,
}: IntensitySliderProps) {
  const [currentValue, setCurrentValue] = useState<IntensityLevel>(value)
  const [confirmed, setConfirmed] = useState(false)

  const currentLevel = INTENSITY_LEVELS[currentValue - 1]

  const handleSliderChange = (values: number[]) => {
    const newValue = values[0] as IntensityLevel
    setCurrentValue(newValue)
    setConfirmed(false)

    if (!showConfirmButton) {
      onChange(newValue)
    }
  }

  const handleConfirm = () => {
    onChange(currentValue)
    setConfirmed(true)
  }

  // Color gradient based on intensity
  const getIntensityColor = (level: IntensityLevel): string => {
    const colors = {
      1: '#10b981', // green-500 - Tiny
      2: '#84cc16', // lime-500 - Small
      3: '#eab308', // yellow-500 - Medium
      4: '#f97316', // orange-500 - Big
      5: '#ef4444', // red-500 - Huge
    }
    return colors[level]
  }

  return (
    <div className="space-y-6 w-full max-w-md mx-auto">
      {/* Label */}
      <div className="text-center">
        <h4 className="text-lg font-medium mb-2">{label}</h4>
      </div>

      {/* Emoji and Level Display */}
      <div className="text-center">
        <div
          className="text-8xl mb-4 transition-all duration-300 transform"
          style={{
            transform: `scale(${0.8 + currentValue * 0.1})`,
          }}
        >
          {currentLevel.emoji}
        </div>
        <div
          className="text-3xl font-bold transition-colors duration-300"
          style={{ color: getIntensityColor(currentValue) }}
        >
          {currentLevel.label}
        </div>
        <p className="text-muted-foreground mt-2">{currentLevel.description}</p>
      </div>

      {/* Slider */}
      <div className="px-4">
        <Slider
          value={[currentValue]}
          onValueChange={handleSliderChange}
          min={1}
          max={5}
          step={1}
          disabled={disabled || confirmed}
          className="cursor-pointer"
          aria-label={label}
        />

        {/* Level Markers */}
        <div className="flex justify-between mt-2 px-2">
          {INTENSITY_LEVELS.map((level, index) => {
            const levelNumber = (index + 1) as IntensityLevel
            const isActive = currentValue === levelNumber

            return (
              <button
                key={level.value}
                onClick={() => {
                  if (!disabled && !confirmed) {
                    handleSliderChange([levelNumber])
                  }
                }}
                className={cn(
                  'text-xs font-medium transition-all duration-200',
                  isActive
                    ? 'text-primary scale-125'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label={`Set intensity to ${level.label}`}
                disabled={disabled || confirmed}
              >
                {levelNumber}
              </button>
            )
          })}
        </div>

        {/* Visual Intensity Bar */}
        <div className="mt-4 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${(currentValue / 5) * 100}%`,
              backgroundColor: getIntensityColor(currentValue),
            }}
          />
        </div>
      </div>

      {/* Confirm Button */}
      {showConfirmButton && (
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleConfirm}
            disabled={disabled || confirmed}
            style={{
              backgroundColor: confirmed
                ? getIntensityColor(currentValue)
                : undefined,
            }}
          >
            {confirmed ? 'Confirmed!' : 'Confirm'}
          </Button>
        </div>
      )}
    </div>
  )
}
