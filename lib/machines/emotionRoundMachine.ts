/**
 * XState v5 State Machine for Emotion Round Flow
 * Manages the complete workflow for a single emotion recognition and regulation round
 */

import { setup, assign, fromPromise } from 'xstate'
import type {
  EmotionLabel,
  IntensityLevel,
  Story,
  RegulationScript,
} from '@/types/database'

// ==================== Machine Context ====================
export interface EmotionRoundContext {
  sessionId: string
  roundNumber: number
  totalRounds: number
  childNickname: string

  // Story phase
  story: Story | null

  // Labeling phase
  labeledEmotion: EmotionLabel | null
  isCorrect: boolean | null

  // Intensity phase
  preIntensity: IntensityLevel | null

  // Regulation phase
  selectedScript: RegulationScript | null
  recommendedScripts: RegulationScript[]

  // Reflection phase
  postIntensity: IntensityLevel | null
  intensityDelta: number | null

  // Praise phase
  praiseMessage: string | null
  badgeEmoji: string | null

  // Error handling
  error: string | null
}

// ==================== Events ====================
export type EmotionRoundEvent =
  | { type: 'START'; story: Story }
  | { type: 'STORY_VIEWED' }
  | { type: 'EMOTION_LABELED'; emotion: EmotionLabel }
  | { type: 'INTENSITY_RATED'; intensity: IntensityLevel }
  | { type: 'SCRIPT_SELECTED'; script: RegulationScript }
  | { type: 'SCRIPT_COMPLETED' }
  | { type: 'REFLECTION_COMPLETED'; postIntensity: IntensityLevel }
  | { type: 'PRAISE_ACKNOWLEDGED' }
  | { type: 'RETRY' }
  | { type: 'SKIP' }

// ==================== Actors ====================
const checkEmotionCorrectness = fromPromise(
  async ({ input }: { input: { labeledEmotion: EmotionLabel; story: Story } }) => {
    const { labeledEmotion, story } = input
    return {
      isCorrect: labeledEmotion === story.emotion,
    }
  }
)

const fetchRecommendedScripts = fromPromise(
  async ({
    input,
  }: {
    input: { emotion: EmotionLabel; intensity: IntensityLevel }
  }): Promise<{ scripts: RegulationScript[] }> => {
    const { emotion, intensity } = input

    const response = await fetch(
      `/api/scripts/recommended?emotion=${emotion}&intensity=${intensity}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch recommended scripts')
    }

    const data = await response.json()
    return { scripts: data.scripts }
  }
)

const updateRound = fromPromise(
  async ({
    input,
  }: {
    input: {
      sessionId: string
      roundNumber: number
      labeledEmotion: EmotionLabel
      isCorrect: boolean
      preIntensity: IntensityLevel
      postIntensity: IntensityLevel
      scriptId: string | null
    }
  }): Promise<{ roundId: string }> => {
    console.log('[Machine] Updating round with intensities and emotion data...')

    // First, find the round ID for this session and round number
    const sessionResponse = await fetch(`/api/sessions/${input.sessionId}`, {
      cache: 'no-store',
    })

    if (!sessionResponse.ok) {
      throw new Error('Failed to fetch session')
    }

    const sessionData = await sessionResponse.json()
    const round = sessionData.session.emotion_rounds?.find(
      (r: any) => r.round_number === input.roundNumber
    )

    if (!round) {
      throw new Error(`Round ${input.roundNumber} not found`)
    }

    // PATCH the round with all collected data
    const response = await fetch(`/api/rounds/${round.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        labeled_emotion: input.labeledEmotion,
        is_correct: input.isCorrect,
        pre_intensity: input.preIntensity,
        post_intensity: input.postIntensity,
        regulation_script_id: input.scriptId,
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('Failed to update round')
    }

    console.log('[Machine] ✅ Round updated successfully - Observer agent should trigger now')

    return { roundId: round.id }
  }
)

const generatePraise = fromPromise(
  async ({
    input,
  }: {
    input: {
      childNickname: string
      emotion: EmotionLabel
      isCorrect: boolean
      preIntensity: IntensityLevel
      postIntensity: IntensityLevel
      roundNumber: number
      totalRounds: number
    }
  }): Promise<{ message: string; badgeEmoji?: string }> => {
    // Convert camelCase to snake_case to match API expectations
    const response = await fetch('/api/praise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        child_nickname: input.childNickname,
        labeled_emotion: input.emotion,
        is_correct: input.isCorrect,
        pre_intensity: input.preIntensity,
        post_intensity: input.postIntensity,
        round_number: input.roundNumber,
      }),
    })

    if (!response.ok) {
      // Don't throw - use fallback praise instead
      console.warn('Praise API failed, using fallback')
      return {
        message: `Great work, ${input.childNickname}! You're doing an amazing job learning about emotions! 🌟`,
        badgeEmoji: '⭐',
      }
    }

    const data = await response.json()
    return {
      message: data.praise_message || data.message,
      badgeEmoji: data.badge_emoji,
    }
  }
)

// ==================== State Machine ====================
export const emotionRoundMachine = setup({
  types: {
    context: {} as EmotionRoundContext,
    events: {} as EmotionRoundEvent,
  },
  actors: {
    checkEmotionCorrectness,
    fetchRecommendedScripts,
    updateRound,
    generatePraise,
  },
  guards: {
    isLastRound: ({ context }) => context.roundNumber >= context.totalRounds,
    hasIntensityImproved: ({ context }) =>
      context.intensityDelta !== null && context.intensityDelta < 0,
  },
}).createMachine({
  id: 'emotionRound',
  initial: 'greeting',
  context: {
    sessionId: '',
    roundNumber: 1,
    totalRounds: 5,
    childNickname: '',
    story: null,
    labeledEmotion: null,
    isCorrect: null,
    preIntensity: null,
    selectedScript: null,
    recommendedScripts: [],
    postIntensity: null,
    intensityDelta: null,
    praiseMessage: null,
    badgeEmoji: null,
    error: null,
  },
  states: {
    greeting: {
      on: {
        START: {
          target: 'presentingStory',
          actions: assign({
            story: ({ event }) => event.story,
          }),
        },
      },
    },

    presentingStory: {
      on: {
        STORY_VIEWED: 'labelingEmotion',
      },
    },

    labelingEmotion: {
      on: {
        EMOTION_LABELED: {
          target: 'checkingCorrectness',
          actions: assign({
            labeledEmotion: ({ event }) => event.emotion,
          }),
        },
      },
    },

    checkingCorrectness: {
      invoke: {
        src: 'checkEmotionCorrectness',
        input: ({ context }) => ({
          labeledEmotion: context.labeledEmotion!,
          story: context.story!,
        }),
        onDone: {
          target: 'ratingIntensity',
          actions: assign({
            isCorrect: ({ event }) => event.output.isCorrect,
          }),
        },
        onError: {
          target: 'error',
          actions: assign({
            error: 'Failed to check emotion correctness',
          }),
        },
      },
    },

    ratingIntensity: {
      on: {
        INTENSITY_RATED: {
          target: 'fetchingScripts',
          actions: assign({
            preIntensity: ({ event }) => event.intensity,
          }),
        },
      },
    },

    fetchingScripts: {
      invoke: {
        src: 'fetchRecommendedScripts',
        input: ({ context }) => ({
          emotion: context.labeledEmotion!,
          intensity: context.preIntensity!,
        }),
        onDone: {
          target: 'offeringRegulation',
          actions: assign({
            recommendedScripts: ({ event }) => event.output.scripts,
          }),
        },
        onError: {
          target: 'error',
          actions: assign({
            error: 'Failed to fetch regulation scripts',
          }),
        },
      },
    },

    offeringRegulation: {
      on: {
        SCRIPT_SELECTED: {
          target: 'runningScript',
          actions: assign({
            selectedScript: ({ event }) => event.script,
          }),
        },
        SKIP: 'reflecting',
      },
    },

    runningScript: {
      on: {
        SCRIPT_COMPLETED: 'reflecting',
      },
    },

    reflecting: {
      on: {
        REFLECTION_COMPLETED: {
          target: 'updatingRound',
          actions: assign({
            postIntensity: ({ event }) => event.postIntensity,
            intensityDelta: ({ context, event }) =>
              context.preIntensity !== null
                ? event.postIntensity - context.preIntensity
                : null,
          }),
        },
      },
    },

    updatingRound: {
      invoke: {
        src: 'updateRound',
        input: ({ context }) => ({
          sessionId: context.sessionId,
          roundNumber: context.roundNumber,
          labeledEmotion: context.labeledEmotion!,
          isCorrect: context.isCorrect!,
          preIntensity: context.preIntensity!,
          postIntensity: context.postIntensity!,
          scriptId: context.selectedScript?.id || null,
        }),
        onDone: {
          target: 'generatingPraise',
        },
        onError: {
          target: 'generatingPraise',
          actions: assign({
            error: 'Failed to update round data',
          }),
        },
      },
    },

    generatingPraise: {
      invoke: {
        src: 'generatePraise',
        input: ({ context }) => ({
          childNickname: context.childNickname,
          emotion: context.labeledEmotion!,
          isCorrect: context.isCorrect!,
          preIntensity: context.preIntensity!,
          postIntensity: context.postIntensity!,
          roundNumber: context.roundNumber,
          totalRounds: context.totalRounds,
        }),
        onDone: {
          target: 'praising',
          actions: assign({
            praiseMessage: ({ event }) => event.output.message,
            badgeEmoji: ({ event }) => event.output.badgeEmoji || null,
          }),
        },
        onError: {
          target: 'praising',
          actions: assign({
            praiseMessage: ({ context }) =>
              `Great work, ${context.childNickname}! You're doing an amazing job learning about emotions! 🌟`,
            badgeEmoji: '⭐',
            error: null,
          }),
        },
      },
    },

    praising: {
      on: {
        PRAISE_ACKNOWLEDGED: 'completed',
      },
    },

    completed: {
      type: 'final',
    },

    error: {
      on: {
        RETRY: {
          target: 'greeting',
          actions: assign({
            error: null,
          }),
        },
      },
    },
  },
})

// ==================== Helper Functions ====================
export function createEmotionRoundContext(
  sessionId: string,
  roundNumber: number,
  childNickname: string,
  totalRounds: number = 5
): EmotionRoundContext {
  return {
    sessionId,
    roundNumber,
    totalRounds,
    childNickname,
    story: null,
    labeledEmotion: null,
    isCorrect: null,
    preIntensity: null,
    selectedScript: null,
    recommendedScripts: [],
    postIntensity: null,
    intensityDelta: null,
    praiseMessage: null,
    badgeEmoji: null,
    error: null,
  }
}