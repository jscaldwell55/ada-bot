'use client'

/**
 * Chat Interface Component
 * Main container integrating XState machine for emotion round flow
 */

import { useMachine } from '@xstate/react'
import { emotionRoundMachine, createEmotionRoundContext } from '@/lib/machines/emotionRoundMachine'
import type { Story, RegulationScript } from '@/types/database'
import type { EmotionLabel, IntensityLevel } from '@/types/database'
import StoryDisplay from './StoryDisplay'
import EmotionPicker from './EmotionPicker'
import IntensitySlider from './IntensitySlider'
import ScriptSelector from './ScriptSelector'
import ScriptPlayer from './ScriptPlayer'
import ReflectionPrompt from './ReflectionPrompt'
import PraiseDisplay from './PraiseDisplay'
import ProgressIndicator from './ProgressIndicator'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ChatInterfaceProps {
  sessionId: string
  roundNumber: number
  totalRounds: number
  childNickname: string
  story: Story
  onRoundComplete: () => void
}

export default function ChatInterface({
  sessionId,
  roundNumber,
  totalRounds,
  childNickname,
  story,
  onRoundComplete,
}: ChatInterfaceProps) {
  // Initialize XState machine
  const [state, send] = useMachine(emotionRoundMachine, {
    input: createEmotionRoundContext(sessionId, roundNumber, childNickname, totalRounds),
  })

  const handleStart = () => {
    send({ type: 'START', story })
  }

  const handleStoryViewed = () => {
    send({ type: 'STORY_VIEWED' })
  }

  const handleEmotionLabeled = (emotion: EmotionLabel) => {
    send({ type: 'EMOTION_LABELED', emotion })
  }

  const handleIntensityRated = (intensity: IntensityLevel) => {
    send({ type: 'INTENSITY_RATED', intensity })
  }

  const handleScriptSelected = (script: RegulationScript) => {
    send({ type: 'SCRIPT_SELECTED', script })
  }

  const handleScriptCompleted = () => {
    send({ type: 'SCRIPT_COMPLETED' })
  }

  const handleReflectionCompleted = (postIntensity: IntensityLevel) => {
    send({ type: 'REFLECTION_COMPLETED', postIntensity })
  }

  const handlePraiseAcknowledged = () => {
    send({ type: 'PRAISE_ACKNOWLEDGED' })
    onRoundComplete()
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Progress Indicator */}
      <ProgressIndicator
        currentRound={roundNumber}
        totalRounds={totalRounds}
        completedRounds={roundNumber - 1}
      />

      {/* Main Content Area */}
      <Card className="min-h-[500px]">
        <CardContent className="p-6">
          {/* Greeting State */}
          {state.matches('greeting') && (
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold text-primary">
                Hi {childNickname}! 👋
              </h2>
              <p className="text-xl text-muted-foreground">
                Ready to practice understanding emotions?
              </p>
              <p className="text-lg">
                This is round {roundNumber} of {totalRounds}. Let's read a story together!
              </p>
              <Button size="lg" onClick={handleStart}>
                Start Round
              </Button>
            </div>
          )}

          {/* Presenting Story State */}
          {state.matches('presentingStory') && state.context.story && (
            <div className="space-y-6">
              <StoryDisplay story={state.context.story} />
              <div className="flex justify-center">
                <Button size="lg" onClick={handleStoryViewed}>
                  I Read the Story
                </Button>
              </div>
            </div>
          )}

          {/* Labeling Emotion State */}
          {state.matches('labelingEmotion') && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-semibold mb-2">
                  How do you think the character felt?
                </h3>
                <p className="text-muted-foreground">
                  Pick the emotion that matches the story
                </p>
              </div>
              <EmotionPicker onEmotionSelect={handleEmotionLabeled} />
            </div>
          )}

          {/* Checking Correctness State */}
          {state.matches('checkingCorrectness') && (
            <div className="text-center">
              <div className="animate-pulse text-lg">
                Checking your answer...
              </div>
            </div>
          )}

          {/* Rating Intensity State */}
          {state.matches('ratingIntensity') && (
            <div className="space-y-6">
              <div className="text-center">
                {state.context.isCorrect ? (
                  <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 rounded-lg">
                    <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                      Great job! You got it right! ✅
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                      Good try! The character felt {state.context.story?.emotion}. Let's practice!
                    </p>
                  </div>
                )}
                <h3 className="text-2xl font-semibold mb-2">
                  How strong is that feeling for you right now?
                </h3>
                <p className="text-muted-foreground">
                  Move the slider to show how you're feeling
                </p>
              </div>
              <IntensitySlider
                value={state.context.preIntensity || 3}
                onChange={handleIntensityRated}
                label="My Feeling Strength"
              />
            </div>
          )}

          {/* Fetching Scripts State */}
          {state.matches('fetchingScripts') && (
            <div className="text-center">
              <div className="animate-pulse text-lg">
                Finding the best regulation activities for you...
              </div>
            </div>
          )}

          {/* Offering Regulation State */}
          {state.matches('offeringRegulation') && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-semibold mb-2">
                  Let's practice calming down!
                </h3>
                <p className="text-muted-foreground">
                  Pick an activity to help you feel better
                </p>
              </div>
              <ScriptSelector
                scripts={state.context.recommendedScripts}
                onScriptSelect={handleScriptSelected}
              />
            </div>
          )}

          {/* Running Script State */}
          {state.matches('runningScript') && state.context.selectedScript && (
            <ScriptPlayer
              script={state.context.selectedScript}
              onComplete={handleScriptCompleted}
            />
          )}

          {/* Reflecting State */}
          {state.matches('reflecting') && (
            <ReflectionPrompt
              preIntensity={state.context.preIntensity || 3}
              onReflectionComplete={handleReflectionCompleted}
            />
          )}

          {/* Generating Praise State */}
          {state.matches('generatingPraise') && (
            <div className="text-center">
              <div className="animate-pulse text-lg">
                Preparing your praise message...
              </div>
            </div>
          )}

          {/* Praising State */}
          {state.matches('praising') && (
            <PraiseDisplay
              message={state.context.praiseMessage || ''}
              badgeEmoji={state.context.badgeEmoji}
              intensityDelta={state.context.intensityDelta}
              isCorrect={state.context.isCorrect || false}
              onAcknowledge={handlePraiseAcknowledged}
            />
          )}

          {/* Error State */}
          {state.matches('error') && (
            <div className="text-center space-y-4">
              <div className="p-4 bg-red-100 dark:bg-red-900 rounded-lg">
                <p className="text-red-800 dark:text-red-200">
                  Oops! Something went wrong. Let's try again!
                </p>
              </div>
              <Button onClick={() => send({ type: 'RETRY' })}>
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
