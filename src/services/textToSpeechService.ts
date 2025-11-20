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
    // Get the current session token
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Authentication required. Please log in to use text-to-speech.");
    }

    const res = await fetch(
      "/api/tts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ text, voice: options.voice }),
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

    // Handle JSON base64 or direct audio blob
    const okContentType = res.headers.get("Content-Type") || "";
    if (okContentType.includes("application/json")) {
      const data = await res.json();
      const base64 = data?.audioContent as string | undefined;
      if (!base64) throw new Error(data?.error || "Invalid TTS response");
      const byteChars = atob(base64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: "audio/mpeg" });
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
