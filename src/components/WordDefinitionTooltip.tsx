import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { lookupWord, getDefinitions, type WordDefinition } from "@/services/wiktionaryService";
import { useLanguage } from "@/contexts/LanguageContext";

interface WordDefinitionTooltipProps {
  word: string;
  onClose: () => void;
  position: { x: number; y: number };
}

const WordDefinitionTooltip = ({ word, onClose, position }: WordDefinitionTooltipProps) => {
  const [definitions, setDefinitions] = useState<WordDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { currentLanguage } = useLanguage();

  // Adjust tooltip position to stay within viewport
  useEffect(() => {
    if (!tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();
    const padding = 16; // Padding from screen edges

    let newX = position.x;
    let newY = position.y;

    // Check horizontal bounds
    const tooltipHalfWidth = rect.width / 2;

    // If tooltip would go off left edge
    if (position.x - tooltipHalfWidth < padding) {
      newX = tooltipHalfWidth + padding;
    }

    // If tooltip would go off right edge
    if (position.x + tooltipHalfWidth > window.innerWidth - padding) {
      newX = window.innerWidth - tooltipHalfWidth - padding;
    }

    // Check vertical bounds - if tooltip would go off top, show it below the word
    if (position.y - rect.height - 20 < padding) {
      // Position below the word instead of above
      newY = position.y + 60; // Below the word
    }

    // If tooltip would go off bottom
    if (newY + rect.height > window.innerHeight - padding) {
      newY = window.innerHeight - rect.height - padding;
    }

    setAdjustedPosition({ x: newX, y: newY });
  }, [position, definitions, isLoading]);

  useEffect(() => {
    const abortController = new AbortController();

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(false);

      try {
        // Use the current language for dictionary lookup
        const response = await lookupWord(word, currentLanguage.code);

        if (abortController.signal.aborted) return;

        const defs = getDefinitions(response, currentLanguage.code);

        if (defs.length > 0) {
          setDefinitions(defs);
        } else {
          setError(true);
        }

        setIsLoading(false);
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(true);
          setIsLoading(false);
        }
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [word, currentLanguage.code]);

  // Determine if tooltip should appear above or below
  const shouldShowBelow = position.y < 150;

  return (
    <>
      {/* Backdrop to close on outside click */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={tooltipRef}
        className="fixed z-[9999] bg-card/95 backdrop-blur-md rounded-lg shadow-2xl border border-border p-4 w-[90vw] max-w-sm"
        style={{
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
          transform: shouldShowBelow ? 'translate(-50%, 10px)' : 'translate(-50%, -110%)',
          maxHeight: 'calc(100vh - 100px)',
        }}
        role="dialog"
        aria-label={`Definition of ${word}`}
      >
        {/* Arrow indicator */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-card border-border rotate-45 ${
            shouldShowBelow
              ? '-top-1.5 border-l border-t'
              : '-bottom-1.5 border-r border-b'
          }`}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-foreground capitalize">{word}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1"
            aria-label="Close definition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading && (
          <div className="text-muted-foreground text-sm animate-pulse">Loading definition...</div>
        )}

        {error && (
          <div className="text-muted-foreground text-sm">No definition found for "{word}"</div>
        )}

        {!isLoading && !error && definitions.length > 0 && (
          <div className="space-y-3 max-h-60 overflow-y-auto overscroll-contain">
            {definitions.slice(0, 2).map((def, idx) => (
              <div key={idx} className="space-y-1">
                <div className="text-primary text-xs font-semibold uppercase tracking-wide">
                  {def.partOfSpeech}
                </div>
                <ul className="space-y-1.5">
                  {def.definitions.slice(0, 3).map((d, dIdx) => (
                    <li key={dIdx} className="text-sm text-foreground/90 leading-relaxed flex">
                      <span className="text-muted-foreground mr-2 flex-shrink-0">•</span>
                      <span>{d.definition.replace(/<[^>]*>/g, '')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Powered by <span className="text-foreground/70">Wiktionary</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(WordDefinitionTooltip);
