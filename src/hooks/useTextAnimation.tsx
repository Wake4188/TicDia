
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

    console.log('Starting text animation for:', text.substring(0, 50) + '...');
    
    const words = text.split(' ');
    let currentWordIndex = 0;
    setDisplayedText('');
    setProgress(0);

    intervalRef.current = setInterval(() => {
      if (currentWordIndex < words.length) {
        const wordsToShow = words.slice(0, currentWordIndex + 1);
        setDisplayedText(wordsToShow.join(' '));
        setProgress(((currentWordIndex + 1) / words.length) * 100);
        currentWordIndex++;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, isActive, speed]);

  return { displayedText, progress };
};
