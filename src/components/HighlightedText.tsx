import React, { useState, useMemo, useCallback } from "react";
import { detectComplexWords } from "@/services/wordComplexityService";
import WordDefinitionTooltip from "./WordDefinitionTooltip";

interface HighlightedTextProps {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    isActive?: boolean; // Only detect words when active
}

const HighlightedText = ({ text, className = "", style = {}, isActive = true }: HighlightedTextProps) => {
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    // Only detect complex words when active (current article)
    const complexWords = useMemo(() => {
        if (!isActive) return [];
        return detectComplexWords(text);
    }, [text, isActive]);

    // Create a set for quick lookup
    const complexWordSet = useMemo(() =>
        new Set(complexWords.map(cw => cw.word)),
        [complexWords]
    );

    const handleWordClick = useCallback((word: string, event: React.MouseEvent) => {
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
        if (!isActive || complexWordSet.size === 0) {
            return <span className={className} style={style}>{text}</span>;
        }

        const words = text.split(/(\s+)/); // Split but keep whitespace

        return (
            <span className={className} style={style}>
                {words.map((segment, idx) => {
                    const normalizedWord = segment.toLowerCase().replace(/[^a-z]/g, '');

                    if (complexWordSet.has(normalizedWord)) {
                        return (
                            <span
                                key={idx}
                                className="complex-word cursor-pointer border-b-2 border-tictok-red bg-tictok-red/20 hover:bg-tictok-red/30 px-0.5 rounded-sm transition-all duration-200"
                                onClick={(e) => handleWordClick(normalizedWord, e)}
                            >
                                {segment}
                            </span>
                        );
                    }

                    return <span key={idx}>{segment}</span>;
                })}
            </span>
        );
    }, [text, isActive, complexWordSet, className, style, handleWordClick]);

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
