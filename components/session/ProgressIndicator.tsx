'use client'

/**
 * Progress Indicator Component
 * Shows "Round X of Y" with progress bar and completed rounds
 */

import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ProgressIndicatorProps {
  currentRound: number
  totalRounds: number
  completedRounds: number
}

export default function ProgressIndicator({
  currentRound,
  totalRounds,
  completedRounds,
}: ProgressIndicatorProps) {
  const progressPercentage = (completedRounds / totalRounds) * 100

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Round Counter */}
        <div className="text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Your Progress
          </h3>
          <p className="text-3xl font-bold text-primary">
            Round {currentRound} of {totalRounds}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-xs text-center text-muted-foreground">
            {completedRounds} of {totalRounds} rounds completed
          </p>
        </div>

        {/* Round Indicators */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalRounds }).map((_, index) => {
            const roundNum = index + 1
            const isCompleted = roundNum <= completedRounds
            const isCurrent = roundNum === currentRound
            const isFuture = roundNum > currentRound

            return (
              <div
                key={roundNum}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300',
                  isCompleted && 'bg-green-500 border-green-500 text-white',
                  isCurrent && !isCompleted && 'bg-primary border-primary text-white scale-125',
                  isFuture && 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500'
                )}
                aria-label={`Round ${roundNum}${isCompleted ? ' completed' : isCurrent ? ' current' : ''}`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-bold">{roundNum}</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Encouragement Message */}
        {currentRound === totalRounds && (
          <div className="text-center mt-4">
            <p className="text-sm font-semibold text-primary animate-pulse">
              Last round! You&apos;re almost done! 🎉
            </p>
          </div>
        )}

        {completedRounds > 0 && completedRounds < totalRounds && (
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              Great job! Keep going! 💪
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
