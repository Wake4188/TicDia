import React, { useState, useMemo, useCallback, useEffect } from "react";
import { detectComplexWords } from "@/services/wordComplexityService";
import { lookupWord } from "@/services/wiktionaryService";
import WordDefinitionTooltip from "./WordDefinitionTooltip";
import { useLanguage } from "@/contexts/LanguageContext";

interface HighlightedTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  isActive?: boolean;
}

// Cache for definition availability
const definitionCache = new Map<string, boolean>();

const HighlightedText = ({ text, className = "", style = {}, isActive = true }: HighlightedTextProps) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [verifiedWords, setVerifiedWords] = useState<Set<string>>(new Set());
  const { currentLanguage } = useLanguage();

  // Only detect complex words when active (current article)
  const complexWords = useMemo(() => {
    if (!isActive) return [];
    return detectComplexWords(text, currentLanguage.code);
  }, [text, isActive, currentLanguage.code]);

  // Verify which complex words actually have definitions
  useEffect(() => {
    if (!isActive || complexWords.length === 0) {
      setVerifiedWords(new Set());
      return;
    }

    const verifyWords = async () => {
      const verified = new Set<string>();
      
      // Check each complex word for available definition
      for (const cw of complexWords) {
        const cacheKey = `${currentLanguage.code}:${cw.word}`;
        
        // Check cache first
        if (definitionCache.has(cacheKey)) {
          if (definitionCache.get(cacheKey)) {
            verified.add(cw.word);
          }
          continue;
        }
        
        // Try to look up the definition
        try {
          const result = await lookupWord(cw.word, currentLanguage.code);
          const hasDefinition = result !== null;
          definitionCache.set(cacheKey, hasDefinition);
          if (hasDefinition) {
            verified.add(cw.word);
          }
        } catch {
          definitionCache.set(cacheKey, false);
        }
      }
      
      setVerifiedWords(verified);
    };

    verifyWords();
  }, [complexWords, currentLanguage.code, isActive]);

  const handleWordClick = useCallback((word: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setSelectedWord(word);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedWord(null);
  }, []);

  // Memoize the rendered text to avoid re-splitting on every render
  const renderedText = useMemo(() => {
    // Early return for inactive articles - no highlighting needed
    if (!isActive || verifiedWords.size === 0) {
      return <span className={className} style={style}>{text}</span>;
    }

    const words = text.split(/(\s+)/); // Split but keep whitespace

    return (
      <span className={className} style={style}>
        {words.map((segment, idx) => {
          // Normalize word by removing punctuation and lowercasing
          const normalizedWord = segment.toLowerCase().replace(/[^a-zA-ZÀ-ÿ]/g, '');

          if (verifiedWords.has(normalizedWord)) {
            return (
              <span
                key={idx}
                className="complex-word cursor-pointer border-b border-dashed border-primary/60 hover:bg-primary/10 transition-colors duration-200"
                onClick={(e) => handleWordClick(normalizedWord, e)}
                role="button"
                tabIndex={0}
                aria-label={`Get definition for ${normalizedWord}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleWordClick(normalizedWord, e as any);
                  }
                }}
              >
                {segment}
              </span>
            );
          }

          return <span key={idx}>{segment}</span>;
        })}
      </span>
    );
  }, [text, isActive, verifiedWords, className, style, handleWordClick]);

  return (
    <>
      {renderedText}

      {selectedWord && (
        <WordDefinitionTooltip
          word={selectedWord}
          onClose={handleClose}
          position={tooltipPosition}
        />
      )}
    </>
  );
};

export default React.memo(HighlightedText);
