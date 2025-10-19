# Vapi Text-to-Speech Integration

## Overview

Ada uses Vapi's REST API for **text-to-speech (TTS) only**. We do **not** use the Vapi SDK or conversational features. This simplifies the implementation and eliminates issues with WebSocket connections and Deepgram transcription.

## Architecture

```
┌─────────────────┐
│  React Component │
│  (UI)           │
└────────┬────────┘
         │
         │ useVapiTTS()
         ▼
┌─────────────────┐
│  vapiTTS Service │
│  (Client-side)  │
└────────┬────────┘
         │
         │ fetch('/api/vapi-tts')
         ▼
┌─────────────────┐
│  API Route      │
│  (Server-side)  │
└────────┬────────┘
         │
         │ VAPI_PRIVATE_KEY
         ▼
┌─────────────────┐
│  Vapi API       │
│  (External)     │
└─────────────────┘
```

## Key Components

### 1. VapiTTS Service (`lib/services/vapiTTS.ts`)

Client-side singleton service that:
- Manages audio playback
- Caches generated audio
- Handles stop/play state
- Calls the server-side API route

### 2. useVapiTTS Hook (`lib/hooks/useVapiTTS.ts`)

React hook that provides:
- `speak(text, options)` - Generate and play TTS
- `stop()` - Stop current playback
- `isPlaying` - Current playback state

### 3. API Route (`app/api/vapi-tts/route.ts`)

Server-side API that:
- Securely stores `VAPI_PRIVATE_KEY`
- Calls Vapi's TTS endpoint
- Returns base64-encoded audio
- Adjusts voice style based on emotion

## Usage

### Basic Usage

```tsx
import { useVapiTTS } from '@/lib/hooks/useVapiTTS';

export function MyComponent() {
  const { speak, stop, isPlaying } = useVapiTTS();

  const handleSpeak = async () => {
    await speak("Hello, I'm Ada!");
  };

  return (
    <button onClick={handleSpeak} disabled={isPlaying}>
      {isPlaying ? 'Speaking...' : 'Speak'}
    </button>
  );
}
```

### With Emotion

```tsx
// Happy voice
await speak("Great job! You did it!", { emotion: 'happy' });

// Calm voice
await speak("Let's take a deep breath together.", { emotion: 'calm' });

// Sad voice
await speak("I understand you're feeling sad.", { emotion: 'sad' });
```

### Available Emotions

- `happy` - More expressive, upbeat
- `sad` - Gentle, softer
- `angry` - Controlled, steady
- `scared` - Calm, reassuring
- `calm` - Very steady, peaceful
- Default (neutral) - Balanced

## Environment Variables

### Production (.env.local)

```bash
# Vapi TTS (server-side only - keeps key secure)
VAPI_PRIVATE_KEY=1e3ca5f8-49b6-4670-948b-97a969a60fcb

# Vapi Assistant ID (still needed for reference)
NEXT_PUBLIC_VAPI_ASSISTANT_ID=93d1cb35-9b6f-4292-92aa-c0d1a815d2ff
```

### Template (.env.example)

```bash
# Vapi Voice TTS (server-side private key)
VAPI_PRIVATE_KEY=your_vapi_private_key_here

# Vapi Assistant ID (public)
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_assistant_id_here
```

## Security

- **IMPORTANT**: The `VAPI_PRIVATE_KEY` is only used server-side in the API route
- Never expose the private key to the client
- The API route validates all requests
- Audio is generated on-demand and cached client-side

## Migration from SDK

### Before (Vapi SDK)

```tsx
// OLD - Complex WebSocket management
const { startSession, stopSession, isConnected } = useVapi();

useEffect(() => {
  startSession(); // Creates WebSocket, starts Deepgram
  return () => stopSession();
}, []);
```

### After (Simple TTS)

```tsx
// NEW - Simple function call
const { speak } = useVapiTTS();

// Just call when needed
await speak("Hello!");
```

## Benefits

✅ **No WebSocket connections** - Simple HTTP requests
✅ **No transcription/Deepgram** - TTS only, no listening
✅ **No UI freezing** - Non-blocking async calls
✅ **Fast response** - Cached audio for repeated phrases
✅ **Secure** - Private key stays on server
✅ **Simple** - Just call `speak()` when needed
✅ **Graceful degradation** - Fails silently if API unavailable

## Troubleshooting

### Audio Not Playing

1. Check that `VAPI_PRIVATE_KEY` is set in `.env.local`
2. Check browser console for API errors
3. Verify Vapi API endpoint is correct (currently `https://api.vapi.ai/speech`)
4. Test the API route directly:
   ```bash
   curl -X POST http://localhost:3000/api/vapi-tts \
     -H "Content-Type: application/json" \
     -d '{"text":"test"}'
   ```

### Verifying Vapi API Endpoint

The Vapi TTS endpoint may need adjustment. Check Vapi's documentation:
- Dashboard: https://vapi.ai/dashboard
- API Docs: https://docs.vapi.ai/

If `https://api.vapi.ai/speech` doesn't work, alternatives might include:
- `https://api.vapi.ai/v1/speech`
- `https://api.vapi.ai/assistant/say`

Contact Vapi support to confirm the correct endpoint for TTS-only usage.

### No Audio but No Errors

- Check that browser allows audio playback
- User interaction may be required before playing audio (browser autoplay policy)
- Check browser's autoplay policy in settings

### "Vapi not configured" Error

**Cause**: `VAPI_PRIVATE_KEY` environment variable is not set

**Solution**:
```bash
# 1. Verify .env.local has the correct key
cat .env.local | grep VAPI_PRIVATE_KEY

# 2. Restart dev server
npm run dev

# 3. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
```

### API Returns 401 Unauthorized

**Cause**: Invalid or expired private key

**Solution**:
1. Go to Vapi dashboard: https://vapi.ai/dashboard
2. Navigate to API Keys section
3. Generate a new **private key** (not public key)
4. Update `VAPI_PRIVATE_KEY` in `.env.local`
5. Restart the dev server

## Voice Configuration

The voice is configured in `app/api/vapi-tts/route.ts`:

```typescript
const VOICE_CONFIG = {
  provider: 'elevenlabs',
  voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah voice (child-friendly)
  model: 'eleven_turbo_v2_5',
  stability: 0.5,
  similarityBoost: 0.75,
};
```

### Changing the Voice

To use a different voice:
1. Browse ElevenLabs voices: https://elevenlabs.io/voice-library
2. Find a child-friendly voice
3. Copy the voice ID
4. Update `voiceId` in `VOICE_CONFIG`

### Adjusting Voice Settings

- **stability**: `0.0` to `1.0` (higher = more consistent)
- **similarityBoost**: `0.0` to `1.0` (higher = more similar to original)
- **speed**: Controlled by model (use faster model for quicker speech)

## Future Improvements

- Add audio preloading for common phrases
- Implement audio queue for multiple speaks
- Add volume control
- Add playback speed control
- Monitor Vapi API for rate limits
- Explore alternative TTS providers as fallback

## Support

- Vapi Dashboard: https://vapi.ai/dashboard
- Vapi Documentation: https://docs.vapi.ai/
- Vapi Support: support@vapi.ai
- Report Ada issues: [Internal issue tracker]

---

**Last Updated**: October 2024
**Implementation**: TTS-only (no SDK)
**Tested With**: Chrome 118+, Safari 17+, Firefox 119+
