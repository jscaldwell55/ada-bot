// lib/services/elevenLabsTTS.ts
// Dead simple ElevenLabs client with Web Speech fallback

export interface TTSOptions {
  emotion?: 'happy' | 'sad' | 'angry' | 'scared' | 'calm';
}

class ElevenLabsTTS {
  private audio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    this.stop();

    try {
      console.log('[ElevenLabs] Speaking:', text.substring(0, 50) + '...');

      // Call API
      const response = await fetch('/api/elevenlabs-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      // If failed, use Web Speech fallback
      if (!data.success || data.fallback) {
        console.log('[ElevenLabs] Falling back to Web Speech');
        this.webSpeechFallback(text, options);
        return;
      }

      // Play audio
      this.audio = new Audio(data.audioData);
      this.isPlaying = true;

      this.audio.onended = () => {
        console.log('[ElevenLabs] Playback complete');
        this.isPlaying = false;
        this.audio = null;
      };

      this.audio.onerror = (error) => {
        console.error('[ElevenLabs] Playback error:', error);
        this.isPlaying = false;
        this.audio = null;
        this.webSpeechFallback(text, options);
      };

      await this.audio.play();
      console.log('[ElevenLabs] Playing audio');

    } catch (error) {
      console.error('[ElevenLabs] Error:', error);
      this.webSpeechFallback(text, options);
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isPlaying = false;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private webSpeechFallback(text: string, options: TTSOptions): void {
    if (!('speechSynthesis' in window)) {
      console.warn('[ElevenLabs] Web Speech API not available');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // Adjust voice parameters based on emotion
    switch (options.emotion) {
      case 'happy':
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        break;
      case 'sad':
        utterance.rate = 0.85;
        utterance.pitch = 0.9;
        break;
      case 'angry':
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        break;
      case 'scared':
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        break;
      case 'calm':
        utterance.rate = 0.85;
        utterance.pitch = 0.95;
        break;
      default:
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
    }

    utterance.volume = 1.0;

    // Try to use a child-friendly voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (voice) =>
        voice.name.includes('Female') ||
        voice.name.includes('Samantha') ||
        voice.name.includes('Karen') ||
        voice.name.includes('Victoria')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.isPlaying = true;
    utterance.onend = () => {
      this.isPlaying = false;
    };
    utterance.onerror = () => {
      this.isPlaying = false;
    };

    window.speechSynthesis.speak(utterance);
    console.log('[ElevenLabs] Using Web Speech fallback');
  }
}

export const elevenLabsTTS = new ElevenLabsTTS();
