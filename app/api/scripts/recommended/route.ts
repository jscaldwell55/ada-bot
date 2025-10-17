/**
 * Recommended Scripts API Route
 * GET /api/scripts/recommended?emotion={emotion}&intensity={intensity}
 * Returns regulation scripts recommended for a given emotion and intensity level
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRecommendedScripts } from '@/lib/services/scripts'
import type { EmotionLabel, IntensityLevel } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const emotion = searchParams.get('emotion')
    const intensityParam = searchParams.get('intensity')

    // Validate required parameters
    if (!emotion) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Missing required parameter: emotion',
        },
        { status: 400 }
      )
    }

    // Validate emotion is a valid EmotionLabel
    const validEmotions: EmotionLabel[] = [
      'happy',
      'sad',
      'angry',
      'scared',
      'surprised',
      'disgusted',
      'calm',
    ]
    if (!validEmotions.includes(emotion as EmotionLabel)) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: `Invalid emotion. Must be one of: ${validEmotions.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Parse and validate intensity (default to 3 if not provided)
    let intensity: IntensityLevel = 3
    if (intensityParam) {
      const parsedIntensity = parseInt(intensityParam, 10)
      if (isNaN(parsedIntensity) || parsedIntensity < 1 || parsedIntensity > 5) {
        return NextResponse.json(
          {
            error: 'validation_error',
            message: 'Intensity must be a number between 1 and 5',
          },
          { status: 400 }
        )
      }
      intensity = parsedIntensity as IntensityLevel
    }

    // Get recommended scripts
    const scripts = await getRecommendedScripts(
      emotion as EmotionLabel,
      intensity
    )

    // Return in format expected by XState machine
    return NextResponse.json(
      {
        scripts,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Script recommendation error:', error)

    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'An unexpected error occurred while fetching recommended scripts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
