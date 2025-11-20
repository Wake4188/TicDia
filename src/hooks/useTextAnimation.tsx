
import { useState, useEffect, useRef } from 'react';

export const useTextAnimation = (
  text: string,
  isActive: boolean,
  speed: number = 80
) => {
  const [displayedText, setDisplayedText] = useState('');
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isActive || !text) {
      setDisplayedText('');
      setProgress(0);
      return;
    }

    // Consistent animation timing for optimal reading experience
    // Target: 30 characters per second (comfortable reading speed)
    // This means ~33ms per character for smooth, consistent animation
    const CHARS_PER_SECOND = 30;
    const MS_PER_CHAR = 1000 / CHARS_PER_SECOND; // ~33ms

    // For very smooth animation, reveal multiple characters per frame
    // but maintain the same overall speed
    const CHARS_PER_FRAME = 2; // Reveal 2 characters at a time
    const FRAME_INTERVAL = MS_PER_CHAR * CHARS_PER_FRAME; // ~66ms per frame

    let currentIndex = 0;

    intervalRef.current = setInterval(() => {
      currentIndex = Math.min(text.length, currentIndex + CHARS_PER_FRAME);
      setDisplayedText(text.slice(0, currentIndex));
      setProgress(Math.round((currentIndex / text.length) * 100));

      if (currentIndex >= text.length && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, FRAME_INTERVAL) as unknown as NodeJS.Timeout;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, isActive, speed]);

  return { displayedText, progress };
};
