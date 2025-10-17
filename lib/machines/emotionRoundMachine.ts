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
    const response = await fetch('/api/praise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      throw new Error('Failed to generate praise')
    }

    const data = await response.json()
    return {
      message: data.message,
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
          target: 'generatingPraise',
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
              `Great work, ${context.childNickname}! You're doing an amazing job learning about emotions!`,
            badgeEmoji: 'P',
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
