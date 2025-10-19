// lib/hooks/useElevenLabsTTS.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { elevenLabsTTS, TTSOptions } from '@/lib/services/elevenLabsTTS';

export interface UseElevenLabsTTSReturn {
  speak: (text: string, options?: TTSOptions) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
}

export function useElevenLabsTTS(): UseElevenLabsTTSReturn {
  const [isPlaying, setIsPlaying] = useState(false);

  // Poll playing state
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaying(elevenLabsTTS.getIsPlaying());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const speak = useCallback(async (text: string, options?: TTSOptions) => {
    await elevenLabsTTS.speak(text, options);
  }, []);

  const stop = useCallback(() => {
    elevenLabsTTS.stop();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      elevenLabsTTS.stop();
    };
  }, []);

  return { speak, stop, isPlaying };
}
