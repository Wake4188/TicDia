
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

    // Perform a fast, lightweight per-character animation after first paint
    // Use a small batch size to reduce reflows on long texts
    const step = Math.max(1, Math.ceil(text.length / 200)); // ~200 steps max
    const interval = Math.max(12, speed); // keep it snappy but safe
    let i = 0;

    intervalRef.current = setInterval(() => {
      i = Math.min(text.length, i + step);
      setDisplayedText(text.slice(0, i));
      setProgress(Math.round((i / text.length) * 100));

      if (i >= text.length && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, interval) as unknown as NodeJS.Timeout;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, isActive, speed]);

  return { displayedText, progress };
};
