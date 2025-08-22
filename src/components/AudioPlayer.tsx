import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { fetchTTSBlob, createAudioFromBlob, revokeAudioObjectUrl } from "@/services/textToSpeechService";
import { useToast } from "@/components/ui/use-toast";
import { useUserPreferences } from "@/hooks/useUserPreferences";

interface AudioPlayerProps {
  text: string;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
  autoPlay?: boolean;
}

const AudioPlayer = ({ text, onAudioStart, onAudioEnd, autoPlay = false }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([1]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { userPreferences, updatePreferences } = useUserPreferences();

  // Auto-play effect (after first manual play preference)
  useEffect(() => {
    if (autoPlay && userPreferences?.tts_autoplay && text) {
      handlePlayPause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, userPreferences?.tts_autoplay, text]);

  const handlePlayPause = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      onAudioEnd?.();
      return;
    }

    try {
      setIsLoading(true);

      // Enable autoplay for future articles if user manually starts TTS
      if (!userPreferences?.tts_autoplay) {
        await updatePreferences({ tts_autoplay: true });
      }

      onAudioStart?.();

      // Cleanup existing URL if any
      if (audioRef.current) {
        revokeAudioObjectUrl(audioRef.current);
      }

      const blob = await fetchTTSBlob(text);
      const audio = createAudioFromBlob(blob);
      audioRef.current = audio;

      // Apply current controls
      audio.volume = volume[0];
      audio.muted = isMuted;

      audio.onended = () => {
        setIsPlaying(false);
        onAudioEnd?.();
        revokeAudioObjectUrl(audioRef.current);
      };

      audio.onerror = () => {
        revokeAudioObjectUrl(audioRef.current);
        setIsPlaying(false);
        onAudioEnd?.();
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
        description: "Failed to play audio. Please try again.",
        variant: "destructive",
      });
      setIsPlaying(false);
      onAudioEnd?.();
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.muted = newMuted;
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume[0];
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 p-2 bg-background/60 backdrop-blur-sm rounded-lg border border-border/30 max-w-[280px] mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePlayPause}
        disabled={isLoading}
        className="h-7 w-7 p-0"
      >
        {isLoading ? (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : isPlaying ? (
          <Pause className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMute}
        className="h-7 w-7 p-0"
      >
        {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
      </Button>

      <div className="flex items-center gap-1 min-w-[60px]">
        <Slider
          value={volume}
          onValueChange={handleVolumeChange}
          max={1}
          step={0.1}
          className="flex-1 h-1"
        />
      </div>

      <span className="text-xs text-muted-foreground/80">
        Listen
      </span>
    </div>
  );
};

export default AudioPlayer;
