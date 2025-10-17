// lib/utils/constants.ts
// Constants for Ada Emotion Coach

export type EmotionType =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'scared'
  | 'surprised'
  | 'disgusted'
  | 'calm';

// ============================================
// EMOTION CONFIGURATIONS
// ============================================

export interface EmotionConfig {
  id: EmotionType;
  label: string;
  emoji: string;
  color: string;
  borderColor: string;
  textColor: string;
  description: string;
  synonyms: string[];
}

export const EMOTIONS: Record<EmotionType, EmotionConfig> = {
  happy: {
    id: 'happy',
    label: 'Happy',
    emoji: '😊',
    color: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    textColor: 'text-yellow-800',
    description: 'Feeling good and joyful',
    synonyms: ['glad', 'joyful', 'cheerful', 'pleased', 'delighted']
  },
  sad: {
    id: 'sad',
    label: 'Sad',
    emoji: '😢',
    color: 'bg-blue-100',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-800',
    description: 'Feeling down or upset',
    synonyms: ['unhappy', 'upset', 'blue', 'down', 'disappointed']
  },
  angry: {
    id: 'angry',
    label: 'Angry',
    emoji: '😠',
    color: 'bg-red-100',
    borderColor: 'border-red-300',
    textColor: 'text-red-800',
    description: 'Feeling mad or upset',
    synonyms: ['mad', 'furious', 'annoyed', 'irritated']
  },
  scared: {
    id: 'scared',
    label: 'Scared',
    emoji: '😨',
    color: 'bg-purple-100',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-800',
    description: 'Feeling frightened or afraid',
    synonyms: ['afraid', 'frightened', 'worried', 'anxious', 'terrified']
  },
  surprised: {
    id: 'surprised',
    label: 'Surprised',
    emoji: '😲',
    color: 'bg-indigo-100',
    borderColor: 'border-indigo-300',
    textColor: 'text-indigo-800',
    description: 'Feeling shocked or amazed',
    synonyms: ['shocked', 'amazed', 'astonished', 'startled']
  },
  disgusted: {
    id: 'disgusted',
    label: 'Disgusted',
    emoji: '🤢',
    color: 'bg-lime-100',
    borderColor: 'border-lime-300',
    textColor: 'text-lime-800',
    description: 'Feeling grossed out',
    synonyms: ['gross', 'yucky', 'icky', 'revolted']
  },
  calm: {
    id: 'calm',
    label: 'Calm',
    emoji: '😌',
    color: 'bg-green-100',
    borderColor: 'border-green-300',
    textColor: 'text-green-800',
    description: 'Feeling peaceful and relaxed',
    synonyms: ['peaceful', 'relaxed', 'tranquil', 'serene', 'content']
  }
};

export const getEmotionConfig = (emotion: EmotionType): EmotionConfig => {
  return EMOTIONS[emotion];
};

export const EMOTION_LIST: EmotionType[] = [
  'happy', 'sad', 'angry', 'scared', 'surprised', 'disgusted', 'calm'
];

// ============================================
// INTENSITY LEVELS
// ============================================

export interface IntensityLevel {
  value: number;
  label: string;
  emoji: string;
  description: string;
  color: string;
}

export const INTENSITY_LEVELS: IntensityLevel[] = [
  {
    value: 1,
    label: 'Tiny',
    emoji: '🔸',
    description: 'Just a little bit',
    color: 'bg-gray-200'
  },
  {
    value: 2,
    label: 'Small',
    emoji: '🔹',
    description: 'A small feeling',
    color: 'bg-blue-200'
  },
  {
    value: 3,
    label: 'Medium',
    emoji: '🔶',
    description: 'A medium feeling',
    color: 'bg-yellow-300'
  },
  {
    value: 4,
    label: 'Big',
    emoji: '🔴',
    description: 'A big feeling',
    color: 'bg-orange-400'
  },
  {
    value: 5,
    label: 'Huge',
    emoji: '⭐',
    description: 'A very big feeling',
    color: 'bg-red-500'
  }
];

export const getIntensityConfig = (value: number): IntensityLevel => {
  return INTENSITY_LEVELS.find(level => level.value === value) || INTENSITY_LEVELS[2];
};

// ============================================
// SESSION CONFIGURATION
// ============================================

export const SESSION_CONFIG = {
  ROUNDS_PER_SESSION: 5,
  MIN_ROUNDS_FOR_COMPLETION: 3,
  SESSION_TIMEOUT_MS: 15 * 60 * 1000,
  ROUND_TIMEOUT_MS: 5 * 60 * 1000,
  AUTO_PRAISE_THRESHOLD: 1,
};

// ============================================
// SCRIPT RECOMMENDATIONS
// ============================================

export const SCRIPT_RECOMMENDATIONS: Record<EmotionType, string[]> = {
  sad: ['bubble-breathing', 'comfort-time', 'gentle-stretch'],
  angry: ['wall-pushes', 'count-to-ten', 'bubble-breathing'],
  scared: ['grounding-5-4-3-2-1', 'bubble-breathing', 'gentle-stretch'],
  surprised: ['bubble-breathing', 'gentle-stretch'],
  disgusted: ['bubble-breathing', 'gentle-stretch'],
  happy: ['dance-it-out', 'share-joy'],
  calm: ['gratitude-moment', 'gentle-stretch']
};

export const getRecommendedScripts = (
  emotion: EmotionType,
  intensity: number
): string[] => {
  const baseScripts = SCRIPT_RECOMMENDATIONS[emotion] || ['bubble-breathing'];
  
  if (intensity >= 4) {
    return ['wall-pushes', ...baseScripts.filter(s => s !== 'wall-pushes')].slice(0, 3);
  }
  
  if (intensity <= 2) {
    return baseScripts.filter(s => s !== 'wall-pushes').slice(0, 2);
  }
  
  return baseScripts.slice(0, 3);
};

// ============================================
// CRISIS KEYWORDS
// ============================================

export const CRISIS_KEYWORDS = [
  'hurt myself',
  'kill myself',
  'want to die',
  'end my life',
  'suicide',
  'not worth living',
  'everyone hates me',
  'wish I was dead'
];

// ============================================
// UI COPY
// ============================================

export const GREETING_MESSAGES = [
  "Hi {name}! Ready to check in with some feelings today?",
  "Hello {name}! Let's explore some stories together.",
  "Hey {name}! Time for our emotion practice!",
  "Welcome back {name}! Let's see how you're doing today."
];

export const STORY_PROMPTS = [
  "Here's a short story. How do you think this person feels?",
  "Let's read about someone's day. What emotion do you see?",
  "This is a little story. Can you spot the feeling?",
  "Read this and tell me - what's the emotion here?"
];

export const INTENSITY_PROMPTS = [
  "How big is the feeling?",
  "Is it a tiny feeling or a huge feeling?",
  "How strong is the emotion?",
  "On a scale from tiny to huge, how big?"
];

export const REGULATION_PROMPTS = [
  "Let's try something to help with that feeling!",
  "Want to practice calming down?",
  "Let's do an activity together!",
  "Time to try a helpful strategy!"
];

export const REFLECTION_PROMPTS = [
  "How does the feeling seem now?",
  "Did the activity help? How big is the feeling now?",
  "Let's check in - how are you feeling now?",
  "After our practice, how's the feeling?"
];

export const PRAISE_TEMPLATES = [
  "You did it! Great work noticing that feeling! 🌟",
  "Awesome job! You're getting really good at this! ✨",
  "Way to go! You helped yourself feel better! 💫",
  "I'm proud of you for trying! You're doing great! 🎉",
  "Nice work! That took courage! 💪"
];

// ============================================
// ANALYTICS EVENTS
// ============================================

export const ANALYTICS_EVENTS = {
  SESSION_STARTED: 'session_started',
  SESSION_COMPLETED: 'session_completed',
  SESSION_ABANDONED: 'session_abandoned',
  ROUND_STARTED: 'round_started',
  ROUND_COMPLETED: 'round_completed',
  EMOTION_LABELED: 'emotion_labeled',
  INTENSITY_RATED: 'intensity_rated',
  SCRIPT_SELECTED: 'script_selected',
  SCRIPT_COMPLETED: 'script_completed',
  REFLECTION_COMPLETED: 'reflection_completed',
  SAFETY_ALERT_TRIGGERED: 'safety_alert_triggered',
  PARENT_NOTIFIED: 'parent_notified',
  TTS_ENABLED: 'tts_enabled',
  TTS_DISABLED: 'tts_disabled',
  LOW_SENSORY_TOGGLED: 'low_sensory_toggled'
} as const;

// ============================================
// AVATAR EMOJIS
// ============================================

export const AVATAR_EMOJIS = [
  '😊', '🌟', '🦋', '🌈', '🎨',
  '🎵', '🐱', '🐶', '🦊', '🐼',
  '🦁', '🐸', '🦉', '🐢', '🦕',
  '🚀', '✨', '💫', '🌸', '🌺'
];

// ============================================
// TIMING CONSTANTS
// ============================================

export const TIMING = {
  TOAST_DURATION: 3000,
  AUTO_ADVANCE_DELAY: 2000,
  TTS_PAUSE_BETWEEN_SENTENCES: 500,
  SCRIPT_STEP_MINIMUM: 2000,
  CELEBRATION_ANIMATION: 1500,
} as const;