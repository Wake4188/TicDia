import { supabase } from "@/integrations/supabase/client";

export interface TextToSpeechOptions {
  voice?: string;
  speed?: number; // not used in streaming version yet
}

// Fetch a streaming audio Blob from Supabase Edge Function
export const fetchTTSBlob = async (
  text: string,
  options: TextToSpeechOptions = {}
): Promise<Blob> => {
  try {
    const res = await fetch(
      'https://rtuxaekhfwvpwmvmdaul.supabase.co/functions/v1/tts-stream',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Public anon key, safe to send to Supabase Edge Functions
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dXhhZWtoZnd2cHdtdm1kYXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTc1NzMsImV4cCI6MjA2NTQ5MzU3M30.C6vl_5xJ69JuRIwSyK8H_uvdSU6CPEm4lYDkdhGn7lw',
        },
        body: JSON.stringify({ text, voiceId: options.voice }),
      }
    );

    if (!res.ok) {
      let message = 'TTS request failed';
      try {
        const err = await res.json();
        message = err?.error || message;
      } catch {}
      throw new Error(message);
    }

    return await res.blob();
  } catch (error) {
    console.error('TTS fetch failed:', error);
    throw error;
  }
};

// Utility to create an Audio element from a Blob and keep URL for cleanup
export const createAudioFromBlob = (blob: Blob): HTMLAudioElement => {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  (audio as any)._objectUrl = url;
  return audio;
};

export const revokeAudioObjectUrl = (audio: HTMLAudioElement | null) => {
  if (!audio) return;
  const url = (audio as any)._objectUrl as string | undefined;
  if (url) URL.revokeObjectURL(url);
};
