import { supabase } from "@/integrations/supabase/client";

export interface TextToSpeechOptions {
  voice?: string;
  speed?: number; // not used in streaming version yet
}

// Fetch a streaming audio Blob via Vercel rewrite to Supabase Edge Function
export const fetchTTSBlob = async (
  text: string,
  options: TextToSpeechOptions = {}
): Promise<Blob> => {
  try {
    const res = await fetch(
      "/api/tts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      } catch {}
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
