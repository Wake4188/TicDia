import { useState, useMemo } from "react";
import { detectComplexWords } from "@/services/wordComplexityService";
import WordDefinitionTooltip from "./WordDefinitionTooltip";

interface HighlightedTextProps {
    text: string;
    className?: string;
    style?: React.CSSProperties;
}

const HighlightedText = ({ text, className = "", style = {} }: HighlightedTextProps) => {
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    // Detect complex words
    const complexWords = useMemo(() => detectComplexWords(text), [text]);

    // Create a set for quick lookup
    const complexWordSet = useMemo(() =>
        new Set(complexWords.map(cw => cw.word)),
        [complexWords]
    );

    const handleWordClick = (word: string, event: React.MouseEvent) => {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setTooltipPosition({
            x: rect.left + rect.width / 2,
            y: rect.top
        });
        setSelectedWord(word);
    };

    // Split text into words and render with highlighting
    const renderHighlightedText = () => {
        const words = text.split(/(\s+)/); // Split but keep whitespace

        return words.map((segment, idx) => {
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
        });
    };

    return (
        <>
            <span className={className} style={style}>
                {renderHighlightedText()}
            </span>

            {selectedWord && (
                <WordDefinitionTooltip
                    word={selectedWord}
                    onClose={() => setSelectedWord(null)}
                    position={tooltipPosition}
                />
            )}
        </>
    );
};

export default HighlightedText;
