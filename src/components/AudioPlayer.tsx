import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { convertTextToSpeech, playAudioFromBase64 } from "@/services/textToSpeechService";
import { useToast } from "@/components/ui/use-toast";
import { useAnalyticsTracking } from "@/hooks/useAnalyticsTracking";

interface AudioPlayerProps {
  text: string;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
}

const AudioPlayer = ({ text, onAudioStart, onAudioEnd }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([1]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const handlePlayPause = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      onAudioEnd?.();
      return;
    }

    try {
      setIsLoading(true);
      const audioBase64 = await convertTextToSpeech(text);
      
      onAudioStart?.();
      setIsPlaying(true);
      
      await playAudioFromBase64(audioBase64);
      
      setIsPlaying(false);
      onAudioEnd?.();
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
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume[0];
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-background/80 backdrop-blur-sm rounded-lg border border-border/50">
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePlayPause}
        disabled={isLoading}
        className="h-8 w-8 p-0"
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMute}
        className="h-8 w-8 p-0"
      >
        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </Button>

      <div className="flex items-center gap-2 min-w-[80px]">
        <Slider
          value={volume}
          onValueChange={handleVolumeChange}
          max={1}
          step={0.1}
          className="flex-1"
        />
      </div>

      <span className="text-xs text-muted-foreground">
        Listen
      </span>
    </div>
  );
};

export default AudioPlayer;