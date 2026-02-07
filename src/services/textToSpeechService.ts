import { supabase } from "@/integrations/supabase/client";

export interface TextToSpeechOptions {
  voice?: string;
  speed?: number;
}

const SUPABASE_URL = "https://rtuxaekhfwvpwmvmdaul.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dXhhZWtoZnd2cHdtdm1kYXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTc1NzMsImV4cCI6MjA2NTQ5MzU3M30.C6vl_5xJ69JuRIwSyK8H_uvdSU6CPEm4lYDkdhGn7lw";

// Fetch audio via Supabase Edge Function (streaming blob)
export const fetchTTSBlob = async (
  text: string,
  options: TextToSpeechOptions = {}
): Promise<Blob> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Authentication required. Please log in to use text-to-speech.");
    }

    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/tts-stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ text, voiceId: options.voice }),
      }
    );

    if (!res.ok) {
      let message = "TTS request failed";
      try {
        const contentType = res.headers.get("Content-Type") || "";
        if (contentType.includes("application/json")) {
          const err = await res.json();
          message = err?.error || message;
        } else {
          const txt = await res.text();
          message = txt || message;
        }
      } catch { }
      throw new Error(message);
    }

    return await res.blob();
  } catch (error) {
    console.error("TTS fetch failed:", error);
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
