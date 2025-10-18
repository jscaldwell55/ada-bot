/**
 * OpenAI Client Helper with Timeout Support
 * Prevents API calls from hanging indefinitely
 */

export class OpenAITimeoutError extends Error {
  constructor(message: string = 'OpenAI request timed out') {
    super(message)
    this.name = 'OpenAITimeoutError'
  }
}

/**
 * Call OpenAI API with timeout protection
 *
 * @param requestFn - Function that makes the OpenAI API call
 * @param timeoutMs - Timeout in milliseconds (default: 10 seconds)
 * @returns Promise that resolves with the API response or rejects on timeout
 *
 * @example
 * const completion = await callOpenAIWithTimeout(
 *   () => openai.chat.completions.create({ ... }),
 *   5000  // 5 second timeout
 * )
 */
export async function callOpenAIWithTimeout<T>(
  requestFn: () => Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  let timeoutId: NodeJS.Timeout

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new OpenAITimeoutError(`Request exceeded ${timeoutMs}ms timeout`))
    }, timeoutMs)
  })

  try {
    // Race between the actual request and the timeout
    const result = await Promise.race([
      requestFn(),
      timeoutPromise
    ])

    // Clear timeout if request completed successfully
    clearTimeout(timeoutId!)
    return result
  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeoutId!)
    throw error
  }
}

/**
 * Default timeout values for different agent types
 * Observer: Longer timeout (more complex analysis)
 * Story/Script: Medium timeout (creative generation)
 * Praise: Shorter timeout (simpler generation)
 */
export const AGENT_TIMEOUTS = {
  observer: 15000,      // 15 seconds
  action_story: 10000,  // 10 seconds
  action_script: 10000, // 10 seconds
  action_praise: 5000,  // 5 seconds
} as const
