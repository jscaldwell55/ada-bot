import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Lenient schema with defaults - matches state machine output
const praiseRequestSchema = z.object({
  child_nickname: z.string().optional().default('friend'),
  labeled_emotion: z.string(),
  is_correct: z.boolean().optional().default(false),
  pre_intensity: z.number().min(1).max(5).optional().default(3),
  post_intensity: z.number().min(1).max(5).optional().default(3),
  round_number: z.number().min(1).max(5).optional().default(1),
  session_id: z.string().optional(),
  round_id: z.string().optional(),
})

// Feature flag check
const AGENT_PRAISE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_ACTION_PRAISE === 'true'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request with lenient schema
    const validated = praiseRequestSchema.parse(body)
    
    // If agents are enabled and round_id is provided, use agent-based praise
    if (AGENT_PRAISE_ENABLED && validated.round_id) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const agentResponse = await fetch(
          `${baseUrl}/api/agent/generate-praise`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              child_nickname: validated.child_nickname,
              labeled_emotion: validated.labeled_emotion,
              is_correct: validated.is_correct,
              pre_intensity: validated.pre_intensity,
              post_intensity: validated.post_intensity,
              intensity_delta: validated.post_intensity - validated.pre_intensity,
              round_number: validated.round_number,
              round_id: validated.round_id,
            }),
          }
        )
        
        if (agentResponse.ok) {
          const agentData = await agentResponse.json()
          return NextResponse.json({
            message: agentData.praise?.praise_message || agentData.praise_message,
            badge_emoji: agentData.praise?.badge_emoji || '🎉',
            is_safe: true,
            agent_generated: true,
          })
        }
        
        // If agent fails, fall through to static praise
        console.warn('Agent praise generation failed, using fallback')
      } catch (agentError) {
        console.warn('Agent praise error:', agentError)
        // Fall through to static praise
      }
    }
    
    // Static praise generation (fallback or default)
    const intensity_delta = validated.pre_intensity - validated.post_intensity
    
    let praiseMessage = ''
    let badgeEmoji = '🎉'
    
    // Determine praise based on performance
    if (intensity_delta >= 2) {
      praiseMessage = `Amazing work, ${validated.child_nickname}! You did a great job calming down. Your body and mind are getting stronger at handling big feelings! 🌟`
      badgeEmoji = '🏆'
    } else if (intensity_delta >= 1) {
      praiseMessage = `Great job, ${validated.child_nickname}! You helped yourself feel a little calmer. That takes practice and you're doing it! 💪`
      badgeEmoji = '⭐'
    } else if (intensity_delta === 0) {
      praiseMessage = `Good try, ${validated.child_nickname}! Sometimes feelings stay big for a while, and that's okay. You practiced a helpful skill today! 🌈`
      badgeEmoji = '✨'
    } else {
      praiseMessage = `Thank you for practicing, ${validated.child_nickname}! Learning about feelings is important, even when they feel tricky. You're doing great! ✨`
      badgeEmoji = '🎉'
    }
    
    // Add emotion-specific encouragement
    if (validated.is_correct) {
      praiseMessage += ` You recognized the feeling of ${validated.labeled_emotion} - that's a superpower!`
    }
    
    return NextResponse.json({
      message: praiseMessage,
      badge_emoji: badgeEmoji,
      is_safe: true,
      fallback: !AGENT_PRAISE_ENABLED,
    })
    
  } catch (error) {
    console.error('Praise generation error:', error)
    
    // Return a generic encouraging message on any error
    return NextResponse.json({
      message: 'Great job practicing today! You\'re learning important skills about understanding feelings. Keep up the good work! 🌟',
      badge_emoji: '🎉',
      is_safe: true,
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}