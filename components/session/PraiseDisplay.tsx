'use client'

/**
 * Praise Display Component
 * Shows generated praise message with celebration animation
 */

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Trophy, Star, Heart, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useVapi } from '@/lib/hooks/useVapi'

interface PraiseDisplayProps {
  message: string
  badgeEmoji?: string | null
  intensityDelta: number | null
  isCorrect: boolean
  onAcknowledge: () => void
}

export default function PraiseDisplay({
  message,
  badgeEmoji,
  intensityDelta,
  isCorrect,
  onAcknowledge,
}: PraiseDisplayProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [confettiActive, setConfettiActive] = useState(false)
  const { speak, isConnected, isSpeaking } = useVapi()

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 100)

    // Trigger confetti
    setTimeout(() => setConfettiActive(true), 300)
    setTimeout(() => setConfettiActive(false), 3000)

    // Auto-play praise with Vapi if connected
    if (isConnected && message) {
      setTimeout(() => {
        speak(message, { emotion: 'happy' })
      }, 500) // Small delay to let animation settle
    }
  }, [message, isConnected, speak])

  const improved = intensityDelta !== null && intensityDelta < 0

  // Determine celebration level
  const getCelebrationLevel = (): 'high' | 'medium' | 'low' => {
    if (isCorrect && improved) return 'high'
    if (isCorrect || improved) return 'medium'
    return 'low'
  }

  const celebrationLevel = getCelebrationLevel()

  const celebrationIcons = {
    high: <Trophy className="h-16 w-16 text-yellow-500" />,
    medium: <Star className="h-16 w-16 text-blue-500" />,
    low: <Heart className="h-16 w-16 text-pink-500" />,
  }

  return (
    <div className="space-y-6 relative">
      {/* Confetti Animation */}
      {confettiActive && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 1}s`,
              }}
            >
              {['⭐', '🎉', '🎊', '✨', '🌟'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      {/* Main Praise Card */}
      <Card
        className={cn(
          'transform transition-all duration-500 border-4',
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          celebrationLevel === 'high' && 'border-yellow-500 shadow-xl shadow-yellow-500/50',
          celebrationLevel === 'medium' && 'border-blue-500 shadow-xl shadow-blue-500/50',
          celebrationLevel === 'low' && 'border-pink-500 shadow-xl shadow-pink-500/50'
        )}
      >
        <CardContent className="p-8 text-center space-y-6">
          {/* Badge Emoji */}
          <div className="flex justify-center">
            <div className={cn(
              'text-8xl animate-bounce',
              isVisible && 'animation-delay-200'
            )}>
              {badgeEmoji || '🎉'}
            </div>
          </div>

          {/* Celebration Icon */}
          <div className="flex justify-center">
            {celebrationIcons[celebrationLevel]}
          </div>

          {/* Praise Message */}
          <div className="space-y-4">
            <p className="text-2xl font-bold leading-relaxed">
              {message}
            </p>

            {/* Speaking Indicator */}
            {isSpeaking && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
                <Volume2 className="h-4 w-4" />
                <span>Reading praise...</span>
              </div>
            )}
          </div>

          {/* Stats Summary */}
          {intensityDelta !== null && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Emotion Match</div>
                <div className="text-2xl font-bold">
                  {isCorrect ? '✅' : '📚'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {isCorrect ? 'Correct!' : 'Keep practicing!'}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Regulation</div>
                <div className={cn(
                  'text-2xl font-bold',
                  improved ? 'text-green-600' : 'text-blue-600'
                )}>
                  {intensityDelta > 0 ? '+' : ''}{intensityDelta}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {improved ? 'Feeling better!' : 'You tried!'}
                </div>
              </div>
            </div>
          )}

          {/* Sparkle decorations */}
          <div className="flex justify-center gap-4 text-yellow-500">
            <Sparkles className="h-6 w-6 animate-pulse" />
            <Sparkles className="h-6 w-6 animate-pulse animation-delay-200" />
            <Sparkles className="h-6 w-6 animate-pulse animation-delay-400" />
          </div>

          {/* Continue Button */}
          <Button
            size="lg"
            onClick={onAcknowledge}
            className="mt-6 w-full text-lg"
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
