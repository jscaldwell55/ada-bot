'use client'

/**
 * Script Player Component
 * Step through regulation script with auto-advance and Vapi voice
 */

import { useState, useEffect } from 'react'
import type { RegulationScript } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronRight, ChevronLeft, Volume2, Loader2 } from 'lucide-react'
import { useVapi } from '@/lib/hooks/useVapi'

interface ScriptPlayerProps {
  script: RegulationScript
  onComplete: () => void
  autoAdvance?: boolean
}

export default function ScriptPlayer({
  script,
  onComplete,
  autoAdvance = true,
}: ScriptPlayerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [timeLeft, setTimeLeft] = useState(0)
  const { speak, startSession, stopSession, isConnected, isSpeaking } = useVapi()

  const currentStep = script.steps[currentStepIndex]
  const isLastStep = currentStepIndex === script.steps.length - 1
  const progress = ((currentStepIndex + 1) / script.steps.length) * 100

  // Start Vapi session when component mounts
  useEffect(() => {
    startSession().catch((err) => {
      console.warn('[ScriptPlayer] Failed to start Vapi session:', err)
    })

    // Cleanup: stop session on unmount
    return () => {
      stopSession().catch((err) => {
        console.warn('[ScriptPlayer] Failed to stop session:', err)
      })
    }
  }, [startSession, stopSession])

  // Speak current step when it changes
  useEffect(() => {
    if (isPlaying && isConnected && currentStep.text) {
      speak(currentStep.text, { emotion: 'calm' })
    }
  }, [currentStepIndex, isPlaying, isConnected, currentStep.text, speak])

  // Auto-advance timer
  useEffect(() => {
    if (!autoAdvance || !isPlaying) return

    setTimeLeft(currentStep.duration_ms)

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          return 0
        }
        return prev - 100
      })
    }, 100)

    const timeout = setTimeout(() => {
      if (isLastStep) {
        onComplete()
      } else {
        setCurrentStepIndex((prev) => prev + 1)
      }
    }, currentStep.duration_ms)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [currentStepIndex, autoAdvance, isPlaying, currentStep.duration_ms, isLastStep, onComplete])


  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStepIndex((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  const handleTogglePause = () => {
    setIsPlaying((prev) => !prev)
  }

  const timeLeftPercentage = (timeLeft / currentStep.duration_ms) * 100

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-3xl">{script.icon_emoji}</span>
            {script.name}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Main Step Display */}
      <Card className="min-h-[300px] flex items-center justify-center">
        <CardContent className="p-12 text-center space-y-6">
          {/* Step Emoji */}
          {currentStep.emoji && (
            <div className="text-9xl animate-pulse" aria-hidden="true">
              {currentStep.emoji}
            </div>
          )}

          {/* Step Text */}
          <p className="text-2xl font-medium leading-relaxed">
            {currentStep.text}
          </p>

          {/* Step Counter */}
          <p className="text-sm text-muted-foreground">
            Step {currentStepIndex + 1} of {script.steps.length}
          </p>

          {/* Speaking Indicator */}
          {isSpeaking && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
              <Volume2 className="h-4 w-4" />
              <span>Speaking...</span>
            </div>
          )}

          {/* Connection Status */}
          {!isConnected && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Connecting to voice...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        {autoAdvance && isPlaying && (
          <div className="space-y-1">
            <Progress
              value={timeLeftPercentage}
              className="h-1 opacity-50"
            />
            <p className="text-xs text-center text-muted-foreground">
              Next step in {Math.ceil(timeLeft / 1000)}s
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          disabled={currentStepIndex === 0}
          aria-label="Previous step"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Button
          variant="outline"
          onClick={handleTogglePause}
          aria-label={isPlaying ? 'Pause' : 'Resume'}
        >
          {isPlaying ? 'Pause' : 'Resume'}
        </Button>

        <Button
          variant={isLastStep ? 'default' : 'outline'}
          size={isLastStep ? 'lg' : 'icon'}
          onClick={handleNext}
          aria-label={isLastStep ? 'Complete activity' : 'Next step'}
        >
          {isLastStep ? (
            'Complete Activity'
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  )
}
