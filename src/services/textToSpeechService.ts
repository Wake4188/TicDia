import { supabase } from "@/integrations/supabase/client";

export interface TextToSpeechOptions {
  voice?: string;
  speed?: number;
}

export const convertTextToSpeech = async (
  text: string,
  options: TextToSpeechOptions = {}
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: {
        text,
        voice: options.voice || 'pNInz6obpgDQGcFmaJgB' // Default ElevenLabs voice
      }
    });

    if (error) throw error;
    
    return data.audioContent;
  } catch (error) {
    console.error('Text-to-speech conversion failed:', error);
    throw error;
  }
};

export const playAudioFromBase64 = (base64Audio: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const audioBlob = new Blob([
        new Uint8Array(
          atob(base64Audio)
            .split('')
            .map(char => char.charCodeAt(0))
        )
      ], { type: 'audio/mpeg' });
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        reject(new Error('Failed to play audio'));
      };
      
      audio.play();
    } catch (error) {
      reject(error);
    }
  });
};