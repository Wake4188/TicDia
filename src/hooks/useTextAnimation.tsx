
import { useState, useEffect } from 'react';

export const useTextAnimation = (
  text: string,
  isActive: boolean,
  speed: number = 80
) => {
  const [displayedText, setDisplayedText] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isActive || !text) {
      setDisplayedText('');
      setProgress(0);
      return;
    }

    const words = text.split(' ');
    let currentWordIndex = 0;
    setDisplayedText('');
    setProgress(0);

    const interval = setInterval(() => {
      if (currentWordIndex < words.length) {
        const wordsToShow = words.slice(0, currentWordIndex + 1);
        setDisplayedText(wordsToShow.join(' '));
        setProgress(((currentWordIndex + 1) / words.length) * 100);
        currentWordIndex++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, isActive, speed]);

  return { displayedText, progress };
};
