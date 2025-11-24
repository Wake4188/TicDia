// Service to fetch word definitions from Wiktionary API with Dictionary API fallback

export interface WordDefinition {
    partOfSpeech: string;
    language: string;
    definitions: {
        definition: string;
        examples?: string[];
    }[];
}

export interface WiktionaryResponse {
    [language: string]: WordDefinition[];
}

const cache = new Map<string, WiktionaryResponse>();

// Patterns that indicate useless definitions (grammatical forms)
const USELESS_PATTERNS = [
    /^plural\s+(of|form\s+of)\s+/i,
    /^simple\s+past(\s+tense)?\s+(of|form\s+of)\s+/i,
    /^past\s+participle\s+(of|form\s+of)\s+/i,
    /^present\s+participle\s+(of|form\s+of)\s+/i,
    /^comparative\s+(of|form\s+of)\s+/i,
    /^superlative\s+(of|form\s+of)\s+/i,
    /^alternative\s+(spelling|form)\s+of\s+/i,
    /^inflection\s+of\s+/i,
    /^third-person\s+singular\s+/i,
];

// Check if a definition is useless
function isUselessDefinition(definition: string): boolean {
    return USELESS_PATTERNS.some(pattern => pattern.test(definition.trim()));
}

// Filter out useless definitions from a word definition
function filterUselessDefinitions(wordDef: WordDefinition): WordDefinition | null {
    const filteredDefs = wordDef.definitions.filter(d => !isUselessDefinition(d.definition));

    if (filteredDefs.length === 0) {
        return null;
    }

    return {
        ...wordDef,
        definitions: filteredDefs
    };
}

// Fetch from Dictionary API as fallback
async function fetchFromDictionaryAPI(word: string): Promise<WiktionaryResponse | null> {
    try {
        const response = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
        );

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            return null;
        }

        // Transform Dictionary API format to our format
        const wordDefinitions: WordDefinition[] = [];

        for (const entry of data) {
            if (!entry.meanings) continue;

            for (const meaning of entry.meanings) {
                const definitions = meaning.definitions?.map((def: any) => ({
                    definition: def.definition || '',
                    examples: def.example ? [def.example] : []
                })) || [];

                if (definitions.length > 0) {
                    wordDefinitions.push({
                        partOfSpeech: meaning.partOfSpeech || 'unknown',
                        language: 'en',
                        definitions: definitions.slice(0, 3) // Limit to 3 definitions per part of speech
                    });
                }
            }
        }

        if (wordDefinitions.length === 0) {
            return null;
        }

        return { en: wordDefinitions };
    } catch (error) {
        console.error('Error fetching from Dictionary API:', error);
        return null;
    }
}

export async function lookupWord(word: string): Promise<WiktionaryResponse | null> {
    const normalizedWord = word.toLowerCase().trim();

    // Check cache first
    if (cache.has(normalizedWord)) {
        return cache.get(normalizedWord)!;
    }

    try {
        // Try Wiktionary first
        const response = await fetch(
            `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(normalizedWord)}`
        );

        if (response.ok) {
            const data: WiktionaryResponse = await response.json();

            // Filter out useless definitions
            if (data.en) {
                const filteredDefinitions = data.en
                    .map(filterUselessDefinitions)
                    .filter((def): def is WordDefinition => def !== null);

                if (filteredDefinitions.length > 0) {
                    const result = { en: filteredDefinitions };
                    cache.set(normalizedWord, result);
                    return result;
                }
            }
        }

        // If Wiktionary failed or returned only useless definitions, try Dictionary API
        const dictionaryResult = await fetchFromDictionaryAPI(normalizedWord);

        if (dictionaryResult) {
            cache.set(normalizedWord, dictionaryResult);
            return dictionaryResult;
        }

        return null;
    } catch (error) {
        console.error('Error fetching word definition:', error);

        // Try Dictionary API as final fallback
        try {
            const dictionaryResult = await fetchFromDictionaryAPI(normalizedWord);
            if (dictionaryResult) {
                cache.set(normalizedWord, dictionaryResult);
                return dictionaryResult;
            }
        } catch (fallbackError) {
            console.error('Dictionary API fallback also failed:', fallbackError);
        }

        return null;
    }
}

// Helper to get English definitions only
export function getEnglishDefinitions(response: WiktionaryResponse | null): WordDefinition[] {
    if (!response || !response.en) {
        return [];
    }
    return response.en;
}
