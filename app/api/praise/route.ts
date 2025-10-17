/**
 * Praise Generation API Route
 * POST /api/praise - Generate personalized praise using OpenAI with safety checks
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { generatePraiseSchema } from '@/lib/validation/schemas'
import type { GeneratePraiseResponse } from '@/types/api'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Azure Content Safety endpoint (optional - add your endpoint if using)
const AZURE_CONTENT_SAFETY_ENDPOINT = process.env.AZURE_CONTENT_SAFETY_ENDPOINT
const AZURE_CONTENT_SAFETY_KEY = process.env.AZURE_CONTENT_SAFETY_KEY

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = generatePraiseSchema.parse(body)

    const {
      child_nickname,
      is_correct,
      pre_intensity,
      post_intensity,
      round_number,
      total_rounds,
    } = validatedData

    // Calculate intensity delta
    const intensityDelta = post_intensity - pre_intensity
    const improved = intensityDelta < 0

    // Determine badge emoji based on performance
    let badgeEmoji = 'P'
    if (is_correct && improved) {
      badgeEmoji = '<�'
    } else if (is_correct) {
      badgeEmoji = 'P'
    } else if (improved) {
      badgeEmoji = '<'
    }

    // Build context for the praise message
    const isLastRound = round_number >= total_rounds
    const correctnessContext = is_correct
      ? 'correctly identified the emotion'
      : 'worked hard on identifying the emotion'
    const regulationContext = improved
      ? `and did an amazing job bringing the feeling from ${pre_intensity} down to ${post_intensity}`
      : `and practiced their regulation skills`

    // Generate praise using OpenAI
    const systemPrompt = `You are Ada, a supportive emotional learning companion for children ages 6-12.
Generate warm, age-appropriate praise messages that celebrate effort and progress.

Guidelines:
- Use simple, encouraging language
- Keep messages to 2-3 sentences
- Be specific about what they did well
- Never use scary or negative language
- Focus on growth mindset and effort
- Use the child's nickname naturally
- Be genuinely enthusiastic but not over-the-top
- Never mention mistakes directly, always frame positively`

    const userPrompt = `Generate a praise message for ${child_nickname} who just completed round ${round_number} of ${total_rounds}. They ${correctnessContext} ${regulationContext}. ${
      isLastRound
        ? 'This is their last round - celebrate their completion of the whole session!'
        : ''
    }`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 100,
      temperature: 0.8,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0].message.content || ''
    let generatedMessage = ''

    try {
      const parsed = JSON.parse(responseText)
      generatedMessage = parsed.message || parsed.praise || responseText
    } catch {
      // If not JSON, use the text directly
      generatedMessage = responseText
    }

    // Fallback if generation failed
    if (!generatedMessage || generatedMessage.length < 10) {
      generatedMessage = `Amazing work, ${child_nickname}! You ${correctnessContext} and practiced your regulation skills. ${
        isLastRound ? "You've completed all the rounds - fantastic job!" : "Keep up the great work!"
      }`
    }

    // Safety check using Azure Content Safety (if configured)
    let isSafe = true
    if (AZURE_CONTENT_SAFETY_ENDPOINT && AZURE_CONTENT_SAFETY_KEY) {
      try {
        isSafe = await checkContentSafety(generatedMessage)
      } catch (error) {
        console.error('Content safety check failed:', error)
        // Default to safe if check fails
        isSafe = true
      }
    }

    // If unsafe, use a safe fallback message
    const finalMessage = isSafe
      ? generatedMessage
      : `Great job, ${child_nickname}! You're learning so much about emotions!`

    const response: GeneratePraiseResponse = {
      message: finalMessage,
      badge_emoji: badgeEmoji,
      is_safe: isSafe,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Praise generation error:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Invalid request data',
          details: error,
        },
        { status: 400 }
      )
    }

    // Return fallback praise on error
    return NextResponse.json(
      {
        message: 'Amazing work! You did a great job practicing your emotion skills!',
        badge_emoji: 'P',
        is_safe: true,
      },
      { status: 200 }
    )
  }
}

/**
 * Check content safety using Azure Content Safety API
 */
async function checkContentSafety(text: string): Promise<boolean> {
  if (!AZURE_CONTENT_SAFETY_ENDPOINT || !AZURE_CONTENT_SAFETY_KEY) {
    return true
  }

  try {
    const response = await fetch(
      `${AZURE_CONTENT_SAFETY_ENDPOINT}/contentsafety/text:analyze?api-version=2023-10-01`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': AZURE_CONTENT_SAFETY_KEY,
        },
        body: JSON.stringify({
          text,
          categories: ['Hate', 'SelfHarm', 'Sexual', 'Violence'],
          outputType: 'FourSeverityLevels',
        }),
      }
    )

    if (!response.ok) {
      console.error('Azure Content Safety API error:', response.statusText)
      return true // Default to safe if API fails
    }

    const result = await response.json()

    // Check if any category has severity >= 2 (medium or high)
    const hasUnsafeContent = result.categoriesAnalysis?.some(
      (category: any) => category.severity >= 2
    )

    return !hasUnsafeContent
  } catch (error) {
    console.error('Content safety check error:', error)
    return true // Default to safe if check fails
  }
}
