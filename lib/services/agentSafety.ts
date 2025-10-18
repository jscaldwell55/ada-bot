/**
 * Agent Safety Pipeline Service
 * Content safety checks for AI-generated content (stories, scripts, praise)
 */

import { checkForCrisisKeywords } from './safety'
import type { SafetyCheckResult } from '@/types/agents'

// ==================== Safety Configuration ====================

// Inappropriate content keywords for child-facing content
const INAPPROPRIATE_KEYWORDS = [
  // Violence & Harm
  'blood', 'death', 'die', 'kill', 'murder', 'weapon', 'gun', 'knife', 'stab',
  'beat up', 'punch', 'kick', 'fight', 'violence', 'violent', 'attack',

  // Abuse & Trauma
  'abuse', 'abused', 'hurt myself', 'hurt yourself', 'hurt himself', 'hurt herself',
  'suicide', 'suicidal', 'self-harm', 'cutting',

  // Scary/Frightening
  'scary', 'terror', 'horror', 'nightmare', 'monster', 'ghost', 'demon',
  'creepy', 'spooky', 'haunted',

  // Inappropriate Adult Content
  'sex', 'sexual', 'naked', 'nude', 'drugs', 'alcohol', 'drunk', 'smoking',
  'cigarette', 'beer', 'wine',

  // Bullying & Exclusion (context-dependent, but flagged)
  'stupid', 'dumb', 'idiot', 'loser', 'freak', 'weirdo', 'reject',
  'nobody likes', 'everyone hates',
]

// Toxic/harmful language patterns (subtle toxicity detection)
const TOXIC_PATTERNS = [
  // Derogatory/Insulting
  'worthless', 'pathetic', 'useless', 'disgusting', 'revolting', 'vile',
  'repulsive', 'despicable', 'contemptible', 'insufferable',

  // Dismissive/Belittling
  'cry baby', 'crybaby', 'wimp', 'weakling', 'coward', 'baby',
  'grow up', 'get over it', 'stop being', 'quit being',

  // Exclusionary/Rejection
  'nobody wants', 'no one likes', 'everyone thinks', 'everybody knows',
  'hate you', 'wish you', 'better off without',

  // Shaming
  'should be ashamed', 'embarrassing', 'embarrassment', 'shame on you',
  'disgrace', 'disappointment', 'failed', 'failure',

  // Threatening/Aggressive
  'shut up', 'get lost', 'go away', 'leave me alone', 'i hate',

  // Comparative Harm
  'worse than', 'not as good', 'never be', 'always will be',
]

// Length constraints
const STORY_MIN_LENGTH = 10
const STORY_MAX_LENGTH = 500
const PRAISE_MIN_LENGTH = 10
const PRAISE_MAX_LENGTH = 500
const SCRIPT_STEP_MIN_LENGTH = 5
const SCRIPT_STEP_MAX_LENGTH = 200

// ==================== Safety Check Functions ====================

/**
 * Comprehensive safety check for AI-generated content
 */
export async function runContentSafetyCheck(
  content: string,
  contentType: 'story' | 'script' | 'praise'
): Promise<SafetyCheckResult> {
  const flags: string[] = []

  // 1. Length validation
  const lengthCheck = validateLength(content, contentType)
  if (!lengthCheck.valid) {
    return {
      passed: false,
      flags: ['length_violation'],
      reason: lengthCheck.reason,
    }
  }
  flags.push('length_valid')

  // 2. Crisis keyword check
  const crisisCheck = checkForCrisisKeywords(content)
  if (crisisCheck.hasCrisisKeywords) {
    return {
      passed: false,
      flags: ['crisis_keywords_detected', ...flags],
      keyword_violations: crisisCheck.matchedKeywords,
      reason: `Crisis keywords detected: ${crisisCheck.matchedKeywords.join(', ')}`,
    }
  }
  flags.push('crisis_keywords_passed')

  // 3. Inappropriate content keyword filter
  const inappropriateCheck = checkInappropriateKeywords(content)
  if (inappropriateCheck.matched.length > 0) {
    return {
      passed: false,
      flags: ['inappropriate_content', ...flags],
      keyword_violations: inappropriateCheck.matched,
      reason: `Inappropriate keywords detected: ${inappropriateCheck.matched.join(', ')}`,
    }
  }
  flags.push('keyword_filter_passed')

  // 4. Toxicity detection (subtle harmful language)
  const toxicityCheck = await checkToxicity(content)
  if (!toxicityCheck.passed) {
    return {
      passed: false,
      flags: ['toxicity_detected', ...flags],
      toxicity_score: toxicityCheck.score,
      keyword_violations: toxicityCheck.matched,
      reason: `Toxic content detected: ${toxicityCheck.reason}`,
    }
  }
  flags.push('toxicity_check_passed')

  // 5. Basic content validation (no empty, no excessive caps, etc.)
  const basicCheck = validateBasicContent(content)
  if (!basicCheck.valid) {
    return {
      passed: false,
      flags: ['basic_validation_failed', ...flags],
      reason: basicCheck.reason,
    }
  }
  flags.push('basic_validation_passed')

  // All checks passed
  return {
    passed: true,
    flags: [...flags, 'all_checks_passed'],
  }
}

/**
 * Validate content length based on type
 */
function validateLength(
  content: string,
  contentType: 'story' | 'script' | 'praise'
): { valid: boolean; reason?: string } {
  const length = content.trim().length

  switch (contentType) {
    case 'story':
      if (length < STORY_MIN_LENGTH) {
        return { valid: false, reason: `Story too short (${length} < ${STORY_MIN_LENGTH} chars)` }
      }
      if (length > STORY_MAX_LENGTH) {
        return { valid: false, reason: `Story too long (${length} > ${STORY_MAX_LENGTH} chars)` }
      }
      break

    case 'praise':
      if (length < PRAISE_MIN_LENGTH) {
        return { valid: false, reason: `Praise too short (${length} < ${PRAISE_MIN_LENGTH} chars)` }
      }
      if (length > PRAISE_MAX_LENGTH) {
        return { valid: false, reason: `Praise too long (${length} > ${PRAISE_MAX_LENGTH} chars)` }
      }
      break

    case 'script':
      if (length < SCRIPT_STEP_MIN_LENGTH) {
        return { valid: false, reason: `Script step too short (${length} < ${SCRIPT_STEP_MIN_LENGTH} chars)` }
      }
      if (length > SCRIPT_STEP_MAX_LENGTH) {
        return { valid: false, reason: `Script step too long (${length} > ${SCRIPT_STEP_MAX_LENGTH} chars)` }
      }
      break
  }

  return { valid: true }
}

/**
 * Check for inappropriate keywords
 */
function checkInappropriateKeywords(text: string): { matched: string[] } {
  const normalizedText = text.toLowerCase()
  const matched: string[] = []

  for (const keyword of INAPPROPRIATE_KEYWORDS) {
    const wordBoundaryRegex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i')
    if (wordBoundaryRegex.test(normalizedText)) {
      matched.push(keyword)
    }
  }

  return { matched }
}

/**
 * Check for toxic/harmful language patterns
 * TODO: Integrate ML-based toxicity detection (Perspective API or local model) for production
 */
async function checkToxicity(text: string): Promise<{
  passed: boolean
  score?: number
  matched?: string[]
  reason?: string
}> {
  const normalizedText = text.toLowerCase()
  const matched: string[] = []

  // Check toxic patterns
  for (const pattern of TOXIC_PATTERNS) {
    if (normalizedText.includes(pattern.toLowerCase())) {
      matched.push(pattern)
    }
  }

  // Calculate toxicity score (0-1) based on matches
  // More matches = higher toxicity
  const score = Math.min(matched.length * 0.2, 1.0)

  // Threshold: Fail if 2+ toxic patterns found (score >= 0.4)
  if (matched.length >= 2) {
    return {
      passed: false,
      score,
      matched,
      reason: `Multiple toxic patterns detected: ${matched.join(', ')}`,
    }
  }

  // Single toxic pattern: Warn but may pass depending on context
  // For children's therapeutic app, we fail on ANY toxic pattern
  if (matched.length === 1) {
    return {
      passed: false,
      score,
      matched,
      reason: `Toxic pattern detected: ${matched[0]}`,
    }
  }

  // TODO: Production Enhancement
  // Integrate Perspective API or TensorFlow.js toxicity model here:
  //
  // Option 1: Perspective API (requires API key)
  // const perspective = new Perspective({ apiKey: process.env.PERSPECTIVE_API_KEY })
  // const result = await perspective.analyze(text, { attributes: ['TOXICITY'] })
  // const mlScore = result.attributeScores.TOXICITY.summaryScore.value
  // if (mlScore > 0.5) return { passed: false, score: mlScore, reason: 'ML toxicity detected' }
  //
  // Option 2: TensorFlow.js toxicity (local, no API needed)
  // const toxicity = await import('@tensorflow-models/toxicity')
  // const model = await toxicity.load(0.5)
  // const predictions = await model.classify([text])
  // // Check predictions for toxic labels
  //
  // For now, keyword-based detection provides good coverage for children's content

  return {
    passed: true,
    score: 0,
    matched: [],
  }
}

/**
 * Basic content validation
 */
function validateBasicContent(content: string): { valid: boolean; reason?: string } {
  const trimmed = content.trim()

  // Check for empty content
  if (trimmed.length === 0) {
    return { valid: false, reason: 'Empty content' }
  }

  // Check for excessive capitalization (> 50% caps = likely shouting/error)
  const uppercaseCount = (trimmed.match(/[A-Z]/g) || []).length
  const letterCount = (trimmed.match(/[A-Za-z]/g) || []).length
  if (letterCount > 0 && uppercaseCount / letterCount > 0.5) {
    return { valid: false, reason: 'Excessive capitalization detected' }
  }

  // Check for suspicious patterns (excessive repetition)
  const words = trimmed.split(/\s+/)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()))
  if (words.length > 5 && uniqueWords.size < words.length * 0.3) {
    return { valid: false, reason: 'Excessive word repetition detected' }
  }

  return { valid: true }
}

/**
 * Validate story output structure and content
 */
export async function validateStoryOutput(storyOutput: {
  story_text: string
  target_emotion: string
  theme: string
  complexity_score: number
}): Promise<SafetyCheckResult> {
  // Run safety check on story text
  const safetyResult = await runContentSafetyCheck(storyOutput.story_text, 'story')
  if (!safetyResult.passed) {
    return safetyResult
  }

  // Additional story-specific validations
  const flags = [...(safetyResult.flags || [])]

  // Check sentence count (should be 2-3 sentences)
  const sentences = storyOutput.story_text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length < 2 || sentences.length > 4) {
    return {
      passed: false,
      flags: ['sentence_count_invalid', ...flags],
      reason: `Story should have 2-3 sentences, got ${sentences.length}`,
    }
  }
  flags.push('sentence_count_valid')

  // Check complexity score range
  if (storyOutput.complexity_score < 1 || storyOutput.complexity_score > 5) {
    return {
      passed: false,
      flags: ['complexity_out_of_range', ...flags],
      reason: `Complexity score must be 1-5, got ${storyOutput.complexity_score}`,
    }
  }
  flags.push('complexity_valid')

  return {
    passed: true,
    flags: [...flags, 'story_validation_passed'],
  }
}

/**
 * Validate script output structure and content
 */
export async function validateScriptOutput(scriptOutput: {
  primary_script: {
    name: string
    steps: string[]
    duration_seconds: number
    adaptation_note: string
  }
}): Promise<SafetyCheckResult> {
  const flags: string[] = []

  // Check step count (4-7 steps)
  if (scriptOutput.primary_script.steps.length < 4 || scriptOutput.primary_script.steps.length > 7) {
    return {
      passed: false,
      flags: ['step_count_invalid'],
      reason: `Script should have 4-7 steps, got ${scriptOutput.primary_script.steps.length}`,
    }
  }
  flags.push('step_count_valid')

  // Check duration (30-120 seconds)
  if (scriptOutput.primary_script.duration_seconds < 30 || scriptOutput.primary_script.duration_seconds > 120) {
    return {
      passed: false,
      flags: ['duration_invalid', ...flags],
      reason: `Duration should be 30-120 seconds, got ${scriptOutput.primary_script.duration_seconds}`,
    }
  }
  flags.push('duration_valid')

  // Validate each step
  for (let i = 0; i < scriptOutput.primary_script.steps.length; i++) {
    const step = scriptOutput.primary_script.steps[i]
    const stepSafety = await runContentSafetyCheck(step, 'script')

    if (!stepSafety.passed) {
      return {
        passed: false,
        flags: [`step_${i + 1}_failed`, ...flags],
        reason: `Step ${i + 1} failed safety check: ${stepSafety.reason}`,
      }
    }
  }
  flags.push('all_steps_safe')

  return {
    passed: true,
    flags: [...flags, 'script_validation_passed'],
  }
}

/**
 * Validate praise output structure and content
 */
export async function validatePraiseOutput(praiseOutput: {
  praise_message: string
  highlights: string[]
  encouragement_focus: string
}): Promise<SafetyCheckResult> {
  // Run safety check on praise message
  const safetyResult = await runContentSafetyCheck(praiseOutput.praise_message, 'praise')
  if (!safetyResult.passed) {
    return safetyResult
  }

  const flags = [...(safetyResult.flags || [])]

  // Check that praise is not too generic (must have some specific content)
  const genericPhrases = ['good job', 'great work', 'nice', 'well done']
  const isPraiseSpecific = praiseOutput.highlights.length > 0 ||
                           !genericPhrases.every(phrase =>
                             praiseOutput.praise_message.toLowerCase().includes(phrase))

  if (!isPraiseSpecific && praiseOutput.highlights.length === 0) {
    return {
      passed: false,
      flags: ['praise_too_generic', ...flags],
      reason: 'Praise lacks specific achievements or highlights',
    }
  }
  flags.push('praise_specific')

  return {
    passed: true,
    flags: [...flags, 'praise_validation_passed'],
  }
}

/**
 * Check if content contains pseudoscience or unproven methods
 * (Specifically for scripts)
 */
export function checkForPseudoscience(text: string): { hasPseudoscience: boolean; matched: string[] } {
  const pseudoscienceKeywords = [
    'chakra', 'chakras', 'energy healing', 'aura', 'crystal', 'reiki',
    'quantum healing', 'vibration', 'frequency healing', 'essential oils cure',
  ]

  const normalizedText = text.toLowerCase()
  const matched: string[] = []

  for (const keyword of pseudoscienceKeywords) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      matched.push(keyword)
    }
  }

  return {
    hasPseudoscience: matched.length > 0,
    matched,
  }
}
