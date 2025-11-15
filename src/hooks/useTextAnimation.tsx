
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

    // Show full text immediately to prevent CLS issues
    // Text animation disabled for better performance and CLS score
    setDisplayedText(text);
    setProgress(100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, isActive, speed]);

  return { displayedText, progress };
};
