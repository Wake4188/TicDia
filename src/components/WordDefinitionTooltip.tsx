import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { lookupWord, getEnglishDefinitions, type WordDefinition } from "@/services/wiktionaryService";

interface WordDefinitionTooltipProps {
    word: string;
    onClose: () => void;
    position: { x: number; y: number };
}

const WordDefinitionTooltip = ({ word, onClose, position }: WordDefinitionTooltipProps) => {
    const [definitions, setDefinitions] = useState<WordDefinition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const abortController = new AbortController();

        // Debounce the fetch to avoid rapid API calls
        const timer = setTimeout(async () => {
            setIsLoading(true);
            setError(false);

            try {
                const response = await lookupWord(word);

                // Check if request was aborted
                if (abortController.signal.aborted) return;

                const englishDefs = getEnglishDefinitions(response);

                if (englishDefs.length > 0) {
                    setDefinitions(englishDefs);
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
        }, 150); // 150ms debounce

        return () => {
            clearTimeout(timer);
            abortController.abort();
        };
    }, [word]);

    return (
        <div
            className="fixed z-[9999] bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-700 p-4 max-w-sm"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: 'translate(-50%, -110%)'
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white capitalize">{word}</h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Close definition"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            {isLoading && (
                <div className="text-gray-400 text-sm">Loading definition...</div>
            )}

            {error && (
                <div className="text-gray-400 text-sm">No definition found for "{word}"</div>
            )}

            {!isLoading && !error && definitions.length > 0 && (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {definitions.slice(0, 2).map((def, idx) => (
                        <div key={idx} className="space-y-1">
                            <div className="text-tictok-red text-xs font-semibold uppercase">
                                {def.partOfSpeech}
                            </div>
                            <ul className="space-y-1">
                                {def.definitions.slice(0, 3).map((d, dIdx) => (
                                    <li key={dIdx} className="text-sm text-gray-300 leading-relaxed">
                                        <span className="text-gray-500 mr-2">•</span>
                                        <span dangerouslySetInnerHTML={{
                                            __html: d.definition.replace(/<[^>]*>/g, '')
                                        }} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            {/* Powered by Wiktionary */}
            <div className="mt-3 pt-2 border-t border-gray-700">
                <div className="text-xs text-gray-500">
                    Powered by <span className="text-gray-400">Wiktionary</span>
                </div>
            </div>
        </div>
    );
};

export default React.memo(WordDefinitionTooltip);
