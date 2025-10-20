// app/api/elevenlabs-tts/route.ts
// Dead simple ElevenLabs TTS - server-side only

import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY; // Server-side only!
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah (child-friendly)

/**
 * Sanitize text for ElevenLabs TTS to prevent voice splitting/overlapping
 * Removes problematic formatting that causes the model to use multiple voices
 */
function sanitizeTextForTTS(text: string): string {
  return text
    // Remove emojis (they can cause pauses or voice changes)
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
    // Normalize ellipses (... becomes a brief pause)
    .replace(/\.{3,}/g, ',')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Remove line breaks (replace with space)
    .replace(/[\r\n]+/g, ' ')
    // Normalize quotes (straight quotes only)
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Remove leading/trailing whitespace
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || text.length > 500) {
      return NextResponse.json(
        { error: 'Invalid text (max 500 chars)' },
        { status: 400 }
      );
    }

    // Sanitize text before sending to ElevenLabs
    const sanitizedText = sanitizeTextForTTS(text);

    if (!ELEVENLABS_API_KEY) {
      console.error('[ElevenLabs] API key not configured');
      return NextResponse.json(
        { error: 'TTS not configured', fallback: true },
        { status: 500 }
      );
    }

    console.log('[ElevenLabs] Generating audio for:', sanitizedText.substring(0, 50) + '...');
    if (text !== sanitizedText) {
      console.log('[ElevenLabs] Text was sanitized (emojis/formatting removed)');
    }

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
          text: sanitizedText,
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
