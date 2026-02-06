import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { fetchTTSBlob, createAudioFromBlob, revokeAudioObjectUrl } from "@/services/textToSpeechService";
import { useToast } from "@/components/ui/use-toast";

interface InlineAudioButtonProps {
  text: string;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
}

const InlineAudioButton = ({ text, onAudioStart, onAudioEnd }: InlineAudioButtonProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const textRef = useRef(text);
  textRef.current = text;

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      revokeAudioObjectUrl(audioRef.current);
      audioRef.current = null;
    }
    setIsPlaying(false);
    onAudioEnd?.();
  }, [onAudioEnd]);

  const handleToggle = useCallback(async () => {
    if (isLoading) return;

    if (isPlaying) {
      stop();
      return;
    }

    try {
      setIsLoading(true);
      onAudioStart?.();

      if (audioRef.current) {
        revokeAudioObjectUrl(audioRef.current);
      }

      const blob = await fetchTTSBlob(textRef.current);
      const audio = createAudioFromBlob(blob);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        onAudioEnd?.();
        revokeAudioObjectUrl(audioRef.current);
        audioRef.current = null;
      };

      audio.onerror = () => {
        stop();
        toast({
          title: "Audio Error",
          description: "Failed to play audio. Please try again.",
          variant: "destructive",
        });
      };

      setIsPlaying(true);
      await audio.play();
    } catch (error) {
      console.error('Audio playback failed:', error);
      toast({
        title: "Audio Error",
        description: error instanceof Error ? error.message : "Failed to play audio.",
        variant: "destructive",
      });
      setIsPlaying(false);
      onAudioEnd?.();
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isPlaying, stop, onAudioStart, onAudioEnd, toast]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isLoading}
      className="text-foreground/60 hover:text-foreground hover:bg-foreground/10 h-9 w-9 rounded-full transition-all"
      aria-label={isPlaying ? "Stop audio" : "Listen to article"}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
    </Button>
  );
};

export default InlineAudioButton;