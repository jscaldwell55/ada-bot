// app/api/elevenlabs-tts/route.ts
// Dead simple ElevenLabs TTS - server-side only

import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY; // Server-side only!
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah (child-friendly)

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || text.length > 500) {
      return NextResponse.json(
        { error: 'Invalid text (max 500 chars)' },
        { status: 400 }
      );
    }

    if (!ELEVENLABS_API_KEY) {
      console.error('[ElevenLabs] API key not configured');
      return NextResponse.json(
        { error: 'TTS not configured', fallback: true },
        { status: 500 }
      );
    }

    console.log('[ElevenLabs] Generating audio for:', text.substring(0, 50) + '...');

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.4,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[ElevenLabs] API error:', error);
      return NextResponse.json(
        { error: 'TTS failed', fallback: true },
        { status: response.status }
      );
    }

    // Get audio as buffer
    const audioBuffer = await response.arrayBuffer();

    // Convert to base64
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    console.log('[ElevenLabs] Audio generated successfully');

    // Return as data URL
    return NextResponse.json({
      success: true,
      audioData: `data:audio/mpeg;base64,${base64Audio}`,
    });

  } catch (error) {
    console.error('[ElevenLabs] Error:', error);
    return NextResponse.json(
      { error: 'Internal error', fallback: true },
      { status: 500 }
    );
  }
}
