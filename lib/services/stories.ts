/**
 * Story Service
 * Functions for fetching and filtering emotion stories from Supabase
 */

import { createBrowserClient } from '@/lib/supabase/client'
import type { Story, StoryFilters, AgeBand, EmotionLabel } from '@/types/database'

/**
 * Get random stories for a session based on age band
 * Ensures diverse emotion coverage across the selection
 */
export async function getRandomStories(
  ageBand: AgeBand,
  count: number = 5
): Promise<Story[]> {
  // Temporary workaround for Supabase type inference issue
  const supabase = createBrowserClient() as any

  // Fetch all stories for the age band
  const { data: allStories, error } = await supabase
    .from('stories')
    .select('*')
    .eq('age_band', ageBand)

  if (error) {
    throw new Error(`Failed to fetch stories: ${error.message}`)
  }

  if (!allStories || allStories.length === 0) {
    throw new Error(`No stories found for age band: ${ageBand}`)
  }

  // Group stories by emotion for diverse selection
  const storiesByEmotion = allStories.reduce((acc: any, story: any) => {
    if (!acc[story.emotion]) {
      acc[story.emotion] = []
    }
    acc[story.emotion].push(story)
    return acc
  }, {} as Record<EmotionLabel, Story[]>)

  // Select stories trying to maximize emotion diversity
  const selectedStories: Story[] = []
  const emotions = Object.keys(storiesByEmotion) as EmotionLabel[]

  // First pass: one story from each emotion
  let emotionIndex = 0
  while (selectedStories.length < count && emotionIndex < emotions.length) {
    const emotion = emotions[emotionIndex]
    const emotionStories = storiesByEmotion[emotion]

    if (emotionStories && emotionStories.length > 0) {
      const randomIndex = Math.floor(Math.random() * emotionStories.length)
      selectedStories.push(emotionStories[randomIndex])
      // Remove selected story to avoid duplicates
      emotionStories.splice(randomIndex, 1)
    }

    emotionIndex++
  }

  // Second pass: fill remaining slots with random stories
  while (selectedStories.length < count) {
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
    const emotionStories = storiesByEmotion[randomEmotion]

    if (emotionStories && emotionStories.length > 0) {
      const randomIndex = Math.floor(Math.random() * emotionStories.length)
      selectedStories.push(emotionStories[randomIndex])
      emotionStories.splice(randomIndex, 1)
    }
  }

  // Shuffle the final selection
  return shuffleArray(selectedStories)
}

/**
 * Get a specific story by ID
 */
export async function getStoryById(id: string): Promise<Story | null> {
  // Temporary workaround for Supabase type inference issue
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    throw new Error(`Failed to fetch story: ${error.message}`)
  }

  return data
}

/**
 * Filter stories based on criteria
 */
export async function filterStories(filters: StoryFilters): Promise<Story[]> {
  // Temporary workaround for Supabase type inference issue
  const supabase = createBrowserClient() as any

  let query = supabase.from('stories').select('*')

  if (filters.emotion) {
    query = query.eq('emotion', filters.emotion)
  }

  if (filters.age_band) {
    query = query.eq('age_band', filters.age_band)
  }

  if (filters.min_complexity !== undefined) {
    query = query.gte('complexity_score', filters.min_complexity)
  }

  if (filters.max_complexity !== undefined) {
    query = query.lte('complexity_score', filters.max_complexity)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to filter stories: ${error.message}`)
  }

  return data || []
}

/**
 * Get stories by multiple IDs (for session loading)
 */
export async function getStoriesByIds(ids: string[]): Promise<Story[]> {
  // Temporary workaround for Supabase type inference issue
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .in('id', ids)

  if (error) {
    throw new Error(`Failed to fetch stories: ${error.message}`)
  }

  // Maintain the order of the input IDs
  const storyMap = new Map(data.map((story: any) => [story.id, story]))
  return ids.map(id => storyMap.get(id)).filter(Boolean) as Story[]
}

/**
 * Get story count by emotion and age band (for analytics)
 */
export async function getStoryStatistics(): Promise<
  Array<{ emotion: EmotionLabel; age_band: AgeBand; count: number }>
> {
  // Temporary workaround for Supabase type inference issue
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('stories')
    .select('emotion, age_band')

  if (error) {
    throw new Error(`Failed to fetch story statistics: ${error.message}`)
  }

  // Group and count
  const stats = data.reduce((acc: any, story: any) => {
    const key = `${story.emotion}-${story.age_band}`
    if (!acc[key]) {
      acc[key] = {
        emotion: story.emotion as EmotionLabel,
        age_band: story.age_band as AgeBand,
        count: 0,
      }
    }
    acc[key].count++
    return acc
  }, {} as Record<string, { emotion: EmotionLabel; age_band: AgeBand; count: number }>)

  return Object.values(stats)
}

// ==================== Helper Functions ====================

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
